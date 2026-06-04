# Rules: Role-Based Access Control (RBAC)

## Check Permissions, Never Roles, in Application Code
---
## Category
Architecture
---
## Rule
Use `$user->can('permission-name')` to check authorization. Never use `$user->hasRole('role-name')` in application code.
---
## Reason
Permissions are stable authorization primitives. Roles are grouping conveniences that can be renamed, restructured, or have their permission set changed. Code checking `hasRole('editor')` breaks when the role is renamed to `contributor`. Code checking `can('edit-articles')` works regardless of role name.
---
## Bad Example
```php
if ($user->hasRole('editor')) { // Role-based — breaks on rename
    // Show editor features
}
```
---
## Good Example
```php
if ($user->can('edit-articles')) { // Permission-based — stable
    // Show editor features
}
```
---
## Exceptions
Admin UI pages listing role assignments (managing who has which role).
---
## Consequences Of Violation
Role renames break application logic, permission changes don't propagate.
---

## Design Permissions as Granular resource.action Strings
---
## Category
Architecture
---
## Rule
Define permissions using a `resource.action` naming convention (e.g., `articles.edit`, `users.delete`, `reports.export`). Avoid broad permissions like `manage-articles`.
---
## Reason
Granular permissions implement the principle of least privilege. A user who can `edit` articles may not need to `delete` or `publish` them. Broad permissions force all-or-nothing grants, making it impossible to create roles with partial access.
---
## Bad Example
```php
Permission::create(['name' => 'manage-articles']); // Too broad
```
---
## Good Example
```php
Permission::create(['name' => 'articles.edit']);
Permission::create(['name' => 'articles.delete']);
Permission::create(['name' => 'articles.publish']);
```
---
## Exceptions
No common exceptions — granular permissions are always preferred.
---
## Consequences Of Violation
Cannot grant partial access, least privilege violated.
---

## Seed All Permissions — Never Create Dynamically in Code
---
## Category
Maintainability
---
## Rule
Define all permissions in database seeders. Never create permissions dynamically in application code, controllers, or migrations.
---
## Reason
Dynamic permission creation causes the permissions table to grow uncontrollably, makes auditing impossible, and creates cache inconsistency. Seeded permissions are version-controlled, reviewable, and predictable. New permissions are added via new seeders, not application logic.
---
## Bad Example
```php
// Permission created dynamically on first use
if (!Permission::where('name', 'report.export')->exists()) {
    Permission::create(['name' => 'report.export']);
}
```
---
## Good Example
```php
// database/seeders/RolePermissionSeeder.php
foreach (['articles.edit', 'articles.delete'] as $permission) {
    Permission::create(['name' => $permission]);
}
```
---
## Exceptions
Multi-tenant applications where tenants can create custom permissions.
---
## Consequences Of Violation
Uncontrolled permission table growth, hard to audit, cache issues.
---

## Assign Permissions to Roles, Never Directly to Users
---
## Category
Architecture
---
## Rule
Assign permissions to roles. Users receive permissions through role assignment. Avoid giving users direct permissions.
---
## Reason
Role-based permission assignment enables grouping, bulk updates, and clear audit trails. Directly assigned permissions bypass role management, making it impossible to see which users have a given permission without scanning all user records. Role assignment also simplifies auditing — "all editors have these permissions."
---
## Bad Example
```php
$user->givePermissionTo('articles.edit'); // Direct — bypasses role model
```
---
## Good Example
```php
$editor = Role::findByName('editor');
$editor->givePermissionTo('articles.edit');
$user->assignRole('editor'); // User gets permissions through role
```
---
## Exceptions
One-off temporary access grants with documented expiry.
---
## Consequences Of Violation
Hard to audit permissions, no grouping, management burden.
---

## Clear Permission Cache After Role/Permission Changes
---
## Category
Maintainability
---
## Rule
Run `php artisan permission:cache-reset` after seeding, modifying roles, or changing permission assignments.
---
## Reason
Spatie laravel-permission caches permissions for performance. After changes, the cache contains stale data — newly assigned permissions may not take effect, and revoked permissions may still be granted. Cache reset forces reload from the database.
---
## Bad Example
```bash
# Permissions in seeder run, but cache not reset
php artisan db:seed --class=RolePermissionSeeder
# New permissions not available until cache expires
```
---
## Good Example
```bash
php artisan db:seed --class=RolePermissionSeeder
php artisan permission:cache-reset
```
---
## Exceptions
Development environments where cache expiry is short.
---
## Consequences Of Violation
Permission changes not taking effect, stale authorization.
---

## Avoid Using Wildcard Permissions Except for Super-Admin
---
## Category
Security
---
## Rule
Restrict the `*` wildcard permission to super-admin roles only. Never assign wildcard permissions to regular roles or users.
---
## Reason
The `*` wildcard bypasses all permission checks. Assigning it to a non-admin role grants complete access to every feature, defeating the purpose of RBAC. Only the super-admin role should have unrestricted access.
---
## Bad Example
```php
$editor = Role::create(['name' => 'editor']);
$editor->givePermissionTo('*'); // Editor has full access — RBAC defeated
```
---
## Good Example
```php
$superAdmin = Role::create(['name' => 'super-admin']);
$superAdmin->givePermissionTo('*'); // Only super-admin gets full access
```
---
## Exceptions
No common exceptions — wildcard is for super-admin only.
---
## Consequences Of Violation
Accidental full access granted to non-admin roles, RBAC bypassed.
---

## Implement Separation of Duties Constraints
---
## Category
Architecture
---
## Rule
Enforce separation of duties at the application level — prevent a user from holding conflicting roles (e.g., auditor and admin) simultaneously.
---
## Reason
Without separation of duties, a single user can control conflicting processes (e.g., creating invoices and approving them). This is a compliance requirement (SOX, SOC2) and a fraud prevention measure. Application-level enforcement ensures the constraint cannot be bypassed.
---
## Bad Example
```php
// No constraint — user can have both auditor and admin roles
$user->assignRole('auditor');
$user->assignRole('admin'); // Conflicting roles allowed
```
---
## Good Example
```php
public function assignRole(User $user, string $role): void {
    $conflicting = ['auditor', 'admin']; // Cannot hold both
    if (in_array($role, $conflicting) && $user->hasRole(array_diff($conflicting, [$role]))) {
        throw new \Exception('Separation of duties violation');
    }
    $user->assignRole($role);
}
```
---
## Exceptions
Applications without compliance requirements for separation of duties.
---
## Consequences Of Violation
Compliance violation, fraud risk, audit failure.
