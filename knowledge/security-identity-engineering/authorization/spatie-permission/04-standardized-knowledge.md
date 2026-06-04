# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Spatie laravel-permission |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

`spatie/laravel-permission` is the standard package for database-driven roles and permissions in Laravel. It provides a `HasRoles` trait for the User model, middleware for route-level permission/role checks, Blade directives, gate integration, team support, wildcard permissions, and automatic cache invalidation. The package uses a flat permission model where permissions can be grouped into roles, and users can be assigned roles or directly given permissions. It integrates seamlessly with Laravel's native Gate/Policy system.

---

## Core Concepts

- **HasRoles Trait**: Adds `assignRole()`, `givePermissionTo()`, `hasPermissionTo()`, `hasRole()`, `can()` methods to the User model.
- **Role ↔ Permission Relationship**: Many-to-many. Roles group permissions. Users ↔ Roles (many-to-many). Users ↔ Permissions (many-to-many via direct assignment or through roles).
- **Gate Integration**: `$user->can('edit-articles')` automatically checks Spatie permissions. No additional configuration needed.
- **Middleware**: `role`, `permission`, `role_or_permission` middleware for route-level checks.
- **Wildcard Permissions**: `*` permission grants all abilities (super-admin pattern).
- **Team Support**: Permissions/roles can be scoped per team via `team_foreign_key`.
- **Cache**: Permissions automatically cached. Cache key includes `team_id` for team-scoped setups.

---

## When To Use

- Any application needing database-driven, admin-manageable roles and permissions
- Multi-role applications with granular permission requirements
- Multi-tenant SaaS applications with role-permission templates per tenant
- Projects where permissions change frequently after deployment

## When NOT To Use

- Simple yes/no admin flag (use a boolean column or Gate)
- Fixed permissions that never change (Gates/ Policies are simpler)
- Stateless JWT-based authorization where roles are embedded in the token

---

## Best Practices

- **Adopt from Day One**: Even for projects with simple role hierarchies. The cost of retrofitting exceeds trivial setup cost.
- **Use `$user->can()` for Permission Checks**: Not `$user->hasRole()`. Permission-centric design.
- **Seed All Permissions**: Define permissions in database seeders. Never create permissions dynamically in application code.
- **Clear Cache on Changes**: Call `php artisan permission:cache-reset` after seeding or modifying roles/permissions.
- **Use Direct Permissions Sparingly**: Prefer assigning permissions through roles. Direct permission assignment bypasses role management.

---

## Architecture Guidelines

- Install: `composer require spatie/laravel-permission`
- Publish migration and config: `php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"`
- Add `HasRoles` trait to `App\Models\User`
- Run migration: `php artisan migrate`
- Define all permissions in seeders
- Use middleware for route protection: `Route::middleware('permission:publish-articles')`
- Use Blade `@can('permission')` for UI conditional rendering

---

## Performance Considerations

- Permissions loaded on first `can()` call per request, then cached for the request duration
- Cache driver configurable in `config/permission.php` — use Redis in production
- Cache invalidation on permission/role changes — clear immediately after seeding
- Team-scoped permissions add an additional `team_id` condition to queries

---

## Security Considerations

- **Cache Staleness**: Changed permissions may not take effect until cache is cleared. Always clear cache when modifying permissions.
- **Super-Admin Bypass**: Use `Gate::before()` with `hasRole('super-admin')` for full bypass, or use wildcard permission for package-level bypass.
- **Team Scoping**: In multi-tenant setups, team-scoped permissions prevent cross-tenant permission leaks.
- **Audit Permission Changes**: Log all role/permission assignments and removals.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Checking `hasRole()` instead of `can()` | Role-centric thinking | Permission changes don't propagate to role checks | Use `$user->can('permission-name')` |
| Not clearing cache after seeding | Unaware of caching | Permissions not available until cache expires | `php artisan permission:cache-reset` after seeding |
| Creating permissions dynamically | Admin panel creates permissions on-the-fly | Permission table grows; no audit trail | Define permissions in config; seed them |
| Direct permission assignment on users | Convenience | Role grouping bypassed; hard to audit | Assign permissions to roles; users get roles |
| Forgetting HasRoles trait | Skipping setup step | `$user->can()` doesn't use Spatie | Add trait to User model |

---

## Anti-Patterns

- **Using Spatie for simple is_admin flags**: Unnecessary complexity for boolean checks
- **No permission seeder**: Permissions created ad-hoc in migrations or controllers
- **Checking roles in Blade instead of permissions**: `@role('editor')` instead of `@can('edit-articles')`
- **Not using Gate integration**: `$user->can()` works automatically — no need to call Spatie methods directly in views

---

## Examples

**Setup:**
```php
// User model
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasRoles;
    // ...
}
```

**Usage:**
```php
// Assign role
$user->assignRole('editor');

// Check permission (uses Gate integration)
if ($user->can('edit-articles')) {
    // ...
}

// Middleware on routes
Route::middleware('permission:publish-articles|delete-articles')->group(function () {
    // Requires either permission
});

// Blade
@can('edit-articles')
    <a href="{{ route('articles.edit', $article) }}">Edit</a>
@endcan
```

---

## Related Topics

- RBAC design (role-based access control)
- Permission-based access
- Super-admin bypass patterns
- Authorization testing
- Blade authorization directives
- Team-scoped permissions

---

## AI Agent Notes

- Spatie laravel-permission is the de facto standard for role/permission management in Laravel (48M+ installs).
- If the project needs database-driven roles, this should be the first package considered.
- The Gate integration means `$user->can()` works automatically — no Spatie-specific method calls needed in most code.

---

## Verification

- [ ] `spatie/laravel-permission` installed
- [ ] `HasRoles` trait added to User model
- [ ] Migration published and run
- [ ] Permissions seeded in database seeder
- [ ] Permission cache cleared after seeding
- [ ] Route middleware configured for permission/role checks
- [ ] Blade directives use `@can('permission')` not `@role('role')`
- [ ] Gate integration verified: `$user->can('permission')` works
- [ ] Team scoping configured (if multi-tenant)
- [ ] Permission changes audited (log all role/permission assignments)
