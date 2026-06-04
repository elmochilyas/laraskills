# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Sanctum SPA Cookie Auth vs Token Auth
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | SPA Cookie vs Bearer Token Mode | Choosing Sanctum auth mode per client type | security, architectural |
| 2 | Session Driver Selection | Session storage for SPA auth | performance, architectural |
| 3 | Subdomain Cookie Configuration | CORS + cookie settings for subdomain SPAs | architectural, security |

---

# Architecture-Level Decision Trees

---

## SPA Cookie vs Bearer Token Mode

---

## Decision Context

Choosing between Sanctum's SPA cookie auth (session-based) and Bearer token auth (token-based) for each API client type.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Is the client a browser-based SPA?
↓
YES → Is the SPA on the same domain or a subdomain of the Laravel backend?
    YES → SPA cookie auth (httpOnly cookie, CSRF protected, token not in JS scope)
    NO → Bearer token auth (cross-domain cookies are unreliable)
NO → Is the client a mobile or desktop app?
    YES → Bearer token auth (native HTTP clients, no browser cookie support)
    NO → Is this an M2M service account?
        YES → Bearer token auth (stateless, no user session)
        NO → Bearer token auth (third-party API consumer)

Can you enforce HTTPS with proper CORS configuration for subdomain cookies?
↓
YES → SPA cookie auth possible with `same_site=none` + `secure=true`
NO → Bearer token auth (cross-domain cookies not feasible)

---

## Rationale

SPA cookie auth provides superior browser security — `httpOnly` session cookies prevent XSS-based token theft, `Same-Site` cookies provide CSRF protection, and no token is stored in JavaScript-accessible storage. Bearer tokens stored in `localStorage` or `sessionStorage` are accessible to any JavaScript on the page. For non-browser clients (mobile, desktop, M2M), Bearer tokens are the only option.

---

## Recommended Default

**Default:** SPA cookie auth for same-domain/subdomain browser apps; Bearer token auth for mobile, cross-domain, M2M, and third-party clients
**Reason:** Cookie auth eliminates the XSS token theft vector for browser apps. Bearer tokens are necessary for non-browser clients and cross-domain scenarios where cookies cannot be relied upon.

---

## Risks Of Wrong Choice

- Bearer tokens in localStorage for SPAs: XSS vulnerability, token theft via script injection
- SPA cookie auth for mobile: cookies not available in native HTTP clients
- SPA cookie auth for cross-domain without proper CORS: browser blocks credentials, 401 errors
- No CSRF protection for SPA cookie auth: missing /sanctum/csrf-cookie call causes 419 errors

---

## Related Rules

- Use SPA Cookie Auth for Same-Domain Browser Apps (05-rules.md)
- Configure SANCTUM_STATEFUL_DOMAINS for SPA Cookie Auth (05-rules.md)
- Always Call /sanctum/csrf-cookie Before SPA Login (05-rules.md)
- Store Bearer Tokens Securely, Not in localStorage (05-rules.md)

---

## Related Skills

- Configure Sanctum SPA Cookie Auth vs Token Auth for Appropriate Client Types (06-skills.md)
- Scope Sanctum API Tokens with Abilities (06-skills.md)

---

## Session Driver Selection

---

## Decision Context

Choosing the session storage driver for Sanctum SPA cookie auth — file, database, Redis, or memcached.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is this a single-server deployment?
↓
YES → Is this a development environment?
    YES → File session driver (simple, no setup)
    NO → Production single-server with adequate disk I/O?
        YES → File session driver (acceptable for single-server)
        NO → Redis or database (faster, more reliable)
NO → Multi-server deployment?
    YES → Redis (shared session storage, network-accessible, fast)
    NO → Memcached (alternative to Redis, no persistence)
        NO → Database session driver (shared storage, slower reads/writes)

Are sessions long-lived with infrequent access?
↓
YES → Database driver acceptable (sessions stored in DB)
NO → Redis (fast reads/writes for active sessions)

---

## Rationale

File session driver does not work across multiple servers — each server has its own session files, causing intermittent 401 errors. Redis is the production standard for multi-server deployments: fast, shared, supports session persistence. Database sessions work across servers but are slower than Redis. File sessions are acceptable for single-server development.

---

## Recommended Default

**Default:** Redis for multi-server production; file for single-server development
**Reason:** Redis provides fast, shared session storage that works across all servers. File sessions are simple for development. Database sessions are a fallback when Redis is unavailable but are significantly slower.

---

## Risks Of Wrong Choice

- File sessions on multi-server: intermittent 401 errors, user logged out on different server
- Database sessions on high-traffic: slow reads/writes, database connection pool exhaustion
- No session driver configured: Sanctum SPA auth will not work at all
- Redis without persistence: session data lost on Redis restart (acceptable for sessions but may surprise)

---

## Related Rules

- Use Production-Ready Session Driver for SPA Auth (05-rules.md)
- Regenerate Session ID After Login for SPA Auth (05-rules.md)
- Enable CORS With Credentials for SPA Subdomain Auth (05-rules.md)

---

## Related Skills

- Configure Sanctum SPA Cookie Auth vs Token Auth for Appropriate Client Types (06-skills.md)
- Configure Laravel Session Settings (06-skills.md)

---

## Subdomain Cookie Configuration

---

## Decision Context

Configuring Sanctum SPA cookie auth when the SPA is hosted on a different subdomain than the Laravel backend (e.g., `app.example.com` SPA, `api.example.com` backend).

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Is the SPA on a different subdomain than the backend?
↓
YES → Same root domain?
    YES → CORS with credentials + `SESSION_DOMAIN=.example.com` + `same_site=none` + `secure=true`
    NO → Cannot use SPA cookie auth (different root domains) — use Bearer tokens
NO → Same domain (SPA and backend on same domain)?
    YES → Standard SPA cookie auth (SANCTUM_STATEFUL_DOMAINS only, default session config)

Are cookies set with `Secure` flag?
↓
YES → `same_site=none` requires `Secure=true` (HTTPS mandatory)
NO → All subdomain cookie attempts will fail

Is CORS configured with `supports_credentials: true`?
↓
YES → Allowed origins must be specific (not `*`)
NO → Browser blocks credentials on cross-origin requests

---

## Rationale

Subdomain cookie auth requires: `SANCTUM_STATEFUL_DOMAINS` with the SPA domain, `SESSION_DOMAIN` set to the parent domain (`.example.com`), `same_site=none` so the browser sends cookies cross-subdomain, and `secure=true` because `same_site=none` requires HTTPS. CORS must allow credentials from the SPA origin. Without any of these, subdomain auth fails silently.

---

## Recommended Default

**Default:** Same-domain deployment for simplicity; subdomain config only when domain separation is required
**Reason:** Same-domain SPA auth avoids the complexity of CORS, `same_site=none`, and `SESSION_DOMAIN` configuration. Use subdomain config only when the SPA and API must be on separate subdomains (e.g., different deployment units, organizational boundaries).

---

## Risks Of Wrong Choice

- Missing `SANCTUM_STATEFUL_DOMAINS`: SPA returns 401 on all requests
- Missing `SESSION_DOMAIN`: cookies set for API subdomain only, not shared with SPA
- `same_site=lax` on subdomain setup: cookies not sent cross-subdomain
- `same_site=none` without `secure=true`: browser rejects cookies (no HTTPS)
- CORS with `*` origin and credentials: browser blocks the request (credentials require specific origin)

---

## Related Rules

- Configure SANCTUM_STATEFUL_DOMAINS for SPA Cookie Auth (05-rules.md)
- Enable CORS With Credentials for SPA Subdomain Auth (05-rules.md)
- Use SPA Cookie Auth for Same-Domain Browser Apps (05-rules.md)

---

## Related Skills

- Configure Sanctum SPA Cookie Auth vs Token Auth for Appropriate Client Types (06-skills.md)
- Configure CORS for API Integration (06-skills.md)
