# Rules for Spatie Permission Decision Matrix

## Use the {resource}:{action} Permission Naming Convention
---
## Category
Architecture | Maintainability
---
## Rule
Permission names must follow the `{resource}:{action}` convention: `posts:read`, `posts:write`, `users:manage`. Never use ad-hoc names like `can_edit_posts` or `admin_access`. This enables wildcard matching (`posts:*`) and makes permission audits readable.
---
## Reason
Structured naming enables wildcards (`posts:*` matches `posts:read`, `posts:write`, `posts:delete`) and sub-wildcards. It makes permission audits self-documenting — `users:manage` is clearly a permission to manage users. Ad-hoc names require a lookup table to understand. Consistent naming also enables automated tooling: a permission seeder can validate all names match the convention.
---
## Bad Example
```php
// Ad-hoc permission names
Permission::create(['name' => 'can_edit_posts']);
Permission::create(['name' => 'view_dashboard']);
Permission::create(['name' => 'admin_access']);
Permission::create(['name' => 'allow_user_management']);
// Wildcards don't work. Naming is inconsistent. Audits require a glossary.
```
---
## Good Example
```php
// Structured {resource}:{action} naming
Permission::create(['name' => 'posts:read']);
Permission::create(['name' => 'posts:write']);
Permission::create(['name' => 'posts:delete']);
Permission::create(['name' => 'posts:publish']);
Permission::create(['name' => 'dashboard:view']);
Permission::create(['name' => 'users:manage']);
Permission::create(['name' => 'users:read']);

// Wildcards work
Role::create(['name' => 'editor'])->givePermissionTo('posts:*');
// posts:* grants posts:read, posts:write, posts:delete, posts:publish
```
---
## Exceptions
When integrating with an existing external system that uses a different naming convention, maintaining consistency with that system may override this rule. Document the chosen convention and apply it consistently within the application.
---
## Consequences Of Violation
Wildcard permissions break. Permission audits require manual translation. New team members create inconsistent permission names. The permission set grows to 200+ ad-hoc names that nobody can audit or reason about.

## Seed Permissions — Never Create Them at Runtime
---
## Category
Architecture | Security
---
## Rule
All permissions must be seeded via a version-controlled seeder or migration. Permissions must never be created dynamically at runtime through an admin UI or API endpoint. Use `Permission::findOrCreate()` for idempotent seeding.
---
## Reason
Permissions created at runtime cause environment drift — staging has different permissions than production. Audits become impossible because there is no canonical permission set. A runtime-created permission could grant unintended access with no code review. Seeded permissions are version-controlled, reviewed in PRs, and identical across environments.
---
## Bad Example
```php
// Runtime permission creation in admin controller
class AdminPermissionController
{
    public function store(Request $request): JsonResponse
    {
        Permission::create(['name' => $request->input('name')]);
        // Permission created at runtime — not version controlled
        // Different permissions in staging vs production
    }
}
```
---
## Good Example
```php
// Seeded permissions — version controlled, idempotent
class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'posts:read', 'posts:write', 'posts:delete', 'posts:publish',
            'users:read', 'users:manage',
            'dashboard:view',
            'reports:export',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
    }
}

// Only seeded permissions exist. Admin UI manages role-permission assignment,
// not permission creation.
```
---
## Exceptions
Multi-tenant applications where tenants define custom permissions within a predefined scope (e.g., "custom reports for tenant X") may allow runtime permission creation, but the permission namespace must be scoped (e.g., `custom:tenant_{id}:report_{name}`) and auditable.
---
## Consequences Of Violation
Permission drift across environments. Production has permissions staging doesn't, causing deployment bugs where a feature works in staging but fails in production due to missing permissions. Auditors cannot verify the permission set because it changes at runtime.

## Invalidate Permission Cache on Role/Permission Changes
---
## Category
Security | Reliability
---
## Rule
When a user's role or permissions are modified, the permission cache for that specific user must be invalidated immediately. Do not rely on the global cache TTL to eventually expire stale permissions. Use `$user->forgetCachedPermissions()` or flush the relevant cache key.
---
## Reason
If a user is demoted from admin to viewer but the cache isn't invalidated, the user retains admin permissions until the cache expires (up to 1 hour by default). This is a security vulnerability: a demoted user can still perform admin actions. Immediate invalidation prevents this window entirely.
---
## Bad Example
```php
class UpdateUserRoleAction
{
    public function execute(User $user, string $newRole): void
    {
        $user->syncRoles([$newRole]);
        // Cache NOT invalidated — user retains old permissions
    }
}
```
---
## Good Example
```php
class UpdateUserRoleAction
{
    public function execute(User $user, string $newRole): void
    {
        $user->syncRoles([$newRole]);
        $user->forgetCachedPermissions(); // Immediate invalidation

        // Or flush the user-specific cache key
        Cache::forget("spatie.permission.cache.user:{$user->id}");

        event(new UserPermissionsUpdated($user));
    }
}
```
---
## Exceptions
In very high-throughput systems where permission changes are rare and the cache TTL is short (5 minutes), the window of stale permissions may be an accepted risk. This must be a documented, explicit security decision.
---
## Consequences Of Violation
Demoted users retain elevated permissions. Support tickets: "I changed their role but they still see admin features." Security audit finding: permission changes do not take immediate effect.

## Do Not Use Spatie for Simple Boolean Admin Checks
---
## Category
Architecture | YAGNI
---
## Rule
Do not install `laravel-permission` for applications where the only authorization check is "is this user an admin?" A single `is_admin` boolean column with native Laravel Gates is sufficient. Spatie adds migrations, caching, seeders, middleware, and complexity that provide zero value for single-role systems.
---
## Reason
Spatie Permission adds 4 database tables (`roles`, `permissions`, `role_user`, `permission_role`), a caching layer, custom middleware, Blade directives, and a permission resolution system. When the authorization model is a single boolean, all of this is dead weight. It increases the attack surface, adds migration complexity, and confuses new developers who expect a full RBAC system.
---
## Bad Example
```php
// Single admin check — using Spatie is overkill
class UserPolicy
{
    public function manage(User $user): bool
    {
        return $user->hasRole('admin'); // Spatie for a single role
    }
}
// Alternative: $user->is_admin boolean + native Gate
```
---
## Good Example
```php
// Native Laravel Gate for simple admin systems
Gate::define('admin', fn (User $user) => $user->is_admin);

// In controller
Gate::authorize('admin');

// In Blade
@can('admin')
    <a href="/admin">Admin Panel</a>
@endcan

// Only introduce Spatie when you need 3+ roles, granular permissions,
// wildcards, or team-scoped permissions.
```
---
## Exceptions
If the product roadmap includes multi-role RBAC within the next quarter, adopting Spatie early may be acceptable to avoid a migration later. This is a conscious decision with a documented timeline, not YAGNI.
---
## Consequences Of Violation
Added complexity without benefit. 4 unnecessary database tables. Team members spend time learning Spatie's API for a system that could be a single boolean column. Package upgrade friction for features that are never used.

## Set Team Permission Context in Middleware — Reset It After Use
---
## Category
Security | Reliability
---
## Rule
When using team-scoped permissions, set `setPermissionsTeamId()` in tenant identification middleware. Always reset the team context after the operation — especially in queued jobs and commands — using a `finally` block or `setPermissionsTeamId(null)`.
---
## Reason
Team permissions use a global static property to track the current team context. In long-lived processes (Octane, queue workers), this static property persists across requests and jobs if not reset. A queued job processing Team A's data may inadvertently check permissions against Team B's context from a previous job, causing cross-tenant permission leakage.
---
## Bad Example
```php
class ProcessTeamTask implements ShouldQueue
{
    public function handle(): void
    {
        setPermissionsTeamId($this->teamId);
        // Job completes but team context persists for next job
    }
}
```
---
## Good Example
```php
class ProcessTeamTask implements ShouldQueue
{
    public function handle(): void
    {
        try {
            setPermissionsTeamId($this->teamId);
            // Process task with correct team scope
        } finally {
            setPermissionsTeamId(null); // Always reset
        }
    }
}

// Or in middleware
class SetTeamPermissionsContext
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($tenant = TenantContext::get()) {
            setPermissionsTeamId($tenant->id);
        }
        try {
            return $next($request);
        } finally {
            setPermissionsTeamId(null);
        }
    }
}
```
---
## Exceptions
Short-lived PHP processes (traditional PHP-FPM) automatically reset statics between requests. This rule primarily applies to long-lived processes (Octane, Laravel Vapor, horizon workers, scheduled commands).
---
## Consequences Of Violation
Cross-tenant permission leakage in queue workers. Team A's admin permissions applied to Team B's tasks. Difficult-to-reproduce bugs that only occur in production under concurrent load.
