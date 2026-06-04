# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Additional Security Concerns
**Knowledge Unit:** Laravel Jetstream (Fortify + Sanctum — Legacy Context)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Jetstream vs Starter Kit for New Projects | Auth scaffolding selection | architectural, security |
| 2 | Jetstream Teams vs Multi-Tenancy Package | Data isolation strategy | architectural, security |

---

# Architecture-Level Decision Trees

---

## Jetstream vs Starter Kit for New Projects

---

## Decision Context

Whether to use Jetstream (deprecated, includes teams + API tokens) or the current stack-specific Starter Kits for a new Laravel project.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Is this a new Laravel 12/13+ project?
↓
YES → Use Starter Kits (Jetstream is deprecated, no new features, no security patches)
NO → Existing Laravel 11.x Jetstream project — plan migration during next upgrade

Are teams management needed?
↓
YES → Build custom team solution or use Spatie Permission with team scoping (Starter Kits don't include teams)
NO → Starter Kit is strictly lighter — no teams overhead

Is API token management UI needed?
↓
YES → Build custom UI using Sanctum's `HasApiTokens` trait (Starter Kits don't include token UI)
NO → Starter Kit has everything needed out of the box

Is this a maintenance-only project?
↓
YES → Continue with Jetstream until the next major Laravel upgrade
NO → Migrate to Starter Kits for forward compatibility

---

## Rationale

Jetstream is deprecated for new development. Starter Kits provide the same canonical auth stack (Fortify + Sanctum + Passkeys) without Jetstream's teams and API token management overhead. The teams feature in Jetstream is an opinionated implementation that is tightly coupled to Jetstream's architecture — not suitable for production multi-tenancy. API token management is rarely needed for first-party applications.

---

## Recommended Default

**Default:** Never use Jetstream for new Laravel 12/13+ projects; use stack-specific Starter Kits; build teams and API token management separately only if explicitly required
**Reason:** Jetstream adds unnecessary architectural weight (teams management with memberships, API token CRUD) that most applications do not need. The canonical auth stack (Fortify + Sanctum + Passkeys) is sufficient for 90%+ of projects. Teams and API token management can be added with dedicated packages when needed.

---

## Risks Of Wrong Choice

- Using Jetstream for new projects: deprecated package, no future updates, unnecessary complexity
- Confusing Jetstream teams with multi-tenancy: teams are collaborative groups, not tenant isolation
- Expecting Starter Kits to have Jetstream features: missing teams and API token UI
- Staying on Jetstream indefinitely: maintenance burden increases as codebase diverges from current Laravel patterns

---

## Related Rules

- Never Use Jetstream for New Laravel Projects (05-rules.md)
- Never Use Jetstream Teams for Multi-Tenancy (05-rules.md)

---

## Related Skills

- Deploy Laravel Jetstream with Fortify and Sanctum Integration (06-skills.md) — legacy only

---

## Jetstream Teams vs Multi-Tenancy Package

---

## Decision Context

Whether to use Jetstream's built-in teams feature for data isolation or a dedicated multi-tenancy package (stancl/tenancy, spatie/laravel-multitenancy).

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Is the requirement tenant-level data isolation or collaborative user groups?
↓
Data isolation (each tenant sees only their own data) → Multi-tenancy package required
Collaborative groups (users share data within a team) → Jetstream teams may be sufficient

Is data isolation the primary architectural concern?
↓
YES → Use dedicated multi-tenancy package (stancl/tenancy provides tenant_id scoping, DB isolation)
NO → Jetstream teams are acceptable for user-organization patterns

Are there separate databases per tenant?
↓
YES → Multi-tenancy package required (Jetstream teams cannot manage database connections)
NO → Shared database with tenant_id scope (still need multi-tenancy package for scoping)

How many users per "team"?
↓
Few (< 100) → Jetstream teams works for collaborative use cases
Many (100+) → Multi-tenancy package required (scope isolation at database level, not membership level)

Will the isolation model need to scale?
↓
YES → Multi-tenancy package from the start (migrating from Jetstream teams is extremely difficult)
NO → Jetstream teams is simpler if isolated data is not a requirement

---

## Rationale

Jetstream teams are collaborative user groups (like a shared Google Doc) — not tenant isolation boundaries. Using teams for multi-tenancy means the data isolation is implemented as user membership checks rather than database-level scoping. This leaks data when queries forget membership checks, and does not support tenant-specific configurations, database connections, or storage paths. Dedicated multi-tenancy packages implement data isolation at the correct architectural layer.

---

## Recommended Default

**Default:** Never use Jetstream teams for multi-tenancy; use stancl/tenancy or spatie/laravel-multitenancy for tenant isolation; use Jetstream teams only for their intended collaborative-group purpose
**Reason:** Jetstream teams lack database-level tenant scoping — data isolation depends entirely on correct membership checks in every query. One missed check exposes all tenants' data. Dedicated multi-tenancy packages implement isolation at the database query level (global scopes, tenant_id filtering, separate connections) that cannot be bypassed by accident.

---

## Risks Of Wrong Choice

- Using Jetstream teams for multi-tenancy: data leak when any query forgets membership filter
- Migrating from Jetstream teams to multi-tenancy: requires rewriting all scoped queries
- Using multi-tenancy where only teams needed: unnecessary architectural complexity
- Not addressing isolation early: refactoring from teams to tenancy is a major project rewrite

---

## Related Rules

- Never Use Jetstream Teams for Multi-Tenancy (05-rules.md)
- Use a Dedicated Multi-Tenancy Package for Tenant Isolation (05-rules.md)

---

## Related Skills

- Deploy Laravel Jetstream with Fortify and Sanctum Integration (06-skills.md) — legacy only
