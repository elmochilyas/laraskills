# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Authentication & Authorization
**Knowledge Unit:** Sanctum Token Auth
**Generated:** 2026-06-03

---

# Decision Inventory

* Token ability granularity (scope-based vs resource-based)
* Token expiration strategy (short-lived vs long-lived)
* Per-user token limits (enforce vs allow unlimited)

---

# Architecture-Level Decision Trees

---

## Token Ability Granularity — Scope-Based vs Resource-Based

---

## Decision Context

How should Sanctum token abilities be structured? Arises when defining token access scopes for API consumers.

---

## Decision Criteria

* granularity — level of access control needed per token
* consistency — matching ability patterns to actual resource structure
* readability — ability names that are clear to developers
* scalability — ability names that won't conflict as the API grows

---

## Decision Tree

Is the API large (10+ resources)?
↓
YES → Resource-based abilities: `posts:read`, `posts:write`, `users:read`
NO → Small API or simple access pattern?
    YES → Scope-based abilities: `read`, `write`, `admin`
    NO → Hybrid: combine both patterns

---

## Rationale

Resource-based abilities (`posts:read`) scale better as the API grows — they naturally map to resource endpoints and prevent accidental cross-resource access. Scope-based abilities (`read`, `write`) are simpler for small APIs but become ambiguous when applied to multiple resource types.

---

## Recommended Default

**Default:** Resource-based abilities (`resource:action`)
**Reason:** Scales with API growth, maps clearly to endpoints, prevents cross-resource permission confusion.

---

## Risks Of Wrong Choice

Scope-based for large APIs: a `read` ability grants read access to all resources, preventing fine-grained token scoping.

---

## Related Rules

- Always Assign at Least One Ability on Token Creation (from 05-rules.md)

---

## Related Skills

- Implement Sanctum Token Authentication (from 06-skills.md)
- Token Ability Design (from 06-skills.md)

---

## Token Expiration Strategy — Short-Lived vs Long-Lived

---

## Decision Context

What token expiration duration should be configured? Arises when setting up Sanctum token lifespan.

---

## Decision Criteria

* security — exposure window if token is compromised
* user experience — frequency of re-authentication
* implementation complexity — refresh token vs simple re-login
* use case — mobile app vs CI/CD integration

---

## Decision Tree

What type of consumer is using the token?
↓
Mobile app or SPA?
YES → Short expiration (hours-days) + implement custom refresh token rotation
NO → CI/CD or integration token?
    YES → Long expiration (months-years) with manual rotation
    NO → Admin/user tokens?
        YES → Medium expiration (days-weeks) with revocation UI

---

## Rationale

Short-lived tokens limit the damage window if a token is compromised but require more complex refresh logic. Long-lived tokens are simpler for machine consumers but have larger breach exposure. Sanctum has no built-in refresh token rotation — implement custom middleware for `expires_at` checking.

---

## Recommended Default

**Default:** 24-hour expiration for user tokens, 90-day for integration tokens
**Reason:** Balances security (limited exposure window) with user experience (reasonable re-auth frequency).

---

## Risks Of Wrong Choice

No expiration: tokens valid forever, compromised tokens remain active indefinitely. Too-short expiration: users frustrated by frequent re-authentication.

---

## Related Rules

- Enforce Per-User Token Limits (from 05-rules.md)

---

## Related Skills

- Implement Sanctum Token Authentication (from 06-skills.md)
- Token Expiration and Rotation (from 06-skills.md)

---

## Per-User Token Limits — Enforce vs Allow Unlimited

---

## Decision Context

Should users be allowed to create unlimited tokens, or should a per-user limit be enforced? Arises when implementing token creation endpoints.

---

## Decision Criteria

* security — preventing credentials stuffing and token sprawl
* usability — legitimate use cases for multiple tokens (device-per-device)
* database bloat — millions of orphaned tokens degrading performance
* auditability — tracking which tokens are in use

---

## Decision Tree

Does the user need a separate token per device (phone, tablet, laptop)?
↓
YES → Enforce limits but allow reasonable count (10-20 per user)
NO → Single token per user?
    YES → Enforce strict limit (1-3 tokens per user)
    NO → Unknown use case?
        YES → Enforce reasonable limit (10) with option to increase

---

## Rationale

Unbounded token creation enables credential stuffing, token sprawl making revocation impractical, and database bloat from orphaned tokens. A reasonable limit (10 per user) accommodates legitimate multi-device usage while preventing abuse.

---

## Recommended Default

**Default:** Maximum 10 active tokens per user
**Reason:** Accommodates legitimate multi-device scenarios while preventing abuse and database bloat.

---

## Risks Of Wrong Choice

No limit: users create thousands of tokens, revoked token is impractical, database bloat slows queries. Too-strict limit (1-3): users revoke all devices when getting a new one.

---

## Related Rules

- Enforce Per-User Token Limits (from 05-rules.md)

---

## Related Skills

- Implement Sanctum Token Authentication (from 06-skills.md)
