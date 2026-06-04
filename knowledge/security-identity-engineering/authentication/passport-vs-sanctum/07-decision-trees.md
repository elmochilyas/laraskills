# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Passport vs Sanctum Decision Framework
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Sanctum vs Passport Package Selection | Core API auth architecture decision | architectural, maintainability, security |
| 2 | Sanctum Auth Mode: SPA Cookie vs Bearer Token | Choosing auth mechanism for Sanctum | security, architectural |
| 3 | Dual Setup vs Single Package | Whether to use both Sanctum and Passport | maintainability, architectural |

---

# Architecture-Level Decision Trees

---

## Sanctum vs Passport Package Selection

---

## Decision Context

The most critical authentication architecture decision for Laravel API authentication — choosing between Sanctum (simple, first-party) and Passport (full OAuth2, third-party).

---

## Decision Criteria

* architectural
* maintainability
* security

---

## Decision Tree

Does your API need to support third-party OAuth2 delegated authorization?
↓
YES → Passport (full OAuth2 server with grant types, scopes, client management)
NO → Sanctum (simpler, sufficient for first-party auth)

Are the API clients exclusively your own applications (SPA, mobile, M2M)?
↓
YES → Sanctum (designed for first-party auth)
NO → Do you need to let third-party developers build apps against your API?
    YES → Passport (OAuth2 provider capabilities required)
    NO → Sanctum (no third-party delegation needed)

Is this a new project (greenfield)?
↓
YES → Start with Sanctum — add Passport only when OAuth2 requirements are confirmed
NO → Evaluate existing auth setup — if Passport for first-party only, consider migrating to Sanctum

Do you need OAuth2-compliant token scopes with client management UI?
↓
YES → Passport (built-in scope negotiation, client CRUD)
NO → Sanctum (ability scoping is simpler but less granular)

---

## Rationale

Sanctum covers ~80% of API auth use cases with minimal complexity — single token table, SHA-256 hashed tokens, ability scoping. Passport is ~20x more complex (7+ tables, RSA keys, grant types, client management). Most projects never need third-party OAuth2 delegation. Starting with Sanctum and migrating to Passport later is feasible if requirements grow.

---

## Recommended Default

**Default:** Sanctum (start here; add Passport only when third-party OAuth2 delegation is confirmed)
**Reason:** Sanctum handles SPA cookie auth, API token auth, and ability scoping with minimal setup. Passport's OAuth2 infrastructure is unnecessary overhead for first-party auth. The cost of migrating from Sanctum to Passport is low compared to the upfront cost of Passport when not needed.

---

## Risks Of Wrong Choice

- Passport for first-party SPA: unnecessary OAuth2 complexity, hours of setup, RSA key management, client CRUD overhead
- Sanctum for third-party OAuth2: cannot do delegated authorization, no scope negotiation, no client management
- No API auth package: rolling custom token auth, missing security features (hashing, revocation, CSRF)

---

## Related Rules

- Default to Sanctum for API Authentication (05-rules.md)
- Use Sanctum for First-Party, Passport for Third-Party OAuth2 (05-rules.md)
- Avoid Dual Setup Unless Third-Party OAuth2 Is Confirmed (05-rules.md)
- Never Use Password Grant in Sanctum or Passport (05-rules.md)

---

## Related Skills

- Select Between Sanctum and Passport for API Authentication (06-skills.md)
- Configure Sanctum SPA and Token Authentication (06-skills.md)
- Configure Passport OAuth2 Server (06-skills.md)

---

## Sanctum Auth Mode: SPA Cookie vs Bearer Token

---

## Decision Context

Choosing between Sanctum's SPA cookie-based authentication (same-domain browser apps) and Bearer token authentication (mobile, cross-domain, non-browser clients).

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Is the client a browser-based application on the same domain as the API?
↓
YES → SPA cookie auth (httpOnly session cookie, CSRF protection, no token in JS)
NO → Bearer token auth (token in Authorization header)

Is the client a mobile or desktop application?
↓
YES → Bearer token auth (tokens stored in secure device storage)
NO → Is the client a cross-domain SPA (different subdomain or domain)?
    YES → Is CORS with credentials feasible?
        YES → SPA cookie auth (with CORS + credentials configuration)
        NO → Bearer token auth (token in header)
    NO → Bearer token auth

Is the application API-only (no browser UI)?
↓
YES → Bearer token auth
NO → Evaluate based on client type

---

## Rationale

Sanctum SPA cookie auth provides superior browser security — `httpOnly` session cookies prevent XSS-based token theft, `Same-Site` cookies provide CSRF protection, and there's no token accessible to JavaScript. Bearer tokens (stored in `localStorage` or `sessionStorage`) are accessible to any JavaScript running on the page, making them vulnerable to XSS. For non-browser clients (mobile, desktop, server), Bearer tokens are the only option.

---

## Recommended Default

**Default:** SPA cookie auth for same-domain browser apps; Bearer token auth for mobile, cross-domain, and API-only clients
**Reason:** Cookie auth eliminates the token storage XSS vector for browser apps. Bearer tokens are necessary for non-browser environments where cookies cannot be used.

---

## Risks Of Wrong Choice

- Bearer tokens in localStorage for SPAs: XSS vulnerability, token theft via script injection
- SPA cookie auth for mobile apps: cookies not available in native HTTP clients
- SPA cookie auth for cross-domain without proper CORS: browser blocks credentials
- No CSRF protection for cookie auth: missing Sanctum CSRF token endpoint call

---

## Related Rules

- Use Sanctum Cookie Auth for Same-Domain SPAs (05-rules.md)
- Configure SPA Routes With Sanctum, Not Passport (05-rules.md)
- Default to Sanctum for API Authentication (05-rules.md)

---

## Related Skills

- Select Between Sanctum and Passport for API Authentication (06-skills.md)
- Configure Sanctum SPA and Token Authentication (06-skills.md)

---

## Dual Setup vs Single Package

---

## Decision Context

Whether to configure both Sanctum (for first-party clients) and Passport (for third-party OAuth2) simultaneously, or use a single package.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Do you have both first-party clients (your SPA, mobile app) AND need to support third-party OAuth2?
↓
YES → Are the OAuth2 requirements confirmed (not speculative)?
    YES → Dual setup: Sanctum guard for first-party + Passport guard for third-party
    NO → Start with Sanctum only; add Passport when OAuth2 requirements materialize
NO → Single package (Sanctum or Passport based on primary need)

Is the dual setup complexity justified by actual client needs?
↓
YES → Implement dual guard configuration with separate route groups
NO → Stick with single package

Can you consolidate to one package?
↓
YES → Use Sanctum first-party + Passport only for OAuth2-specific endpoints (minimal dual)
NO → Full dual setup with separate guards and route middleware

---

## Rationale

Dual setup is valid when both first-party and third-party auth requirements exist. Sanctum handles first-party SPAs and mobile apps; Passport handles OAuth2 for third-party developers. However, if OAuth2 requirements are speculative, start with Sanctum — adding Passport later is straightforward. Dual setup adds maintenance overhead (two token systems, two guard configs, two scope/ability models).

---

## Recommended Default

**Default:** Start with Sanctum single package; add Passport only when third-party OAuth2 requirements are confirmed and active
**Reason:** Pre-emptive dual setup adds complexity without benefit for hypothetical future needs. Sanctum handles first-party auth completely. Adding Passport later is a compatible addition, not a migration.

---

## Risks Of Wrong Choice

- Dual setup without OAuth2 need: unnecessary infrastructure, higher maintenance, confusion about which guard to use
- Single Sanctum when OAuth2 needed later: migration effort to add Passport (manageable but requires route/guard splitting)
- Single Passport for all auth: over-complicated for first-party clients, OAuth2 protocol overhead for simple token needs

---

## Related Rules

- Avoid Dual Setup Unless Third-Party OAuth2 Is Confirmed (05-rules.md)
- Use Sanctum for First-Party, Passport for Third-Party OAuth2 (05-rules.md)
- Default to Sanctum for API Authentication (05-rules.md)

---

## Related Skills

- Select Between Sanctum and Passport for API Authentication (06-skills.md)
- Configure Auth Guards and Providers (06-skills.md)
