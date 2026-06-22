# Skill: Spatie Permission Evaluation and Implementation

## Purpose
Deploy Spatie's laravel-permission for Laravel RBAC with proper guard scoping, team permissions, caching, and the native Gates/Polices escape hatch — while avoiding permission explosion, cache staleness, and the "Spatie for simple boolean admin" trap.

## When To Use
- Database-driven RBAC with admin-manageable roles and permissions
- Multiple roles per user (user can be both "editor" and "moderator")
- Wildcard permissions needed for concise role definitions (`posts:*`)
- Team/tenant-scoped permissions where a user has different roles per team
- Guard-scoped permissions (different permissions for web vs. API authentication)
- Blade directives for view-level authorization checks (`@role`, `@hasrole`)

## When NOT To Use
- Authorization model is a simple `is_admin` boolean — Spatie is overkill; use native Gates
- Permissions are embedded in JWT tokens and validated without database access
- Primary authorization model is ReBAC (relationship-based) — Spatie is RBAC only
- Permissions must span microservices without a shared database
- Performance requirement of zero database queries for auth checks — use JWT claims or in-memory cache
- Authorization rules are dynamic/computed (ABAC) — e.g., "user can edit documents created by users in their department"

## Prerequisites
- Laravel 13+ with PHP 8.3+
- Understanding of RBAC vs. ReBAC vs. ABAC (KU 08 — authorization core)
- Native Laravel Gates and Polices knowledge for the escape hatch
- Database with Eloquent support (Spatie stores roles/permissions in database)

## Inputs
- The complete list of permissions following `{resource}:{action}` naming convention
- Role hierarchy definition (which roles inherit from which)
- Team/tenant ID context mechanism (if team permissions are needed)
- Guard configuration (`web`, `api`, etc.)

## Workflow
1. **Verify Spatie fits the authorization model** — If the system needs only `is_admin`, stop. Use native Gates. If it needs ReBAC, stop. Use Policies. If it needs RBAC with roles, permissions, and team scoping, proceed.
2. **Design the permission namespace** — Use `{resource}:{action}` naming exclusively: `posts:read`, `posts:write`, `users:manage`. Never create ad-hoc names like `can_edit_posts`. This enables wildcard matching (`posts:*`) and makes audits readable.
3. **Create the PermissionSeeder** — Seed all permissions using `Permission::findOrCreate()`. All permissions must be version-controlled in the seeder. Never create permissions dynamically at runtime through an admin UI.
4. **Configure caching** — Enable Spatie's permission cache with a short TTL (1 hour max). Implement cache invalidation on role/permission changes using `$user->forgetCachedPermissions()`. Set up event listeners for cache invalidation.
5. **Set up team permissions middleware** — If using team-scoped permissions, set `setPermissionsTeamId(tenant()->id)` in the tenant identification middleware. ALWAYS reset with `setPermissionsTeamId(null)` in a `finally` block. This is especially critical in queued jobs and Octane.
6. **Design the escape hatch** — For ReBAC patterns (relationship-based authorization), use native Laravel Gates and Polices alongside Spatie. The `AuthorizationResolver` checks if the ability requires ReBAC and routes to `Gate::allows()` instead of `$user->can()`.
7. **Write permission tests** — Every test that checks permissions must clear the cache in `setUp()`: `app()['cache']->forget('spatie.permission.cache')`. Test both positive and negative cases for every permission.

## Validation Checklist
- [ ] Permission naming follows `{resource}:{action}` convention exclusively
- [ ] Permissions are seeded via `PermissionSeeder`, never created at runtime
- [ ] Permission cache is invalidated immediately on role/permission changes (not on TTL expiry)
- [ ] Team permissions use `setPermissionsTeamId()` in middleware and reset in `finally` block
- [ ] Team permission context is explicitly reset in queued jobs, commands, and Octane requests
- [ ] Guard names are consistent across permission creation and checking
- [ ] Escape hatch (native Gates/Polices) is designed for ReBAC patterns and logged
- [ ] Permission audit export is functional (users → roles → permissions query)
- [ ] Tests clear permission cache in `setUp()`
- [ ] No dynamic permission creation via admin UI or API

## Common Failures
- Installing Spatie for a single `is_admin` boolean — 4 extra tables, caching layer, and middleware for no value
- Not invalidating permission cache after role changes — demoted users retain elevated permissions
- Using Spatie for ReBAC patterns — creating 40+ roles like `department_a_editor` to simulate relationships
- Team permission memory leak — `setPermissionsTeamId()` set in one job and not reset, leaking into the next
- Creating permissions ad-hoc in an admin UI instead of seeding them — permission drift across environments
- Mixing guard names — creating permissions with `guard_name: 'web'` and checking with `guard: 'api'`

## Decision Points
- **Spatie vs. native Gates**: Multiple roles + permissions + wildcards + team scoping = Spatie. Single boolean = Gates. ReBAC = Policies.
- **Team permissions vs. global permissions**: Use team permissions when users have different roles in different tenants. Use global permissions when roles are tenant-independent.
- **Cache TTL vs. immediate invalidation**: Short TTL (15min) + event-driven invalidation is the best balance. Never rely on TTL alone — invalidate on role change immediately.
- **Guard scoping**: Use separate permission sets per guard ONLY if web and API have genuinely different authorization models. Otherwise, use a single guard to avoid confusion.

## Performance Considerations
- Without caching, every `$user->can()` call queries the permissions table through the pivot — N+1 risk
- Spatie's cache key is global (`spatie.permission.cache`) — flushing it invalidates ALL users' cached permissions
- Team permissions (pivot with `team_id`) add an extra join to every permission query — index `team_id`
- Wildcard resolution (`posts:*`) is slower than exact match (`posts:read`) — use wildcards for role definition, not runtime checks

## Security Considerations
- Permission cache staleness is a security vulnerability: demoted users retain elevated permissions until cache expiry
- Guard confusion: `guard_name: 'web'` permissions do NOT match `guard: 'api'` users — check consistency
- Direct permission assignment (bypassing roles) creates "shadow permissions" invisible in role audits — prefer role-based assignment
- Never expose raw permission checks in error messages — treat as sensitive authorization data

## Related Rules (from 05-rules.md)
- Use the `{resource}:{action}` Permission Naming Convention
- Seed Permissions — Never Create Them at Runtime
- Invalidate Permission Cache on Role/Permission Changes
- Do Not Use Spatie for Simple Boolean Admin Checks
- Set Team Permission Context in Middleware — Reset It After Use

## Related Skills
- Package Wrapper/Boundary Pattern (KU 03)
- Package Escape Hatch Strategy (KU 04)
- Calibrated Package Recommendation Writing (KU 01)

## Success Criteria
- All permissions follow `{resource}:{action}` naming. Permissions are seeded and version-controlled. Role changes immediately invalidate the user's permission cache. Team permissions never leak between contexts. ReBAC patterns use the native Gates escape hatch. Permission audit export works with a single query.
