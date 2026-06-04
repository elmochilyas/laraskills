# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Laravel Auth Guards and Providers Architecture
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Guard Driver Selection | Choosing auth strategy per user type | security, architectural, performance |
| 2 | Single vs Multi-Guard Setup | Structuring auth for different user types | architectural, maintainability, security |
| 3 | Provider Type Selection | Choosing user data source | performance, maintainability, security |

---

# Architecture-Level Decision Trees

---

## Guard Driver Selection

---

## Decision Context

Selecting the authentication driver (session, sanctum, passport, token) for each guard in `config/auth.php`. The driver defines how users are authenticated on each request.

---

## Decision Criteria

* performance
* architectural
* security
* maintainability

---

## Decision Tree

Is the client a browser-based web application?
↓
YES → Is this an SPA that needs cookie-based API auth?
    YES → Sanctum (SPA mode)
    NO → Is this an API-only client (mobile, third-party)?
        YES → Sanctum (token mode) → Condition C
        NO → Session driver (standard web app)
NO → Is this an M2M / service-to-service integration?
    YES → Passport (OAuth2 Client Credentials) → Condition D
    NO → Is this a third-party API that needs OAuth2 delegation?
        YES → Passport (OAuth2 full)
        NO → Sanctum (token mode)

Condition C — Are you building a first-party SPA?
↓
YES → Sanctum SPA mode (cookie-based, no token exposure)
NO → Sanctum token mode (Bearer token in header)

Condition D — Do you need scoped access tokens with fine-grained permissions?
↓
YES → Passport (built-in scopes)
NO → Sanctum (ability scoping)

---

## Rationale

Session driver is the standard for browser-based apps using cookies. Sanctum provides both SPA cookie auth and API token auth with a single package. Passport is required when full OAuth2 compliance is needed (third-party clients, scoped tokens, authorization codes). The `token` driver is legacy and should not be used for new projects.

---

## Recommended Default

**Default:** Sanctum (SPA mode for browser apps, token mode for APIs)
**Reason:** Sanctum covers both browser-based SPA auth and API token auth with a single dependency. Passport is heavy overkill for first-party apps. Session driver is legacy for pure server-rendered apps.

---

## Risks Of Wrong Choice

- Using Session for API: exposes session fixation vulnerabilities on stateless endpoints
- Using Passport for first-party SPA: unnecessary OAuth2 complexity, heavier maintenance
- Using Sanctum when OAuth2 scopes needed: workarounds required for third-party client use cases
- Using `token` driver (legacy): no built-in token management UI, no ability scoping

---

## Related Rules

- Use Separate Guards Per User Type (05-rules.md)
- Explicitly Specify Guard in Route Middleware (05-rules.md)
- Pair Every Guard With a Corresponding Provider (05-rules.md)

---

## Related Skills

- Configure Sanctum SPA and Token Authentication (06-skills.md)
- Implement Passport OAuth2 Server (06-skills.md)
- Configure Auth Guards and Providers for Multi-Strategy Authentication (06-skills.md)

---

## Single vs Multi-Guard Setup

---

## Decision Context

Whether to use a single guard for all authentication or create separate guards for different user types (web users, admins, API clients, tenants).

---

## Decision Criteria

* architectural
* maintainability
* security

---

## Decision Tree

Does the application have multiple user types (e.g., customers + admins)?
↓
YES → Do these user types need different auth strategies?
    YES → Multi-guard setup (separate guards per user type)
    NO → Do they use different user tables/models?
        YES → Multi-guard setup (different providers)
        NO → Single guard is acceptable
NO → Single guard is sufficient

Are you building an API alongside a web UI?
↓
YES → Multi-guard setup (web guard for session, sanctum for API)
NO → Single guard may be sufficient

---

## Rationale

Multi-guard setups prevent auth strategy leakage between route groups. A single guard forces all routes into one authentication strategy. When web routes use session auth and API routes use token auth, they must be separate guards. Multi-guard also enables different user providers (User model vs Admin model).

---

## Recommended Default

**Default:** Multi-guard (web for session, sanctum for API)
**Reason:** Nearly every Laravel app has both web routes and API routes. Starting with separate guards prevents refactoring later and avoids auth bypass vulnerabilities from guard confusion.

---

## Risks Of Wrong Choice

- Single guard for web+API: session auth applied to API routes, breaking mobile clients
- Single guard for multiple user models: wrong user type retrieved for admin routes
- Too many guards: unnecessary complexity for simple apps with one user type

---

## Related Rules

- Use Separate Guards Per User Type (05-rules.md)
- Never Modify the Web Guard's Driver or Provider (05-rules.md)
- Set Default Guard to Match Primary Use Case (05-rules.md)

---

## Related Skills

- Configure Auth Guards and Providers for Multi-Strategy Authentication (06-skills.md)
- Set Up Fortify Headless Auth Backend (06-skills.md)

---

## Provider Type Selection

---

## Decision Context

Choosing between `eloquent`, `database`, or custom provider for retrieving users in each guard's authentication flow.

---

## Decision Criteria

* performance
* maintainability
* architectural

---

## Decision Tree

Are users stored in a standard database table with an Eloquent model?
↓
YES → Eloquent provider (recommended)
NO → Are users stored in a database table without Eloquent?
    YES → Database provider
    NO → Are users stored in an external system (LDAP, Active Directory, REST API)?
        YES → Custom UserProvider implementation
        NO → Is this a file-based or in-memory user store?
            YES → Custom UserProvider implementation
            NO → Not a supported scenario

---

## Rationale

Eloquent provider is the standard and most feature-rich option — it supports relationships, accessors, and Laravel conventions. Database provider is a lightweight alternative for apps without Eloquent models. Custom providers are the extension point for any non-DB user storage.

---

## Recommended Default

**Default:** Eloquent provider
**Reason:** Eloquent integrates with all Laravel auth features (remember tokens, relationships for roles/permissions, accessors) and is the convention used by all starter kits and packages.

---

## Risks Of Wrong Choice

- Eloquent for non-DB storage: impossible, must use custom provider
- Database provider without Eloquent: missing remember token support, no relationships
- Custom provider without proper contract implementation: runtime errors on auth attempts

---

## Related Rules

- Pair Every Guard With a Corresponding Provider (05-rules.md)
- Implement UserProvider Contract for Non-DB User Storage (05-rules.md)

---

## Related Skills

- Configure Auth Guards and Providers for Multi-Strategy Authentication (06-skills.md)
- Design RBAC Authorization System (06-skills.md)
