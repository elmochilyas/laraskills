# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Sanctum Ability-Based Token Scoping
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Ability Naming Convention | Action-based vs role-based token abilities | security, maintainability |
| 2 | Ability Enforcement Location | Middleware vs controller-based ability checks | architectural, maintainability |
| 3 | Ability Scoping vs Passport Scopes | Choosing token permission model | architectural, security |

---

# Architecture-Level Decision Trees

---

## Ability Naming Convention

---

## Decision Context

How to name Sanctum abilities — action-based (`resource:action`) vs role-based (`admin`, `editor`) strings.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Do you need granular control over what a token can do?
↓
YES → Action-based naming: `resource:action` (e.g., `post:create`, `post:read`)
NO → Is a binary distinction (admin/non-admin) sufficient?
    YES → Role-based naming (`admin` ability) acceptable for simple apps
    NO → Action-based naming required

Will tokens be created by end users (user settings UI)?
↓
YES → Action-based naming enables user-selectable granular permissions
NO → Role-based may be sufficient for system-generated tokens

Do you need read-only tokens (e.g., mobile app read-only mode)?
↓
YES → Action-based naming: `post:read` separate from `post:write`
NO → Role-based may be sufficient

---

## Rationale

Action-based abilities enable granular permission control following the principle of least privilege. A user can grant a mobile app read-only access (`post:read`) without exposing write capabilities. Role-based abilities (`admin`) are binary — you either have full access or none. Action-based naming (`resource:action`) is self-documenting and consistent with OAuth2 scope best practices.

---

## Recommended Default

**Default:** Action-based naming: `resource:action` (e.g., `post:create`, `post:read`, `post:update`, `post:delete`)
**Reason:** Action-based abilities provide granular control, support read-only tokens, and follow the principle of least privilege. Consistent naming convention makes abilities self-documenting and maintainable.

---

## Risks Of Wrong Choice

- Role-based abilities (`admin`): overly permissive, cannot grant partial access, defeats token scoping purpose
- No ability naming convention: inconsistent patterns, hard to audit, confusion between token types
- Too granular abilities (`post:create:draft:before-publish`): overly complex, hard to manage

---

## Related Rules

- Design Abilities as Action-Based Strings, Not Roles (05-rules.md)
- Combine tokenCan With Gates/Policies for Full Authorization (05-rules.md)
- Be Explicit With Empty Abilities Array (05-rules.md)

---

## Related Skills

- Scope Sanctum API Tokens with Abilities for Granular Access Control (06-skills.md)

---

## Ability Enforcement Location

---

## Decision Context

Where to enforce Sanctum ability checks — in custom middleware (reusable, declarative) or in controllers (context-specific).

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the ability check the same for all actions on a route group?
↓
YES → Custom middleware (reusable, declarative, applied via route definition)
NO → Does the ability check depend on the specific action context?
    YES → Controller-level check (context-specific, e.g., conditional ability requirements)
    NO → Custom middleware

Do you need to check multiple abilities per route?
↓
YES → Controller-level (flexible combination logic)
NO → Custom middleware (single ability per middleware instance)

Is the ability check used across multiple controllers?
↓
YES → Custom middleware (DRY, single definition)
NO → Controller-level (localized, self-contained)

---

## Rationale

Middleware provides reusable, declarative ability checking — apply to route groups, single responsibility. Controller-level checks allow context-specific logic (e.g., check one ability for resource A, another for resource B in the same method). Both approaches should combine with Gates/Policies for user-level authorization.

---

## Recommended Default

**Default:** Custom middleware for common abilities (e.g., `ability:post:create`); controller-level for context-specific or multi-ability checks
**Reason:** Middleware provides DRY, declarative enforcement for common patterns. Controller checks handle edge cases where the ability requirement depends on request context. Both are valid; choose based on reuse frequency.

---

## Risks Of Wrong Choice

- All checks in middleware: rigid when ability requirements vary per action in same controller
- All checks in controllers: duplicated logic when same ability is required across many routes
- No ability checks at all: abilities defined but never enforced — all tokens have full access
- Middleware without explicit route registration: legitimate API calls return 403

---

## Related Rules

- Check Abilities With tokenCan in Controllers or Custom Middleware (05-rules.md)
- Combine tokenCan With Gates/Policies for Full Authorization (05-rules.md)
- Do Not Use Ability Scoping on SPA Cookie Auth Routes (05-rules.md)

---

## Related Skills

- Scope Sanctum API Tokens with Abilities for Granular Access Control (06-skills.md)

---

## Ability Scoping vs Passport Scopes

---

## Decision Context

Choosing between Sanctum abilities (simple token permissions) and Passport OAuth2 scopes (formal scope negotiation with third-party clients).

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Do you need to support third-party OAuth2 clients with scope negotiation?
↓
YES → Passport scopes (formal scope system, client authorization UI, scope middleware)
NO → Sanctum abilities (simpler, sufficient for first-party)

Do you need scopes to be granted per-client (different scopes per third-party app)?
↓
YES → Passport scopes (built-in per-client scope negotiation)
NO → Sanctum abilities (per-token, not per-client)

Are your tokens exclusively for first-party use (your SPA, mobile app)?
↓
YES → Sanctum abilities (simpler, directly on token)
NO → Passport scopes (needed for third-party delegation)

Do you need to limit token creation to specific abilities per user role?
↓
YES → Sanctum abilities (can be checked at token creation time)
NO → Either approach works

---

## Rationale

Sanctum abilities are simpler — string identifiers checked against the token's stored abilities array. Passport scopes are a formal OAuth2 concept with grant negotiation, client-specific scope limitations, and authorization UI. Sanctum abilities are for first-party token permission. Passport scopes are for third-party OAuth2 delegation. They can coexist in a dual setup.

---

## Recommended Default

**Default:** Sanctum abilities for first-party API tokens; Passport scopes only when third-party OAuth2 delegation is needed
**Reason:** Sanctum abilities provide adequate permission granularity for first-party use cases without OAuth2 complexity. Passport scopes are necessary only when third-party clients need to negotiate token permissions.

---

## Risks Of Wrong Choice

- Sanctum abilities for third-party OAuth2: no scope negotiation, no per-client limitations, no authorization UI
- Passport scopes for first-party tokens: over-engineering, OAuth2 protocol overhead for simple permission checking
- Neither: tokens with unrestricted access, no granularity

---

## Related Rules

- Design Abilities as Action-Based Strings, Not Roles (05-rules.md)
- Prune Unused Tokens and Enforce Per-User Token Limits (05-rules.md)
- Default to Sanctum for API Authentication (Passport decision rules, 05-rules.md)

---

## Related Skills

- Scope Sanctum API Tokens with Abilities for Granular Access Control (06-skills.md)
- Configure Passport OAuth2 Server (06-skills.md)
