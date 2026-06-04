# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Authentication & Authorization
**Knowledge Unit:** CORS Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

* Origin strategy — explicit whitelist vs dynamic origin matching
* CORS layer — Laravel middleware vs reverse proxy (Nginx)
* Credentialed vs non-credentialed CORS mode
* Preflight max-age duration

---

# Architecture-Level Decision Trees

---

## Origin Strategy — Explicit Whitelist vs Dynamic Origin Matching

---

## Decision Context

How should allowed origins be configured? Arises during CORS configuration for API access from browser-based clients.

---

## Decision Criteria

* security — preventing unauthorized origin access
* multi-tenancy — supporting customer-specific custom domains
* operational complexity — updating the allowed origins list
* performance — static vs dynamic origin resolution

---

## Decision Tree

Does your application serve multiple tenants with custom domains?
↓
YES → Dynamic origin matching (with caching)
NO → Fixed known client origins?
    YES → Explicit whitelist
    NO → Single known origin?
        YES → Explicit whitelist (single entry)
        NO → Public API with no auth → Allow `*` without credentials

---

## Rationale

Explicit whitelists are auditable, performant, and eliminate origin injection risk. Dynamic matching is only needed for multi-tenant architectures where tenant origins are unknown at deploy time. When using dynamic matching, cache the allowed origins list to avoid per-request database queries.

---

## Recommended Default

**Default:** Explicit whitelist of known origins
**Reason:** Security (no origin injection), performance (static resolution), auditability (clear allowed list), and simplicity.

---

## Risks Of Wrong Choice

Dynamic matching without caching: per-request database queries, increased latency, potential origin injection. Static whitelist for multi-tenant: requires deployment for every new tenant.

---

## Related Rules

- Never Use Wildcard Origin with Credentials (from 05-rules.md)
- Whitelist Explicit Origins in Production (from 05-rules.md)

---

## Related Skills

- Configure CORS for API Access (from 06-skills.md)

---

## CORS Layer — Laravel Middleware vs Reverse Proxy

---

## Decision Context

Should CORS headers be handled by Laravel middleware or the reverse proxy (Nginx, Cloudflare)? Arises during infrastructure setup for browser-facing APIs.

---

## Decision Criteria

* performance — PHP execution vs Nginx-level handling
* control granularity — per-route vs global CORS policies
* deployment consistency — same config across environments
* team expertise — who manages the proxy configuration

---

## Decision Tree

Do you have a reverse proxy with CORS capabilities (Nginx, Cloudflare)?
↓
YES → Can the proxy team manage CORS config changes?
    YES → Proxy-level CORS (faster, centralized)
    NO → Laravel middleware (simpler, more flexible)
NO → Laravel middleware (only option)

If both are available:
→ Single origin, simple rules → Proxy level
→ Per-route varying policies → Laravel middleware

---

## Rationale

Proxy-level CORS is more performant (no PHP execution) and provides a single point of configuration. Laravel middleware offers per-route granularity and works in all environments without proxy dependency. Running both causes header duplication — pick one layer.

---

## Recommended Default

**Default:** Laravel middleware via `config/cors.php`
**Reason:** Works in all environments, per-route granularity, no proxy dependency, and familiar Laravel configuration pattern.

---

## Risks Of Wrong Choice

Proxy-level only: CORS not present in development, harder to test. Laravel only: unnecessary PHP overhead. Both: duplicated headers causing browser warnings or failures.

---

## Related Rules

- Whitelist Explicit Origins in Production (from 05-rules.md)
- Include Authorization and Content-Type in Allowed Headers (from 05-rules.md)

---

## Related Skills

- Configure CORS for API Access (from 06-skills.md)

---

## Credentialed vs Non-Credentialed CORS Mode

---

## Decision Context

Should CORS support credentials (cookies, auth headers)? Arises when determining whether the API needs to support authenticated browser requests.

---

## Decision Criteria

* auth mechanism — cookie-based (Sanctum SPA) vs token-based (Bearer)
* client type — browser SPA vs mobile/native app
* security — exposure to credential-based CSRF
* CORS restrictions — `Access-Control-Allow-Origin: *` disallowed with credentials

---

## Decision Tree

Does the API use cookie-based authentication (Sanctum SPA)?
↓
YES → Credentialed mode required
    → `supports_credentials: true`
    → Explicit origin (never `*`)
NO → Token-based auth (Bearer)?
    YES → Credentialed mode optional
        → Does the client send auth in headers? → Non-credentialed (safe)
        → Does the client send cookies? → Credentialed mode required
NO → Public API with no auth → Non-credentialed mode

---

## Rationale

Credentialed mode is mandatory for cookie-based auth (Sanctum SPA) because cookies are credentials. Token-based auth sent via Authorization headers may work without credentials mode, but the browser still sends any cookies associated with the domain. Non-credentialed mode is simpler and avoids the `Access-Control-Allow-Origin: *` restriction.

---

## Recommended Default

**Default:** Non-credentialed mode (unless cookie auth is used)
**Reason:** Simpler configuration, allows wildcard origin, avoids credential-based CSRF concerns.

---

## Risks Of Wrong Choice

Missing credentials mode with cookie auth: all authenticated requests fail with CORS errors. Credentials mode with wildcard origin: browser rejects the combination, breaking all requests.

---

## Related Rules

- Never Use Wildcard Origin with Credentials (from 05-rules.md)
- Include Authorization and Content-Type in Allowed Headers (from 05-rules.md)

---

## Related Skills

- Configure CORS for API Access (from 06-skills.md)
- Sanctum SPA Cookie Auth (from 06-skills.md)

---

## Preflight Max-Age Duration

---

## Decision Context

How long should CORS preflight responses be cached? Arises during CORS configuration for production APIs.

---

## Decision Criteria

* performance — reducing OPTIONS request frequency
* configuration agility — time to propagate CORS changes to clients
* client behavior — respecting the Max-Age header
* environment differences — development vs production needs

---

## Decision Tree

Is this a production environment?
↓
YES → Are CORS policies stable (rarely change)?
    YES → `max_age: 86400` (24 hours)
    NO → Frequent CORS changes?
        YES → `max_age: 3600` (1 hour)
        NO → `max_age: 86400` (safe default)
NO → Development environment?
    YES → `max_age: 0` or `max_age: 600` (no cache / short cache)

---

## Rationale

Long preflight caching (24 hours) reduces OPTIONS requests to 1 per origin per day, significantly reducing overhead. During development, short or no caching ensures CORS configuration changes take effect immediately. Production environments with frequent CORS policy changes should use shorter cache to allow faster propagation.

---

## Recommended Default

**Default:** `86400` (24 hours) for production
**Reason:** Optimal balance — one OPTIONS request per origin per day, minimizes latency impact while allowing reasonable configuration update time.

---

## Risks Of Wrong Choice

No caching (max_age=0): every non-simple request triggers OPTIONS, doubling API call volume. Too-long cache in development: delayed feedback on CORS config changes, debugging difficulty.

---

## Related Rules

- Whitelist Explicit Origins in Production (from 05-rules.md)

---

## Related Skills

- Configure CORS for API Access (from 06-skills.md)
