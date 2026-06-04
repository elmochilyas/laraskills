# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authorization
**Knowledge Unit:** Spatie laravel-permission
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Spatie vs Native Gates/Policies | Database-driven vs code-based authorization | architectural, maintainability |
| 2 | Direct Permission vs Role-Based Assignment | How to grant permissions to users | security, maintainability |
| 3 | Team-Scoped vs Global Permissions | Multi-tenancy support for permissions | architectural, security |

---

# Architecture-Level Decision Trees

---

## Spatie vs Native Gates/Policies

---

## Decision Context

Choosing between `spatie/laravel-permission` (database-driven roles/permissions) and Laravel's native Gates/Policies (code-based authorization).

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Do admins need to manage roles and permissions at runtime (no code deploy)?
↓
YES → Spatie laravel-permission (database-driven, admin UI)
NO → Native Gates/Policies (code-based, deployed with application)

Do permissions change frequently after deployment?
↓
YES → Spatie (change via database, no deployment needed)
NO → Native Gates/Policies (static, compiled with code)

Is the application multi-tenant with per-tenant role templates?
↓
YES → Spatie with team support (team_foreign_key scopes per tenant)
NO → Native Gates/Policies (simpler for single-tenant)

Is this a greenfield project?
↓
YES → Spatie recommended "from day one" even for simple apps (hard to retrofit)
NO → Evaluate existing authorization and cost of migration

---

## Rationale

Spatie provides database-driven role/permission management that can be modified at runtime without code deployment. Native Gates/Policies are simpler but require code changes for any permission modification. Spatie's Gate integration means `$user->can()` works the same way with both approaches. The main tradeoff is runtime flexibility vs simplicity.

---

## Recommended Default

**Default:** Spatie laravel-permission for any application where admins manage permissions; native Gates/Policies for developer-managed, static permissions
**Reason:** Spatie is the de facto standard with 48M+ installs, straightforward setup, and seamless Gate integration. It's worth the minimal overhead even for simple apps — retrofitting permissions later is much harder than installing from day one.

---

## Risks Of Wrong Choice

- Native Gates/Policies when admin management is needed: every permission change requires deployment, developer bottleneck
- Spatie for static permissions: unnecessary database queries, cache management overhead
- Neither: no permission system, binary admin/non-admin only
- Spatie without HasRoles trait: package installed but non-functional

---

## Related Rules

- Add HasRoles Trait to User Model From Setup (05-rules.md)
- Use $user->can() for Permission Checks — Not hasRole() (05-rules.md)
- Seed All Permissions — Never Create Dynamically (05-rules.md)

---

## Related Skills

- Implement Spatie laravel-permission for Database-Driven Roles and Permissions (06-skills.md)
- Design Role-Based Access Control (06-skills.md)

---

## Direct Permission vs Role-Based Assignment

---

## Decision Context

Whether to assign permissions directly to users or group them through roles.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Do you have multiple users who share the same permissions?
↓
YES → Role-based assignment (create role, assign permissions to role, users get role)
NO → Direct permission may be acceptable (single user with unique permissions)

Do you need to audit who has what permissions?
↓
YES → Role-based (audit by checking role assignments, much simpler)
NO → Direct permission (more granular but harder to audit)

Will permissions need to be updated for groups of users?
↓
YES → Role-based (update role, all users with role inherit change)
NO → Direct permission (update each user individually)

Do you have separation of duty constraints?
↓
YES → Role-based (assign conflicting permissions to separate roles, enforce per-user)
NO → Either approach works

---

## Rationale

Role-based assignment is the standard RBAC pattern — permissions are grouped into roles, and users are assigned roles. This scales to hundreds of users with consistent permission sets. Direct permission assignment should be reserved for edge cases (individual user with unique permissions not shared by any role). Direct assignment bypasses the role model, making audits harder.

---

## Recommended Default

**Default:** Role-based assignment for all permissions; direct permission only for exceptional cases documented in code
**Reason:** Role-based assignment ensures consistency, simplifies auditing, and enables bulk permission changes. Direct permission should be the exception, not the rule — it bypasses role grouping and creates audit challenges.

---

## Risks Of Wrong Choice

- Direct permissions for all users: no role grouping, audit nightmare, individual updates on permission changes
- Role-based with too many roles: role explosion, confusing permission overlap
- Direct + role-based mixed without documentation: unclear why a user has certain permissions
- No role model at all: each user has a unique permission set, no consistency

---

## Related Rules

- Seed All Permissions — Never Create Dynamically (05-rules.md)
- Use $user->can() for Permission Checks — Not hasRole() (05-rules.md)
- Assign Permissions to Roles, Never Directly to Users (05-rules.md)

---

## Related Skills

- Implement Spatie laravel-permission for Database-Driven Roles and Permissions (06-skills.md)

---

## Team-Scoped vs Global Permissions

---

## Decision Context

Whether to use Spatie's team support (`team_foreign_key`) for multi-tenant permission scoping or use global permissions.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Is the application multi-tenant with per-tenant roles?
↓
YES → Enable team support (`team_foreign_key` in config)
NO → Global permissions (no team scoping needed)

Do users belong to multiple teams with different roles per team?
↓
YES → Team-scoped permissions required (user has one role in team A, different role in team B)
NO → Global permissions (user has same role across all contexts)

Is data isolated per team/tenant?
↓
YES → Team-scoped permissions (prevent cross-tenant permission leaks)
NO → Global permissions sufficient

Are permissions managed per team (admins per team assign roles)?
↓
YES → Team-scoped (team admins assign roles within their team scope only)
NO → Global permissions (centralized role management)

---

## Rationale

Team scoping adds a `team_id` foreign key to role and permission assignments, ensuring users have different roles in different teams. This is essential for multi-tenant SaaS applications where each tenant manages its own roles. Global permissions are simpler for single-tenant apps or when users have the same role across all contexts.

---

## Recommended Default

**Default:** Global permissions for single-tenant apps; team-scoped for multi-tenant SaaS
**Reason:** Team support adds a `team_id` column and query condition to every permission check. Only enable when needed. Multi-tenant apps require team scoping to prevent cross-tenant role leakage — a user in Tenant A should not have Tenant A's admin role in Tenant B.

---

## Risks Of Wrong Choice

- No team scoping for multi-tenant: cross-tenant permission leakage, user from tenant A has roles from tenant B
- Team scoping for single-tenant: unnecessary column, query overhead, complexity
- Team scoping enabled but not used: no impact beyond extra column, but confusing
- Wrong team_foreign_key type: SQL errors on migration

---

## Related Rules

- Add HasRoles Trait to User Model From Setup (05-rules.md)
- Clear Cache on Permission Changes (05-rules.md)
- Assign Permissions to Roles, Never Directly to Users (05-rules.md)

---

## Related Skills

- Implement Spatie laravel-permission for Database-Driven Roles and Permissions (06-skills.md)
