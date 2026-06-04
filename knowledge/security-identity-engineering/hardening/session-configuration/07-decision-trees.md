# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** Session Configuration (secure, http_only, same_site)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Session Driver Selection | Session storage mechanism | performance, architectural |
| 2 | same_site Cookie Attribute | Cross-origin cookie behavior | security, architectural |
| 3 | Session Lifetime Duration | Session expiry time | security, user-experience |

---

# Architecture-Level Decision Trees

---

## Session Driver Selection

---

## Decision Context

Choosing the session storage driver: `file`, `database`, `redis`, `memcached`, `cookie`, or `dynamodb`.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is this a single-server deployment?
↓
YES → Is this development/staging?
    YES → File session (simple, no setup)
    NO → Production single-server?
        YES → File session acceptable (single server)
        NO → Redis or database for reliability
NO → Multi-server deployment?
    YES → Redis (fastest, shared, persistent)
    NO → Database or DynamoDB as alternatives

Is high-performance session access critical?
↓
YES → Redis (in-memory, sub-millisecond reads)
NO → Database sessions (adequate, scales horizontally)

Is session data persistence important?
↓
YES → Redis with persistence or database
NO → Memcached (volatile, sessions lost on restart)

---

## Rationale

File sessions work for single-server deployments but fail in multi-server setups (sessions not shared). Redis is the production standard — fast, shared, supports persistence. Database sessions are simpler to set up (no Redis server needed) but slower. Cookie sessions store data client-side (4KB limit, no server-side GC).

---

## Recommended Default

**Default:** Redis for multi-server production; file for single-server dev; database as fallback when Redis unavailable
**Reason:** Redis provides the best performance and reliability for production sessions. File sessions are acceptable only for single-server deployments where session sharing is not needed.

---

## Risks Of Wrong Choice

- File on multi-server: intermittent logouts, session mismatch between servers
- Database on high-traffic: connection pool exhaustion, slow reads
- Cookie sessions: 4KB limit, data visible to client, no server-side invalidation
- No session driver configured: sessions don't persist across requests

---

## Related Rules

- Use Database or Redis Sessions in Production, Never File Sessions (05-rules.md)
- Set session.lifetime to a Reasonable Short Duration (05-rules.md)
- Enable Session HTTP-Only and Secure Flags (05-rules.md)

---

## Related Skills

- Configure Secure Session Settings for Production (06-skills.md)

---

## same_site Cookie Attribute

---

## Decision Context

Setting the `same_site` attribute on session cookies — `lax`, `strict`, or `none`.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Is the application using Sanctum SPA cookie auth with the frontend on a different subdomain?
↓
YES → `same_site=none` with `secure=true` (allows cross-subdomain cookie sending)
NO → Is the application on a single domain with server-rendered pages?
    YES → `same_site=lax` (good CSRF protection, top-level GET navigation works)
    NO → `same_site=strict` (highest security, but breaks external links to your app)

Does the application need to receive session cookies from external links?
↓
YES → `same_site=lax` (cookie sent for top-level GET navigations)
NO → `same_site=strict` (cookie never sent cross-origin, best security)

Are all requests HTTPS?
↓
YES → `same_site=none` is possible (requires `secure=true`)
NO → `same_site=none` not possible (browsers reject without HTTPS)

---

## Rationale

`same_site=lax` is the default and best balance — it prevents CSRF from external forms while allowing users to follow links to your application with their session. `strict` provides maximum security but breaks external links (users are logged in but treated as guests). `none` is only needed for Sanctum SPA cross-domain cookie auth and requires HTTPS.

---

## Recommended Default

**Default:** `same_site=lax` for most applications; `none` only for Sanctum SPA cross-subdomain auth (with `secure=true`)
**Reason:** `lax` provides strong CSRF protection without breaking normal navigation flows. `none` is an exception for specific CORS architectures. `strict` is overly restrictive for most applications.

---

## Risks Of Wrong Choice

- `lax` when `none` needed: Sanctum SPA auth fails (cookies not sent cross-subdomain)
- `none` without `secure`: browser rejects cookie
- `strict` for user-facing app: users clicking external links to your app are not authenticated
- Missing `same_site` entirely: modern browsers default to `lax` (safe default, but be explicit)

---

## Related Rules

- Enable Session HTTP-Only and Secure Flags (05-rules.md)
- Rotate Session ID on Login and Privilege Escalation (05-rules.md)
- Set session.lifetime to a Reasonable Short Duration (05-rules.md)

---

## Related Skills

- Configure Secure Session Settings for Production (06-skills.md)

---

## Session Lifetime Duration

---

## Decision Context

Setting the session `lifetime` (expiry in minutes) and `expire_on_close` behavior.

---

## Decision Criteria

* security
* user-experience

---

## Decision Tree

Is this a high-security application (finance, healthcare, admin panel)?
↓
YES → Short session (15-30 minutes) + `expire_on_close=true`
NO → Is this a consumer application with moderate usage?
    YES → Standard session (120 minutes) + `expire_on_close=false`
    NO → Is this a public kiosk or shared computer?
        YES → Short session (15 minutes) + `expire_on_close=true`
        NO → Standard session (120 minutes)

Do users need "remember me" functionality?
↓
YES → Use `remember_token` (not long session lifetime) — token persists, session does not
NO → Session-only authentication

Are there compliance requirements for session duration?
↓
YES → Align with compliance (SOC2, HIPAA, PCI DSS typically require inactivity timeout ≤ 15-30 min)
NO → UX/business requirements determine duration

---

## Rationale

Session lifetime balances security (shorter = less hijacking risk) with UX (longer = fewer re-authentication prompts). The standard 120 minutes works for most applications. High-security apps should use shorter lifetimes. `expire_on_close=true` adds protection for shared computers. "Remember me" tokens provide persistent login for returning users without extending the session lifetime.

---

## Recommended Default

**Default:** 120 minutes lifetime, `expire_on_close=false` for most apps; 15-30 minutes for sensitive apps
**Reason:** 120 minutes is the standard Laravel default and balances security with UX. Use shorter lifetimes for admin panels and security-sensitive applications. Use "remember me" tokens for persistent login instead of extending session lifetime.

---

## Risks Of Wrong Choice

- Very long lifetime (days): excessive hijacking window, stale sessions in database
- Very short lifetime (1-5 min): constant re-authentication, poor UX
- No session expiry: sessions never expire, users stay logged in indefinitely
- Relying on session lifetime for "remember me": should use remember_token instead

---

## Related Rules

- Set session.lifetime to a Reasonable Short Duration (05-rules.md)
- Rotate Session ID on Login and Privilege Escalation (05-rules.md)

---

## Related Skills

- Configure Secure Session Settings for Production (06-skills.md)
