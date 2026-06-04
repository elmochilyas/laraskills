# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Authentication & Authorization
**Knowledge Unit:** Sanctum SPA Cookie Auth
**Generated:** 2026-06-03

---

# Decision Inventory

* Session driver selection (cookie vs file/database/redis)
* CORS SameSite cookie strategy (lax vs none)
* CSRF token refresh strategy

---

# Architecture-Level Decision Trees

---

## Session Driver Selection — cookie vs file/database/redis

---

## Decision Context

Which session driver should be used with Sanctum SPA cookie authentication? Arises when configuring the application for Sanctum SPA mode.

---

## Decision Criteria

* compatibility — Sanctum SPA mode requires cookie driver
* scalability — cookie driver is stateless (no server-side storage)
* performance — AES decryption per request vs file/DB reads
* data limits — cookie size constraints (4KB limit)

---

## Decision Tree

Are you using Sanctum SPA cookie authentication?
↓
YES → Must use `SESSION_DRIVER=cookie`
NO → Traditional web app with server-side sessions?
    YES → `file`, `database`, or `redis` as appropriate
    NO → API-only with no sessions → No session driver needed

---

## Rationale

Sanctum's `EnsureFrontendRequestsAreStateful` middleware reads session data from the encrypted cookie. File, database, and Redis session drivers are incompatible because the middleware expects session data to be embedded in the cookie itself.

---

## Recommended Default

**Default:** `SESSION_DRIVER=cookie`
**Reason:** Required by Sanctum SPA mode. Provides stateless authentication without server-side session storage.

---

## Risks Of Wrong Choice

Non-cookie session driver: Sanctum SPA auth silently fails, all requests appear unauthenticated with no error message.

---

## Related Rules

- Use Session Driver of cookie for SPA Auth (from 05-rules.md)
- Always Set SESSION_SECURE_COOKIE=true in Production (from 05-rules.md)

---

## Related Skills

- Implement Sanctum SPA Cookie Authentication (from 06-skills.md)

---

## CORS SameSite Cookie Strategy — lax vs none

---

## Decision Context

What SameSite attribute should be configured for Sanctum SPA cookies? Arises when configuring CORS and cookies for SPA authentication.

---

## Decision Criteria

* domain topology — same origin vs subdomain vs cross-domain
* browser compatibility — third-party cookie restrictions
* CSRF protection — SameSite=Lax provides built-in CSRF protection
* security — SameSite=None requires Secure and allows cross-site usage

---

## Decision Tree

Does the SPA share the same origin (protocol + domain + port) as the API?
↓
YES → `SameSite=Lax` — secure, no cross-origin cookie sending needed
NO → Is the SPA on a subdomain of the API domain?
    YES → `SameSite=None; Secure` — cookies sent cross-subdomain
    NO → Different top-level domains?
        YES → `SameSite=None; Secure` — but third-party cookie deprecation makes this fragile. Consider token auth instead.

---

## Rationale

SameSite=Lax provides optimal security for same-origin SPAs, preventing CSRF from external sites. Subdomain-separated SPAs need SameSite=None to allow cookies to be sent across subdomains. Different top-level domains face increasing browser restrictions on third-party cookies.

---

## Recommended Default

**Default:** `SameSite=Lax` (same-origin), `SameSite=None; Secure` (subdomain/cross-origin)
**Reason:** Lax provides CSRF protection for same-origin. None+Secure is required for cross-origin but requires HTTPS and faces browser deprecation pressure.

---

## Risks Of Wrong Choice

SameSite=Strict with subdomain separation: cookies not sent across subdomains, SPA cannot authenticate. SameSite=None over HTTP: browser rejects because Secure flag is required with None.

---

## Related Rules

- Always Set SESSION_SECURE_COOKIE=true in Production (from 05-rules.md)
- Configure SANCTUM_STATEFUL_DOMAINS Precisely (from 05-rules.md)

---

## Related Skills

- Implement Sanctum SPA Cookie Authentication (from 06-skills.md)
- Configure CORS for API Access (from 06-skills.md)

---

## CSRF Token Refresh Strategy

---

## Decision Context

When should the CSRF token be refreshed during SPA session? Arises when handling CSRF token expiration in Sanctum SPA auth.

---

## Decision Criteria

* user experience — seamless token refresh without disrupting navigation
* security — CSRF protection coverage
* token lifetime — default 2-hour expiration
* retry logic — handling 419 responses gracefully

---

## Decision Tree

Does the SPA session exceed the CSRF token lifetime (default 2 hours)?
↓
YES → Implement automatic CSRF refresh: catch 419 responses, re-fetch `/sanctum/csrf-cookie`, retry original request
NO → Single short session (<2 hours)?
    YES → Single CSRF fetch at login is sufficient
    NO → Unknown/intermittent usage?
        YES → Implement 419 retry logic (catch, refresh, retry)

---

## Rationale

Short sessions (<2 hours) only need a single CSRF token fetch at login. Longer sessions or long-lived SPAs need automatic 419 response handling: catch the error, re-fetch the CSRF cookie, and retry the original request. This prevents users from seeing cryptic errors after waking a sleeping tab.

---

## Recommended Default

**Default:** Implement 419 retry logic (catch, refresh, retry)
**Reason:** Handles CSRF expiration transparently regardless of session duration, providing a seamless user experience.

---

## Risks Of Wrong Choice

No 419 handling: users see "CSRF token mismatch" errors after long idle periods, requiring manual page refresh. Constant CSRF refreshing: unnecessary network requests, negating token expiration benefits.

---

## Related Rules

- Configure SANCTUM_STATEFUL_DOMAINS Precisely (from 05-rules.md)

---

## Related Skills

- Implement Sanctum SPA Cookie Authentication (from 06-skills.md)
