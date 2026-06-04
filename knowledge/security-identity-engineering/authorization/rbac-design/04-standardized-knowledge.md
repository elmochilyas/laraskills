# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Role-Based Access Control (RBAC) |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Role-Based Access Control (RBAC) in Laravel is typically implemented using database-driven roles and permissions via `spatie/laravel-permission`. RBAC groups permissions into roles, and users are assigned roles. Permissions are checked directly in application code (not roles). The fundamental design principle: **check permissions, not roles**. A user can access a feature because they have the `edit-articles` permission, not because they have the `editor` role. Roles are a grouping convenience, not an authorization primitive.

---

## Core Concepts

- **Role**: A named group of permissions (e.g., `editor`, `admin`, `subscriber`).
- **Permission**: A granular ability (e.g., `edit-articles`, `publish-articles`, `delete-articles`).
- **Role Assignment**: Users are assigned one or more roles via `$user->assignRole('editor')`.
- **Permission Inheritance**: `$user->hasPermissionTo('edit-articles')` — checks all roles' permissions.
- **Permission-Centrism**: Code checks `$user->can('edit-articles')`, never `$user->hasRole('editor')`.
- **Hierarchical Roles**: Roles can imply other roles (e.g., `admin` includes all `editor` permissions). Implemented via role hierarchy or wildcards.
- **Separation of Duties**: Constraint that a user cannot have conflicting roles (e.g., `auditor` and `admin`) — enforced at the application level.

---

## When To Use

- Applications with multiple user types sharing common permissions
- Multi-tenant SaaS applications with role-permission templates per tenant
- Applications where permissions change frequently (admin-managed roles)
- Team projects requiring standardized permission naming

## When NOT To Use

- Simple yes/no admin authorization (use Gates or a single `is_admin` flag)
- Applications with fixed, rarely-changing permissions (define in Gates/ Policies)
- Stateless API authorization where roles are embedded in JWT tokens

---

## Best Practices

- **Check Permissions, Not Roles**: `$user->can('edit-articles')` — never `$user->hasRole('editor')`. Roles change; permissions are stable.
- **Design Permissions Granularly**: `edit-articles`, `delete-articles`, `publish-articles`. Avoid `manage-articles` (too broad).
- **Seed Roles and Permissions**: Use database seeders for initial setup. Never create permissions dynamically in code.
- **Cache Permissions**: `spatie/laravel-permission` caches permissions automatically — clear cache on permission changes.
- **Document Permission Naming Convention**: Use `resource.action` format (e.g., `articles.edit`, `users.delete`).

---

## Architecture Guidelines

- Install `spatie/laravel-permission` — publishes migration and config
- Add `HasRoles` trait to the User model
- Seed roles and permissions in `database/seeders/`
- Use middleware for route-level checks: `Route::middleware('permission:edit-articles')`
- Use `@can('edit-articles')` in Blade (permission name, not role name)
- Cache invalidation on permission/role changes: `php artisan permission:cache-reset`

---

## Performance Considerations

- Permissions cache: loaded once per request or cached in Redis/memory
- `spatie/laravel-permission` caches permissions in Laravel's cache driver — ~0.5ms per check
- Database queries: permissions loaded on first check, then cached for the request
- Clear cache after permission changes to prevent stale authorization

---

## Security Considerations

- **Permission Change Propagation**: Permission changes apply to all users with that role immediately (cached — clear cache to force refresh).
- **Role Hierarchy**: Ensure hierarchical roles don't accidentally grant unintended permissions.
- **Separation of Duties**: Implement audit trail for role assignments. Alert on separation-of-duty violations.
- **No Direct Permission on Users**: Assign permissions to roles, not directly to users. Direct permission assignment bypasses role management.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Checking roles instead of permissions | Convenience | Adding a permission to a role may not grant access if code checks the role name | Always check `$user->can('permission-name')` |
| Creating permissions dynamically | Runtime permission generation | Permission table grows uncontrollably; cache issues | Define all permissions in seeders; control via config |
| Not clearing cache after permission changes | Unaware of caching | Changes don't take effect until cache expires | Clear permission cache on every role/permission change |
| Assigning permissions directly to users | Bypassing role model | No role grouping; hard to audit | Assign permissions to roles; users get roles |

---

## Anti-Patterns

- **`$user->hasRole('editor')` in application code**: Code breaks when role name changes or when new roles are created
- **Single "admin" role with all permissions**: Defeats the purpose of granular RBAC
- **No permission seeder**: Permissions created ad-hoc in tests or controllers
- **Wildcard permissions without restriction**: `*` permission should only be for super-admin

---

## Examples

**Seeding roles and permissions:**
```php
// database/seeders/RolePermissionSeeder.php
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

$permissions = ['articles.edit', 'articles.delete', 'articles.publish', 'users.manage'];

foreach ($permissions as $permission) {
    Permission::create(['name' => $permission]);
}

$editor = Role::create(['name' => 'editor']);
$editor->givePermissionTo(['articles.edit', 'articles.publish']);

$admin = Role::create(['name' => 'admin']);
$admin->givePermissionTo(Permission::all());
```

**Checking permissions:**
```php
// Controller
public function edit(Article $article)
{
    $this->authorize('articles.edit'); // Uses Gate integration with Spatie
    // or
    if (!$request->user()->can('articles.edit')) {
        abort(403);
    }
}

// Middleware on route
Route::middleware('permission:articles.edit')->group(function () {
    // ...
});
```

---

## Related Topics

- Spatie laravel-permission (implementation package)
- Permission-based access (direct permission checks)
- Super-admin bypass patterns
- Authorization testing
- Blade authorization directives

---

## AI Agent Notes

- Permission-centric design is the key RBAC principle: check permissions, not roles.
- If a project uses `hasRole()` in application code, flag for refactoring.
- Spatie laravel-permission is the gold standard — if not present, evaluate whether the project needs it.

---

## Verification

- [ ] Permissions designed granularly (resource.action format)
- [ ] Application code checks permissions, not roles
- [ ] Roles and permissions seeded (not created dynamically)
- [ ] `HasRoles` trait added to User model
- [ ] Permission cache cleared on role/permission changes
- [ ] No direct permission assignment to users (always through roles)
- [ ] Separation of duty constraints documented and enforced
- [ ] Blade directives use `@can('permission')` not `@role('editor')`
- [ ] Super-admin role uses `*` wildcard or explicit list
