# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** CORS Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Specific Origins vs Wildcard | CORS origin restriction level | security, architectural |
| 2 | Credentials Support Enablement | SPA cookie auth vs public API | security, architectural |

---

# Architecture-Level Decision Trees

---

## Specific Origins vs Wildcard

---

## Decision Context

Whether to use specific allowed origins or the wildcard `*` for CORS configuration.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Is the API public and read-only (no authentication)?
↓
YES → `allowed_origins: ['*']` acceptable (any site can make browser requests)
NO → Is the API authenticated (requires sessions/tokens)?
    YES → Specific origins required (never `*` with authentication)
    NO → Is the API a public API with write operations?
        YES → Specific origins recommended (prevent unauthorized use from unknown sites)
        NO → Evaluate based on security posture

Do you need `supports_credentials: true`?
↓
YES → Specific origins required (browsers reject `*` with credentials)
NO → Wildcard may be acceptable for public APIs

Are the allowed origins known and stable?
↓
YES → Specific origins (best security)
NO → Wildcard with credentials not possible; evaluate if dynamic origin validation is needed

---

## Rationale

Wildcard origins allow any website to make browser requests to your API. This is acceptable for public read-only APIs but dangerous for authenticated endpoints. With `supports_credentials: true`, browsers require specific origins — `*` is rejected. Specific origins provide the best security by restricting access to known frontend domains.

---

## Recommended Default

**Default:** Specific origins for all authenticated or state-changing APIs; wildcard only for public read-only APIs
**Reason:** Specific origins prevent unauthorized websites from making browser requests to your API. Wildcard is only appropriate when the API is intentionally public and has no authentication.

---

## Risks Of Wrong Choice

- `*` with credentials: browser rejects CORS, causes client errors
- `*` with authentication: any website's JavaScript can make authenticated requests (CSRF-like but via CORS)
- Specific origins with many domains: maintenance burden when adding new frontend domains
- Origin reflection: allows any origin, defeats CORS security

---

## Related Rules

- Restrict allowed_origins to Specific Domains in Production (05-rules.md)
- Never Reflect the Origin Header Back as Allowed (05-rules.md)
- Restrict allowed_methods to What the Application Actually Uses (05-rules.md)

---

## Related Skills

- Configure CORS for Cross-Origin API Access (06-skills.md)

---

## Credentials Support Enablement

---

## Decision Context

Whether to enable `supports_credentials: true` for Sanctum SPA cookie auth or keep it disabled for public API.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Does the API use cookie-based authentication (Sanctum SPA mode)?
↓
YES → `supports_credentials: true` + specific `allowed_origins` + `SANCTUM_STATEFUL_DOMAINS`
NO → Is the API public (no authentication)?
    YES → `supports_credentials: false` (wildcard `*` acceptable)
    NO → Does the API use Bearer token authentication?
        YES → `supports_credentials: false` (tokens are sent in Authorization header, not cookies)
        NO → Evaluate authentication mechanism

Is the SPA on a different origin than the API?
↓
YES → Credentials required for Sanctum cookie auth
NO → Same-origin SPA may not need CORS at all

---

## Rationale

Credentials support enables the browser to send cookies cross-origin. This is required for Sanctum SPA cookie auth when the SPA is on a different origin. With credentials enabled, `allowed_origins` must be specific (not `*`), and `SANCTUM_STATEFUL_DOMAINS` must match. For token-based APIs, credentials support is not needed and should be disabled.

---

## Recommended Default

**Default:** `supports_credentials: true` for Sanctum SPA cookie auth; `false` for token-based or public APIs
**Reason:** Credentials are only needed when the browser sends cookies cross-origin. Sanctum SPA auth requires this. Token-based APIs use Authorization headers which are not subject to CORS credential rules.

---

## Risks Of Wrong Choice

- `supports_credentials: true` with `*`: browser rejects (invalid CORS config)
- `supports_credentials: false` for Sanctum SPA: cookies not sent, 401 errors
- Missing `SANCTUM_STATEFUL_DOMAINS`: Sanctum treats SPA as external, session not set
- CORS credentials without HTTPS: cookies may be rejected or insecure

---

## Related Rules

- Configure Sanctum Stateful Domains for SPA Cookie Auth (05-rules.md)
- Restrict allowed_origins to Specific Domains in Production (05-rules.md)
- Restrict allowed_methods to What the Application Actually Uses (05-rules.md)

---

## Related Skills

- Configure CORS for Cross-Origin API Access (06-skills.md)
- Configure Sanctum SPA Cookie Auth vs Token Auth (06-skills.md)
