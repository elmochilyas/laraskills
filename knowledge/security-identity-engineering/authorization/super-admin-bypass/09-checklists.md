# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authorization & Access Control
**Knowledge Unit:** Super-admin bypass via Gate::before()
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Email-Based Super-Admin Identification**: Using `$user->email === config(...)` which breaks on email change
- [ ] Prevent anti-pattern: Bypassing Gate::before() Entirely**: No super-admin bypass at all, requiring explicit permission for every action
- [ ] Prevent anti-pattern: Super-Admin Assignment Without Approval**: Any admin can self-grant super-admin status
- [ ] `Gate::before()` returns `true` for super-admin users
- [ ] Spatie wildcard `*` assigned only to super-admin role
- [ ] Super-admin can access all resources and actions
- [ ] Regular users correctly denied for unauthorized actions
- [ ] All super-admin actions logged in audit trail
- [ ] Avoid: Mistake
- [ ] Avoid: Returning `false` from `before()`
- [ ] Avoid: Complex logic in `before()`

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Register in `AppServiceProvider::boot()` or `AuthServiceProvider::boot()`
- Check against a user model method: `$user->isSuperAdmin()`
- The `isSuperAdmin()` method should be simple: role check, column check, or permission check
- For Spatie: `$user->hasRole('super-admin')`
- For simple setups: `$user->is_super_admin` column

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] `Gate::before()` returns `true` for super-admin users
- [ ] - [ ] Spatie wildcard `*` assigned only to super-admin role
- [ ] - [ ] Super-admin can access all resources and actions
- [ ] - [ ] Regular users correctly denied for unauthorized actions

# Performance Checklist
- `before()` runs on every authorization check â€” keep the closure lightweight
- A database query in `before()` would execute on every authorization check â€” avoid
- Cache the super-admin status: use eager loading, cached roles, or a column

# Security Checklist
- **Single Point of Escalation**: `Gate::before()` grants all permissions. Carefully control which users get super-admin status.
- **Audit Logging**: Log when a super-admin acts on resources they would not normally access.
- **Scoped Super-Admin**: For multi-tenant apps, consider tenant-scoped super-admin that bypasses checks only within their tenant.
- **No Guest Bypass**: Unauthenticated users never trigger `Gate::before()` â€” guests cannot bypass authorization.

# Reliability Checklist
- [ ] Ensure: The super-admin bypass pattern uses `Gate::before()` to allow certain users (sup...

# Testing Checklist
- [ ] `Gate::before()` returns `true` for super-admin users
- [ ] Spatie wildcard `*` assigned only to super-admin role
- [ ] Super-admin can access all resources and actions
- [ ] Regular users correctly denied for unauthorized actions
- [ ] All super-admin actions logged in audit trail
- [ ] Destructive actions require additional confirmation
- [ ] Avoid: Mistake
- [ ] Avoid: Returning `false` from `before()`
- [ ] Avoid: Complex logic in `before()`

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Email-Based Super-Admin Identification**: Using `$user->email === config(...)` which breaks on email change
- [ ] Prevent: Bypassing Gate::before() Entirely**: No super-admin bypass at all, requiring explicit permission for every action
- [ ] Prevent: Super-Admin Assignment Without Approval**: Any admin can self-grant super-admin status
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Returning `false` from `before()`
- [ ] Avoid mistake: Complex logic in `before()`
- [ ] Avoid mistake: No super-admin audit trail
- [ ] Avoid mistake: Using `before()` for non-super-admin logic

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
- Email-Based Super-Admin Identification**: Using `$user->email === config(...)` which breaks on email change
- Bypassing Gate::before() Entirely**: No super-admin bypass at all, requiring explicit permission for every action
- Super-Admin Assignment Without Approval**: Any admin can self-grant super-admin status
## Skills
- Implement Super-Admin Bypass for Unrestricted Access


