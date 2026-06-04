# Skill: Implement Spatie laravel-permission for Database-Driven Roles and Permissions

## Purpose
Install and configure `spatie/laravel-permission` to manage roles and permissions via database with trait-based user integration, middleware, Blade directives, and automatic Gate integration.

## When To Use
- Any application needing database-driven, admin-manageable roles and permissions
- Multi-role applications with granular permission requirements
- Multi-tenant SaaS applications with role-permission templates per tenant
- Projects where permissions change frequently after deployment

## When NOT To Use
- Simple yes/no admin checks (use Gates or `is_admin` flag)
- Fixed permissions that never change (Gates/Policies are simpler)
- Applications where Spatie's database queries are too heavy for the use case

## Prerequisites
- `composer require spatie/laravel-permission`
- `php artisan vendor:publish --tag=permission-config --tag=permission-migrations`
- `php artisan migrate`

## Workflow
1. Add `HasRoles` trait to User model immediately after installation
2. Define permissions and roles in database seeders — never create dynamically
3. Assign permissions to roles, roles to users (no direct permission-to-user assignment)
4. Use `$user->can('permission-name')` in controllers, policies, and Blade `@can`
5. Use `permission` middleware for route-level checks
6. Clear permission cache after seeding/changes: `php artisan permission:cache-reset`
7. Configure team support via `team_foreign_key` if multi-tenant
8. Apply wildcard `*` permission only to super-admin role
9. Implement separation of duties constraints at the application level

## Validation Checklist
- [ ] `HasRoles` trait added to User model
- [ ] Permissions seeded, not created dynamically
- [ ] `$user->can()` used instead of `hasRole()` in application code
- [ ] Permission cache cleared on every role/permission change
- [ ] Permissions assigned to roles, not directly to users
- [ ] Wildcard `*` restricted to super-admin
- [ ] Separation of duties constraints implemented
