# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authorization & Access Control
**Knowledge Unit:** RBAC design (hierarchical, constrained)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: $user->hasRole() in Application Code**: Using role checks instead of permission checks in business logic
- [ ] Prevent anti-pattern: No Permission Seeder**: Permissions created ad-hoc instead of seeded
- [ ] Prevent anti-pattern: Wildcard * Permission on Non-Admin Roles**: Granting broad access beyond the super-admin role
- [ ] Permissions use `resource.action` format, not role names
- [ ] Code checks `$user->can('permission-name')`, never `$user->hasRole('role-name')`
- [ ] Permissions seeded (not created dynamically)
- [ ] Permission cache cleared on seeding/changes
- [ ] No direct permission assignment to users (always through roles)
- [ ] Avoid: Mistake
- [ ] Avoid: Checking roles instead of permissions
- [ ] Avoid: Creating permissions dynamically

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Install `spatie/laravel-permission` â€” publishes migration and config
- Add `HasRoles` trait to the User model
- Seed roles and permissions in `database/seeders/`
- Use middleware for route-level checks: `Route::middleware('permission:edit-articles')`
- Use `@can('edit-articles')` in Blade (permission name, not role name)
- Cache invalidation on permission/role changes: `php artisan permission:cache-reset`

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Permissions use `resource.action` format, not role names
- [ ] - [ ] Code checks `$user->can('permission-name')`, never `$user->hasRole('role-name')`
- [ ] - [ ] Permissions seeded (not created dynamically)
- [ ] - [ ] Permission cache cleared on seeding/changes

# Performance Checklist
- Permissions cache: loaded once per request or cached in Redis/memory
- `spatie/laravel-permission` caches permissions in Laravel's cache driver â€” ~0.5ms per check
- Database queries: permissions loaded on first check, then cached for the request
- Clear cache after permission changes to prevent stale authorization

# Security Checklist
- **Permission Change Propagation**: Permission changes apply to all users with that role immediately (cached â€” clear cache to force refresh).
- **Role Hierarchy**: Ensure hierarchical roles don't accidentally grant unintended permissions.
- **Separation of Duties**: Implement audit trail for role assignments. Alert on separation-of-duty violations.
- **No Direct Permission on Users**: Assign permissions to roles, not directly to users. Direct permission assignment bypasses role management.

# Reliability Checklist
- [ ] Ensure: Role-Based Access Control (RBAC) in Laravel is typically implemented using datab...

# Testing Checklist
- [ ] Permissions use `resource.action` format, not role names
- [ ] Code checks `$user->can('permission-name')`, never `$user->hasRole('role-name')`
- [ ] Permissions seeded (not created dynamically)
- [ ] Permission cache cleared on seeding/changes
- [ ] No direct permission assignment to users (always through roles)
- [ ] Wildcard `*` permission only on super-admin role
- [ ] Avoid: Mistake
- [ ] Avoid: Checking roles instead of permissions
- [ ] Avoid: Creating permissions dynamically

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: $user->hasRole() in Application Code**: Using role checks instead of permission checks in business logic
- [ ] Prevent: No Permission Seeder**: Permissions created ad-hoc instead of seeded
- [ ] Prevent: Wildcard * Permission on Non-Admin Roles**: Granting broad access beyond the super-admin role
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Checking roles instead of permissions
- [ ] Avoid mistake: Creating permissions dynamically
- [ ] Avoid mistake: Not clearing cache after permission changes
- [ ] Avoid mistake: Assigning permissions directly to users

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Anti-Patterns
- $user->hasRole() in Application Code**: Using role checks instead of permission checks in business logic
- No Permission Seeder**: Permissions created ad-hoc instead of seeded
- Wildcard * Permission on Non-Admin Roles**: Granting broad access beyond the super-admin role
## Skills
- Design Role-Based Access Control with Permission-Centric Authorization


