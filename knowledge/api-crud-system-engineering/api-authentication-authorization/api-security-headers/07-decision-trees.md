# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Authentication & Authorization
**Knowledge Unit:** API Security Headers
**Generated:** 2026-06-03

---

# Decision Inventory

* Middleware-level vs Reverse-proxy-level header injection
* CSP strictness for JSON APIs vs HTML-rendering endpoints
* HSTS gradual rollout strategy
* Cache-Control policy per route type

---

# Architecture-Level Decision Trees

---

## Middleware-Level vs Reverse-Proxy-Level Header Injection

---

## Decision Context

Where should security headers be applied — in Laravel middleware or at the reverse proxy (Nginx, Cloudflare)? Arises during initial API infrastructure setup.

---

## Decision Criteria

* control granularity — per-route vs per-server header customization
* performance — server-side vs application-layer header addition
* deployment topology — single server vs load-balanced with proxy
* development consistency — headers present in all environments

---

## Decision Tree

Do you have a reverse proxy (Nginx, Cloudflare, AWS ALB)?
↓
YES → Does the proxy support custom header configuration?
    YES → Configure at proxy level (Nginx/Cloudflare)
    NO → Use Laravel middleware
NO → Use Laravel middleware

When both are available:
→ Single server or simple setup? → Laravel middleware (simpler)
→ Load-balanced with dedicated proxy team? → Proxy level (centralized)

---

## Rationale

Proxy-level headers are more performant (no PHP execution) and centralized. Laravel middleware provides granular per-route control and works in all environments. Using both causes duplication or conflicts. Choose based on deployment topology — middleware is simpler and sufficient for most setups.

---

## Recommended Default

**Default:** Laravel single middleware class
**Reason:** Works in all environments, provides per-route granularity, no dependency on proxy configuration, and ensures headers are present during development.

---

## Risks Of Wrong Choice

Proxy-level only: headers missing in development environments, harder to test. Middleware only: unnecessary PHP overhead for each request if already terminating TLS at proxy. Both: duplicated headers causing browser confusion.

---

## Related Rules

- Use a Single Dedicated Middleware for All Security Headers (from 05-rules.md)
- Set X-Content-Type-Options: nosniff on Every Response (from 05-rules.md)

---

## Related Skills

- Implement API Security Headers (from 06-skills.md)
- API-Specific Middleware (from 06-skills.md)

---

## CSP Strictness for JSON APIs vs HTML-Rendering Endpoints

---

## Decision Context

How restrictive should the Content-Security-Policy be? Arises when configuring CSP for different types of responses.

---

## Decision Criteria

* response type — JSON API responses vs HTML-rendered views
* browser behavior — CSP enforcement differences for non-HTML content
* development convenience — overly strict CSP blocking legitimate tools
* security surface — reducing XSS attack vectors

---

## Decision Tree

What type of response are you serving?
↓
JSON API response?
YES → `default-src 'none'` (restrict everything)
NO → HTML-rendered view?
    YES → `default-src 'self'` with specific allowances
    NO → File download/stream → no CSP needed

---

## Rationale

CSP for JSON API responses is straightforward — JSON is not executed by the browser, so `default-src 'none'` is the safest choice. HTML-rendering endpoints need more permissive policies to load scripts, styles, and fonts. Using `default-src 'self'` for APIs is unnecessarily permissive with no benefit.

---

## Recommended Default

**Default:** `default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests`
**Reason:** Maximum restriction for JSON APIs eliminates XSS vectors entirely. No legitimate resource needs to load when the response is JSON.

---

## Risks Of Wrong Choice

Overly permissive CSP (`default-src 'self'`): allows unnecessary resource loading, increases XSS attack surface. No CSP at all: no protection against injection attacks.

---

## Related Rules

- Set X-Content-Type-Options: nosniff on Every Response (from 05-rules.md)

---

## Related Skills

- Implement API Security Headers (from 06-skills.md)

---

## HSTS Gradual Rollout Strategy

---

## Decision Context

What HSTS max-age and preload configuration should be used during rollout? Arises when deploying HSTS for the first time or modifying existing HSTS policy.

---

## Decision Criteria

* safety margin — avoiding irreversible lockout from HTTPS misconfiguration
* subdomain readiness — all subdomains must support HTTPS for `includeSubDomains`
* preload commitment — once preloaded, cannot be easily removed
* environment differences — HSTS in development vs production

---

## Decision Tree

Have you verified all subdomains support HTTPS?
↓
YES → Are you ready for preload commitment?
    YES → `max-age=31536000; includeSubDomains; preload`
    NO → `max-age=31536000; includeSubDomains` (no preload)
NO → Start monitoring phase:
    → `max-age=86400` (24 hours) for 1 week
    → Increase to `max-age=31536000` after verification

---

## Rationale

HSTS is irreversible within the max-age period. A gradual rollout starts with short max-age to detect HTTPS issues, then increases. `includeSubDomains` requires all subdomains to support HTTPS. Preload registration is a permanent commitment — only add when verified.

---

## Recommended Default

**Default:** `max-age=31536000; includeSubDomains` (production), `max-age=86400` (development)
**Reason:** 1 year is the standard production value. 24 hours in development prevents lockout during testing.

---

## Risks Of Wrong Choice

Too-short max-age: returning visitors not protected. Preload without verification: permanent browser enforcement even if HTTPS breaks. `includeSubDomains` without checking subdomains: non-HTTPS subdomains become inaccessible.

---

## Related Rules

- Always Send Strict-Transport-Security Over HTTPS Only (from 05-rules.md)

---

## Related Skills

- Implement API Security Headers (from 06-skills.md)

---

## Cache-Control Policy per Route Type

---

## Decision Context

What Cache-Control policy should be applied to different API routes? Arises when configuring security middleware for authenticated vs public endpoints.

---

## Decision Criteria

* data sensitivity — authenticated responses containing user data must not be cached
* public vs private — shared proxy cache behavior
* route type — public resources that benefit from caching
* security — preventing cross-user data leakage from shared caches

---

## Decision Tree

Does the route contain sensitive/authenticated data?
↓
YES → `Cache-Control: no-store, private` (never cache)
NO → Public read-only resource?
    YES → `Cache-Control: public, max-age=3600` (cacheable)
    NO → Error response → `Cache-Control: no-cache, no-store`

---

## Rationale

Authenticated responses with user-specific data must never be cached in shared proxies — `no-store, private` prevents leakage. Public endpoints like documentation or version metadata benefit from caching. Error responses should not be cached to ensure clients receive fresh error data.

---

## Recommended Default

**Default:** `Cache-Control: no-store, private` for all authenticated routes
**Reason:** Safest default that prevents any possibility of cross-user data leakage. Cache only explicitly public, non-sensitive resources.

---

## Risks Of Wrong Choice

Missing Cache-Control on authenticated routes: user data served from shared proxy cache to other users. Overly permissive caching on public routes: stale data served to clients.

---

## Related Rules

- Set X-Content-Type-Options: nosniff on Every Response (from 05-rules.md)

---

## Related Skills

- Implement API Security Headers (from 06-skills.md)
