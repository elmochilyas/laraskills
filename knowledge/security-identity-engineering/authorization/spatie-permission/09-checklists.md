# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authorization & Access Control
**Knowledge Unit:** Spatie laravel-permission (roles, permissions)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Spatie for Simple is_admin Flag**: Using Spatie when a boolean column would suffice
- [ ] Prevent anti-pattern: No Permission Seeder**: Permissions created ad-hoc in migrations or controllers
- [ ] Prevent anti-pattern: Checking Roles in Blade Instead of Permissions**: `@role('editor')` instead of `@can('edit-articles')`
- [ ] `HasRoles` trait added to User model
- [ ] Permissions seeded, not created dynamically
- [ ] `$user->can()` used instead of `hasRole()` in application code
- [ ] Permission cache cleared on every role/permission change
- [ ] Permissions assigned to roles, not directly to users
- [ ] Avoid: Mistake
- [ ] Avoid: Checking `hasRole()` instead of `can()`
- [ ] Avoid: Not clearing cache after seeding

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Install: `composer require spatie/laravel-permission`
- Publish migration and config: `php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"`
- Add `HasRoles` trait to `App\Models\User`
- Run migration: `php artisan migrate`
- Define all permissions in seeders
- Use middleware for route protection: `Route::middleware('permission:publish-articles')`
- Use Blade `@can('permission')` for UI conditional rendering

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `HasRoles` trait added to User model
- [ ] - [ ] Permissions seeded, not created dynamically
- [ ] - [ ] `$user->can()` used instead of `hasRole()` in application code
- [ ] - [ ] Permission cache cleared on every role/permission change

# Performance Checklist
- Permissions loaded on first `can()` call per request, then cached for the request duration
- Cache driver configurable in `config/permission.php` â€” use Redis in production
- Cache invalidation on permission/role changes â€” clear immediately after seeding
- Team-scoped permissions add an additional `team_id` condition to queries

# Security Checklist
- **Cache Staleness**: Changed permissions may not take effect until cache is cleared. Always clear cache when modifying permissions.
- **Super-Admin Bypass**: Use `Gate::before()` with `hasRole('super-admin')` for full bypass, or use wildcard permission for package-level bypass.
- **Team Scoping**: In multi-tenant setups, team-scoped permissions prevent cross-tenant permission leaks.
- **Audit Permission Changes**: Log all role/permission assignments and removals.

# Reliability Checklist
- [ ] Ensure: `spatie/laravel-permission` is the standard package for database-driven roles an...

# Testing Checklist
- [ ] `HasRoles` trait added to User model
- [ ] Permissions seeded, not created dynamically
- [ ] `$user->can()` used instead of `hasRole()` in application code
- [ ] Permission cache cleared on every role/permission change
- [ ] Permissions assigned to roles, not directly to users
- [ ] Wildcard `*` restricted to super-admin
- [ ] Avoid: Mistake
- [ ] Avoid: Checking `hasRole()` instead of `can()`
- [ ] Avoid: Not clearing cache after seeding

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Spatie for Simple is_admin Flag**: Using Spatie when a boolean column would suffice
- [ ] Prevent: No Permission Seeder**: Permissions created ad-hoc in migrations or controllers
- [ ] Prevent: Checking Roles in Blade Instead of Permissions**: `@role('editor')` instead of `@can('edit-articles')`
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Checking `hasRole()` instead of `can()`
- [ ] Avoid mistake: Not clearing cache after seeding
- [ ] Avoid mistake: Creating permissions dynamically
- [ ] Avoid mistake: Direct permission assignment on users

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
- Spatie for Simple is_admin Flag**: Using Spatie when a boolean column would suffice
- No Permission Seeder**: Permissions created ad-hoc in migrations or controllers
- Checking Roles in Blade Instead of Permissions**: `@role('editor')` instead of `@can('edit-articles')`
## Skills
- Implement Spatie laravel-permission for Database-Driven Roles and Permissions


