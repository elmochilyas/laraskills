# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** CSRF Token Exchange and Validation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | CSRF Token Source Selection | @csrf vs Sanctum cookie vs meta tag | architectural, security |
| 2 | Route Exclusion Strategy | When to exclude routes from CSRF protection | security |

---

# Architecture-Level Decision Trees

---

## CSRF Token Source Selection

---

## Decision Context

How to provide the CSRF token to the client — Blade `@csrf`, Sanctum `XSRF-TOKEN` cookie, or meta tag with `X-CSRF-TOKEN` header.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Is the frontend a server-rendered Blade template?
↓
YES → `@csrf` directive in forms (standard Laravel approach)
NO → Is the frontend a Sanctum SPA (Axios, same-domain)?
    YES → Sanctum `/sanctum/csrf-cookie` endpoint + XSRF-TOKEN cookie (Axios auto-sends)
    NO → Is the frontend Inertia or a custom JS framework?
        YES → Meta tag (`<meta name="csrf-token">`) + `X-CSRF-TOKEN` header
        NO → Is this a stateless API client?
            YES → No CSRF needed (token-based auth, CSRF not applicable)
            NO → Sanctuum SPA or Inertia approach

---

## Rationale

Each approach matches a frontend architecture. `@csrf` is for server-rendered Blade. Sanctum's `/sanctum/csrf-cookie` is for SPAs using Sanctum cookie auth. The meta tag approach works for Inertia and custom JS frontends where the token needs to be programmatically accessible.

---

## Recommended Default

**Default:** Blade `@csrf` for server-rendered forms; Sanctum `/sanctum/csrf-cookie` + Axios for SPAs; meta tag for Inertia/custom JS
**Reason:** Each approach matches its frontend architecture's conventions. Mixing them causes configuration issues (e.g., using `@csrf` in an SPA won't provide the CSRF token to JavaScript).

---

## Risks Of Wrong Choice

- `@csrf` for SPA: `@csrf` is Blade-only, cannot provide token to JavaScript fetch calls
- Sanctum CSRF cookie for server-rendered: unnecessary complexity, Sanctum dependency
- No CSRF at all: vulnerable to CSRF attacks on state-changing requests
- Wrong token source causes 419 errors on all state-changing requests

---

## Related Rules

- Include @csrf in Every POST/PUT/PATCH/DELETE Blade Form (05-rules.md)
- Send X-XSRF-TOKEN Header for All SPA Stateful Requests (05-rules.md)
- Use CSRF Token API for Inertia/Vue POST Requests (05-rules.md)

---

## Related Skills

- Configure CSRF Token Validation for All State-Changing Routes (06-skills.md)

---

## Route Exclusion Strategy

---

## Decision Context

When and how to exclude routes from CSRF protection in `VerifyCsrfToken::$except`.

---

## Decision Criteria

* security

---

## Decision Tree

Does the route receive requests from external services (webhooks, callbacks)?
↓
YES → Is there alternative authentication (signature verification, IP allowlist)?
    YES → Exclude from CSRF; document the alternative protection
    NO → Implement alternative protection before excluding
NO → Is the route stateless and token-authenticated?
    YES → It's likely in `api.php` — already excluded (correct)
    NO → Should NOT be excluded from CSRF

Is the exclusion temporary (debugging)?
↓
YES → Remove before deploying to production
NO → Document permanently excluded routes with justification

How many routes are excluded?
↓
0 → Ideal (no CSRF bypasses)
1-3 → Acceptable for webhook endpoints
3+ → Review each exclusion; too many may indicate systemic issue

---

## Rationale

CSRF protection should never be disabled for browser-facing routes. External webhooks (Stripe, SendGrid, GitHub) are the legitimate exception — they cannot send CSRF tokens. Each exclusion must have an alternative security mechanism (signature verification, IP allowlist, HMAC).

---

## Recommended Default

**Default:** Exclude only external webhook routes that provide signature verification; document each exclusion with justification and the alternative security mechanism
**Reason:** CSRF protection is a critical security control for browser-based requests. Exclusions must be exceptional, justified, and have compensating security controls.

---

## Risks Of Wrong Choice

- Excluding all routes: no CSRF protection, vulnerable to CSRF attacks
- Excluding routes without alternative security: webhook endpoints open to forged requests
- Not documenting exclusions: future developers don't know why routes are unprotected
- Excluding API routes (redundant): API routes already excluded — no impact but confusing

---

## Related Rules

- Include @csrf in Every POST/PUT/PATCH/DELETE Blade Form (05-rules.md)
- Review the VerifyCsrfToken Except Array for Unnecessary Exclusions (05-rules.md)

---

## Related Skills

- Configure CSRF Token Validation for All State-Changing Routes (06-skills.md)
