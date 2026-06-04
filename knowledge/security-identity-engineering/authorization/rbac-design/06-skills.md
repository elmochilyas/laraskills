# Skill: Design Role-Based Access Control with Permission-Centric Authorization

## Purpose
Design and implement RBAC using `spatie/laravel-permission` with permission-centric checking, granular `resource:action` permissions, and seeded role-permission assignments.

## When To Use
- Applications with multiple user types sharing common permissions
- Multi-tenant SaaS applications with role-permission templates per tenant
- Admin-managed roles that change frequently
- Team projects requiring standardized permission naming

## When NOT To Use
- Simple yes/no admin authorization (use Gates or `is_admin` flag)
- Fixed, rarely-changing permissions (define in Gates/Policies)
- Stateless JWT-based authorization with embedded roles

## Prerequisites
- `composer require spatie/laravel-permission`
- User model with `HasRoles` trait
- Published config and migration

## Workflow
1. Install Spatie package and add `HasRoles` trait to User model
2. Design permissions as granular `resource.action` strings (e.g., `articles.edit`)
3. Seed all permissions in `database/seeders/RolePermissionSeeder.php`
4. Group permissions into roles via seeder; assign permissions to roles
5. Check `$user->can('permission-name')` in controllers and Blade — never `hasRole()`
6. Clear permission cache after seeding: `php artisan permission:cache-reset`
7. Implement separation of duties constraints for conflicting roles
8. Restrict wildcard `*` permission to super-admin role only

## Validation Checklist
- [ ] Permissions use `resource.action` format, not role names
- [ ] Code checks `$user->can('permission-name')`, never `$user->hasRole('role-name')`
- [ ] Permissions seeded (not created dynamically)
- [ ] Permission cache cleared on seeding/changes
- [ ] No direct permission assignment to users (always through roles)
- [ ] Wildcard `*` permission only on super-admin role
- [ ] Separation of duties implemented for conflicting roles

## Success Criteria
- Permission checks work regardless of role renames
- New roles can be created without code changes
- Permission cache properly invalidated after updates
- No direct permission assignment bypasses role model
- Super-admin is the only role with wildcard access
