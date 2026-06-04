# Rules: Spatie laravel-permission

## Add HasRoles Trait to User Model From Setup
---
## Category
Framework Usage
---
## Rule
Add the `HasRoles` trait to the `User` model immediately after installing `spatie/laravel-permission`. This enables all permission and role methods.
---
## Reason
Without the `HasRoles` trait, `$user->can('permission')` falls back to Laravel's native Gate/Policy system and ignores Spatie permissions entirely. All role and permission methods (`assignRole`, `givePermissionTo`, `hasPermissionTo`) are unavailable, making the package non-functional.
---
## Bad Example
```php
class User extends Authenticatable {
    // Missing HasRoles trait — Spatie methods not available
}
```
---
## Good Example
```php
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable {
    use HasRoles;
}
```
---
## Exceptions
No common exceptions — the trait is mandatory for Spatie usage.
---
## Consequences Of Violation
Permission checks return incorrect results, Spatie methods unavailable.
---

## Use $user->can() for Permission Checks — Not hasRole()
---
## Category
Framework Usage
---
## Rule
Check authorization using `$user->can('permission-name')`. The `can()` method integrates with Laravel's native Gate system automatically. Avoid `$user->hasRole('editor')` in application logic.
---
## Reason
`$user->can()` automatically checks Spatie permissions through Gate integration. It works with Blade `@can`, middleware, and policies. `hasRole()` checks role names directly — if a role is renamed, code breaks. Permission-centric checks are stable across role changes.
---
## Bad Example
```php
if ($user->hasRole('editor')) { // Fragile role check
    // Show editor features
}
```
---
## Good Example
```php
if ($user->can('edit-articles')) { // Stable permission check
    // Show editor features
}
```
---
## Exceptions
Admin management pages where displaying or managing role assignments.
---
## Consequences Of Violation
Role renames break application logic, inconsistent authorization.
---

## Seed All Permissions — Never Create Dynamically
---
## Category
Maintainability
---
## Rule
Define all permissions and roles in database seeders. Never create them dynamically in controllers, services, or migrations.
---
## Reason
Dynamic creation leads to uncontrolled permission table growth, makes auditing impossible, and bypasses the seeding/caching workflow. Seeded permissions are predictable, version-controlled, and can be cleared and re-seeded reliably.
---
## Bad Example
```php
// Permission created dynamically in controller
Permission::firstOrCreate(['name' => 'report.export']);
```
---
## Good Example
```php
// database/seeders/RolePermissionSeeder.php
foreach (['articles.edit', 'articles.delete'] as $name) {
    Permission::create(['name' => $name]);
}
Role::create(['name' => 'editor'])->givePermissionTo(['articles.edit']);
```
---
## Exceptions
Multi-tenant apps where tenants can define custom permissions — document the pattern.
---
## Consequences Of Violation
Uncontrolled permission growth, auditing impossible, cache issues.
---

## Clear Cache After Every Permission/Role Change
---
## Category
Maintainability
---
## Rule
Run `php artisan permission:cache-reset` after seeding, or after any role/permission modification via admin panel.
---
## Reason
Spatie caches permissions in Laravel's cache driver. Without cache reset, changes (new permissions, modified role assignments) may not take effect for the cache duration. Users may see stale permissions — newly granted permissions not working or revoked permissions still active.
---
## Bad Example
```bash
php artisan db:seed --class=RolePermissionSeeder
# Cache not cleared — changes may not apply
```
---
## Good Example
```bash
php artisan db:seed --class=RolePermissionSeeder
php artisan permission:cache-reset
```
---
## Exceptions
No common exceptions — cache must be reset after every change.
---
## Consequences Of Violation
Permission changes not taking effect, stale authorization state.
---

## Use Direct Permissions Sparingly, Prefer Role Assignment
---
## Category
Architecture
---
## Rule
Assign permissions to roles, then assign roles to users. Only give direct permissions (`givePermissionTo`) in exceptional cases with documented justification.
---
## Reason
Direct permissions bypass role grouping, making it impossible to manage permissions in bulk. If 50 users have a direct permission, changing that permission requires 50 individual updates. With roles, one role update affects all members. Direct permissions also complicate auditing.
---
## Bad Example
```php
// 50 users each get direct permission
$user->givePermissionTo('articles.edit');
```
---
## Good Example
```php
// Permission assigned to role; one update affects all members
$role = Role::findByName('editor');
$role->givePermissionTo('articles.edit');
$user->assignRole('editor');
```
---
## Exceptions
One-off temporary access for a specific user with documented expiry.
---
## Consequences Of Violation
Hard to manage permissions in bulk, auditing complexity.
---

## Use Gate::before() for Super-Admin Bypass With Spatie
---
## Category
Security
---
## Rule
Register `Gate::before()` that checks `$user->hasRole('super-admin')` for super-admin bypass. Combine with Spatie's wildcard permission if needed.
---
## Reason
The `Gate::before()` pattern allows super-admins to bypass all authorization checks. `$user->hasRole('super-admin')` is the appropriate check inside the bypass — it is the one place where checking a role instead of a permission is correct.
---
## Bad Example
```php
// No super-admin bypass — super-admin users still checked against policies
```
---
## Good Example
```php
Gate::before(function (User $user) {
    return $user->hasRole('super-admin') ?: null;
});
// Or with wildcard permission
Gate::before(function (User $user) {
    return $user->hasPermissionTo('*') ?: null;
});
```
---
## Exceptions
Applications without super-admin functionality.
---
## Consequences Of Violation
Super-admin users blocked by regular authorization checks.
---

## Enable Team Scoping for Multi-Tenant Permission Isolation
---
## Category
Architecture
---
## Rule
Configure Spatie team support (`team_foreign_key` in config) when permissions need to be scoped per tenant or team.
---
## Reason
Without team scoping, a user assigned the "admin" role in one tenant would have admin access in all tenants. Team scoping adds a `team_id` column to pivot tables, ensuring roles and permissions are isolated per team/tenant.
---
## Bad Example
```php
// Team support not configured — cross-tenant role leak
```
---
## Good Example
```php
// config/permission.php
'teams' => true,
'team_foreign_key' => 'team_id',
// User role assignment requires team context
$user->assignRole('admin', $team);
```
---
## Exceptions
Single-tenant applications.
---
## Consequences Of Violation
Cross-tenant role leakage, users have wrong permissions in other tenants.
