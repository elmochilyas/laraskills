# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Spatie Permission Decision Matrix |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Authorization core concepts, RBAC architecture, Policy/Gate design |
| Related KUs | Package wrapper/boundary pattern, Package escape hatch strategy, Roles and permissions architecture |
| Source | domain-analysis.md |

---

# Overview

Spatie's `laravel-permission` is the de facto RBAC package for Laravel. It provides roles, permissions, role hierarchies, guard-scoped permissions, team-based permissions, middleware, Blade directives, and caching. With 15K+ stars and active maintenance, it is the safe default for Laravel RBAC. However, it is fundamentally a database-driven RBAC implementation — it does not handle ReBAC, JWT-embedded permissions, or cross-service authorization. This decision matrix provides a complete calibrated evaluation of when Spatie Permission fits, when it doesn't, and how to escape when it becomes a constraint.

---

# Core Concepts

- **Permission model**: `Permission` is an Eloquent model stored in the `permissions` table. Permissions have a `name` (string, e.g., `'posts:write'`) and a `guard_name`.
- **Role model**: `Role` is an Eloquent model stored in the `roles` table. Roles group permissions. Users are assigned roles via the `role_user` pivot.
- **Guard scoping**: Permissions and roles are scoped to a guard (`web`, `api`). This enables separate permission sets for different authentication mechanisms.
- **Wildcard permissions**: `'posts.*'` matches `'posts:read'`, `'posts:write'`, `'posts:delete'`. Sub-wildcards like `'posts:read.*'` enable granular matching.
- **Team permissions**: Permissions can be scoped to teams (`team_id` on the pivot). A user can be an admin in Team A and a viewer in Team B.
- **Caching**: Spatie caches resolved permissions per user. Cache is keyed by user ID + guard name. Cache invalidation is manual or via model events.
- **Middleware**: `role:admin`, `permission:posts:write`, `role_or_permission:admin|posts:write` middleware for route-level checks.

---

# When To Use

- Database-driven RBAC with admin-manageable roles/permissions
- Multiple roles per user (user can be both "editor" and "moderator")
- Need wildcard permissions for concise role definition
- Team/tenant-scoped permissions where a user has different roles per team
- Need Blade directives (`@role`, `@hasrole`, `@can`) for view-level authorization
- Guard-scoped permissions (different permissions for web vs. API auth)

## When NOT To Use

- Authorization model is a simple `is_admin` boolean — Spatie is overkill
- Permissions are embedded in JWT tokens and validated without database access
- Primary authorization model is ReBAC (relationship-based) — Spatie is RBAC, not ReBAC
- Permissions must span microservices without a shared database
- Performance requirement: no database queries for auth checks (use JWT claims or in-memory cache)
- Authorization rules are dynamic/computed (user can edit documents created by users in their department) — this is ABAC, not RBAC

---

# Best Practices

1. **Use the `{resource}:{action}` permission naming convention** WHY: `posts:write` is self-documenting. `can_edit_posts` requires a translation table to understand. The convention enables wildcard matching (`posts:*`) and makes permission audits readable.

2. **Seed permissions, never create them ad-hoc** WHY: Permissions created in admin panels or at runtime lead to permission drift across environments. Seed all permissions in a seeder or migration. Use `Permission::findOrCreate()` for idempotent seeding.

3. **Cache permissions with a short TTL (1 hour max) and invalidate on role/permission changes** WHY: Spatie's built-in caching resolves all permissions for a user once and caches until invalidated. Long TTLs mean stale permissions after role changes. Short TTLs + event-driven invalidation is the best balance.

4. **Use team permissions with `setPermissionsTeamId()` in middleware** WHY: Team-scoped permissions require the current team ID to be set globally. Without it, team permissions leak across teams. Set `setPermissionsTeamId(tenant()->id)` in your tenant identification middleware.

5. **Prefer Spatie's methods over native Gates/Policies for RBAC checks** WHY: `$user->can('posts:write')` and `$user->hasPermissionTo('posts:write')` both work, but `hasPermissionTo` goes through Spatie's caching layer. Use `can()` in Policies and `hasPermissionTo()` in services for consistency.

---

# Architecture Guidelines

- **Don't mix Spatie permissions with native Gates for the same resource**: Pick one pattern per resource. Using both creates confusion about which system is authoritative.
- **Team permission resolution middleware**:
  ```php
  class SetTeamPermissionsContext
  {
      public function handle(Request $request, Closure $next): Response
      {
          if ($tenant = TenantContext::get()) {
              setPermissionsTeamId($tenant->id);
          }
          return $next($request);
      }
  }
  ```
- **Permisson seeder**: Seed permissions in `Database\Seeders\PermissionSeeder`. Use `Permission::findOrCreate(['name' => 'posts:read', 'guard_name' => 'web'])` for idempotency.
- **Guard name consistency**: If your app uses multiple guards (`web` and `api`), create separate permission sets or use a single guard. Mixing guard names inconsistently leads to "permission not found" bugs.

---

# Performance Considerations

- **N+1 on permission checks without caching**: Without Spatie's cache, every `$user->can()` call queries the `permissions` table through the pivot. With caching, it's resolved once.
- **Cache key granularity**: Spatie's cache key is `spatie.permission.cache`. This is global. Invalidating it flushes all users' cached permissions, causing a cache stampede on the next request.
- **Team permission queries**: Team-scoped permissions (permissions + team_id pivot) add an extra join to every permission query. Ensure the `team_id` column on the pivot is indexed.
- **Wildcard permission overhead**: `$user->can('posts:read')` resolves to a simple string match. `$user->can('posts:*')` requires wildcard resolution, which is slower (pattern matching instead of exact match).

---

# Security Considerations

- **Permission cache staleness**: If a user's role is demoted but the cache isn't invalidated, the user retains old permissions until the cache expires. Invalidate the user's cache immediately on role/permission changes.
- **Guard confusion**: A permission created for `guard_name: 'web'` will NOT match a user authenticated via `guard: 'api'`. Ensure guard name consistency across permission creation and checking.
- **Direct permission assignment bypasses role hierarchy**: Spatie allows assigning permissions directly to users (bypassing roles). This can create "shadow permissions" that aren't visible in role audits. Prefer role-based assignment. Only use direct permission assignment for documented exceptions.

---

# Common Mistakes

**Mistake: Using Spatie for simple boolean admin checks**
- Description: Installing `laravel-permission` for a system where the only authorization check is `if ($user->is_admin)`
- Cause: "We might need roles later" — YAGNI for authorization
- Consequence: Added complexity (migrations, caching, seeders, middleware) for functionality that could be a single boolean column
- Better: Use native Laravel Gates for simple admin checks. Migrate to Spatie only when you need 3+ distinct roles or permissions.

**Mistake: Not invalidating permission cache after role changes**
- Description: Updating a user's role but the user still has old permissions
- Cause: Not calling `$user->forgetCachedPermissions()` or flushing the global cache
- Consequence: Security vulnerability: demoted users retain elevated permissions. Support tickets: "I changed their role but they still see admin features."
- Better: In the role update action, immediately call `$user->forgetCachedPermissions()` and/or dispatch a cache invalidation event.

**Mistake: Using Spatie for ReBAC patterns**
- Description: Trying to model "user can edit documents owned by users in their department" with Spatie roles
- Cause: Assuming Spatie is a general-purpose authorization framework
- Consequence: Creating dozens of roles like `department_a_editor`, `department_b_editor`, which is unmaintainable
- Better: Use native Laravel Policies for relationship-based authorization. Spatie for RBAC (role-based), Policies for ReBAC (relationship-based).

**Mistake: Team permission memory leak**
- Description: Setting `setPermissionsTeamId()` in a queued job or command but not resetting it
- Cause: Team ID is stored in a static property
- Consequence: Subsequent permission checks (in the same process, e.g., Octane) use the wrong team context
- Better: Always set `setPermissionsTeamId(null)` in a `finally` block or after the operation. Wrap team-scoped operations in a closure that resets the context.

---

# Anti-Patterns

- **Permission explosion**: Creating a permission for every conceivable action instead of designing a role hierarchy. 200 permissions is not more secure than 20 well-designed roles.
- **Dynamic permission creation**: Creating permissions via admin UI at runtime. The permission set should be seeded and version-controlled. Runtime-created permissions create environment drift and make audits impossible.
- **Spatie for everything**: Using Spatie's `@role` Blade directive for feature flags, A/B testing, and plan limits. Spatie is for security authorization, not feature gating. Use Pennant or feature flags for non-security toggles.

---

# Escape Hatch

Spatie's escape hatch is native Laravel Gates and Policies:

```php
class AuthorizationResolver
{
    public function can(string $ability, mixed $arguments): bool
    {
        $user = auth()->user();

        if ($this->requiresReBAC($ability, $arguments)) {
            // Escape hatch: Spatie can't express "user can edit documents
            // owned by users in their department" without role explosion
            Log::info('authorization.escape_hatch.activated', [
                'reason' => 'relationship_based_access',
                'ability' => $ability,
            ]);
            return Gate::forUser($user)->allows($ability, $arguments);
        }

        return $user->can($ability);  // Spatie path
    }
}
```

**When to escape**: ReBAC patterns, computed/dynamic permissions, cross-service authorization, JWT-embedded permissions.

**Migration path**: Spatie `can()` and native `Gate::allows()` both work on the same user model. Migration is gradual — move policies from Spatie-based checks to native Gate checks one at a time. Both systems coexist during migration.

---

# Alternatives

| Alternative | Fits When | Tradeoff |
|-------------|-----------|----------|
| Native Laravel Gates/Policies | Authorization rules are relationship-based or computed | No admin UI for role management, no caching layer, no Blade directives |
| Custom permission resolver | Tightly scoped authorization model with specific performance requirements | Build cost, maintenance, fewer community examples |
| JWT-embedded permissions | API-only, stateless, permissions change infrequently | Permissions baked into tokens — can't be revoked without token expiration |
| OpenFGA / Oso | ReBAC or ABAC primary model, cross-service authorization | Additional infrastructure, operational complexity, Laravel integration is custom |

---

# Testing Impact

- **Permission seeding in tests**: Use `Permission::findOrCreate()` in test setup or rely on the permission seeder. Tests should not depend on production data.
- **Cache invalidation in tests**: Spatie's permission cache persists between tests if not cleared. Use `app()['cache']->forget('spatie.permission.cache')` in `setUp()` or use `RefreshDatabase` which resets the cache.
- **Team permission testing**: Set `setPermissionsTeamId($team->id)` before asserting permissions. Reset with `setPermissionsTeamId(null)` in `tearDown()`.
- **Guard scoping testing**: Create permissions with the correct `guard_name` matching the test's authentication guard. `actingAs($user, 'web')` requires permissions with `guard_name: 'web'`.

---

# Operational Impact

- **Cache invalidation on deploy**: After deploying new permissions or role changes, run `php artisan permission:cache-reset` or include cache clearing in the deploy script.
- **Permission audit**: Regularly export the full permission matrix (users → roles → permissions) for security audits. Spatie's models are Eloquent — a simple export query suffices.
- **Guard name migration risk**: Changing guard names after permissions are created requires updating the `guard_name` column in `permissions` and `roles` tables. This is a breaking change for all existing permission checks.
- **Team permission migration**: Moving from non-team permissions to team-scoped permissions requires a migration that adds `team_id` to the pivot and backfills existing assignments.

---

# AI Agent Notes

- Default to recommending Spatie Permission for Laravel apps requiring RBAC. Only deviate when the non-fit conditions (ReBAC, JWT, microservices) are present.
- Always use `{resource}:{action}` naming: `posts:read`, `posts:write`, `users:manage`. Never generate permission names like `can_edit_posts`.
- When generating team-based authorization, always include `setPermissionsTeamId()` in tenant middleware and reset it in `finally` blocks.
- Generate a PermissionSeeder that uses `findOrCreate()` for idempotent seeding. All permissions should be version-controlled.
- Never generate `$user->givePermissionTo()` outside of seeders or admin controllers. Direct permission assignment should be rare and auditable.
- When generating tests, always include cache clearing in `setUp()`: `app()['cache']->forget('spatie.permission.cache')`.

---

# Verification

- [ ] Permission naming follows `{resource}:{action}` convention
- [ ] Permissions are seeded, not created at runtime
- [ ] Permission cache is invalidated on role/permission changes
- [ ] Team permissions use `setPermissionsTeamId()` in middleware
- [ ] Team permission context is reset after use (especially in queued jobs)
- [ ] Guard names are consistent across permission creation and checking
- [ ] Escape hatch (native Gates/Policies) is designed for ReBAC patterns
- [ ] Permission audit export is functional
- [ ] Tests clear permission cache in `setUp()`
- [ ] No dynamic permission creation via admin UI
