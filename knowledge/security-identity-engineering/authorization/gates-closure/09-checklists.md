# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authorization & Access Control
**Knowledge Unit:** Gates: closure-based authorization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Gate::allows() Without Fallback**: Checking a gate but not handling the unauthorized case
- [ ] Prevent anti-pattern: Multiple Gate::before() Registrations**: Registering `before()` in multiple providers â€” only the last takes effect
- [ ] Prevent anti-pattern: Type-Hinting Non-Nullable User**: Assuming user is always authenticated, causing errors on guest access
- [ ] Gates defined for application-specific access rules
- [ ] Each gate returns boolean for unambiguous authorization
- [ ] `Gate::before()` allows super-admin to bypass all gates
- [ ] Gates tested with both authorized and unauthorized users
- [ ] Complex gates extracted to Policy classes where appropriate
- [ ] Avoid: Mistake
- [ ] Avoid: Only checking gates in Blade views
- [ ] Avoid: Returning `false` from `Gate::before()`

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Gates defined in `AppServiceProvider::boot()` or dedicated `AuthServiceProvider`
- Gate checks in controllers: `Gate::authorize('view-dashboard')` throws 403 on failure
- Blade usage: `@can('view-dashboard')` for UI conditional rendering
- Gates can receive additional context: `Gate::authorize('update-field', $field)` passes `$field` as second argument

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Gates defined for application-specific access rules
- [ ] - [ ] Each gate returns boolean for unambiguous authorization
- [ ] - [ ] `Gate::before()` allows super-admin to bypass all gates
- [ ] - [ ] Gates tested with both authorized and unauthorized users

# Performance Checklist
- Gate resolution: negligible overhead (~0.01ms per check). Closures are resolved once and cached.
- `Gate::before()` runs on every gate check â€” keep it lightweight (simple boolean check).
- No database queries unless the gate closure performs one.

# Security Checklist
- **Server-Side Enforcement**: Gates must be checked on the server. Blade directives are presentation-only and do not prevent direct URL access.
- **Super-Admin Bypass**: `Gate::before()` must return `true|null` (not `false`). Returning `false` denies the action even if the gate would allow it.
- **Type Safety**: Gate closures receive a nullable user. Unauthenticated users have `$user = null`. Check for null before accessing user properties.

# Reliability Checklist
- [ ] Ensure: Gates are Closure-based authorization checks defined in `AppServiceProvider` usi...

# Testing Checklist
- [ ] Gates defined for application-specific access rules
- [ ] Each gate returns boolean for unambiguous authorization
- [ ] `Gate::before()` allows super-admin to bypass all gates
- [ ] Gates tested with both authorized and unauthorized users
- [ ] Complex gates extracted to Policy classes where appropriate
- [ ] Avoid: Mistake
- [ ] Avoid: Only checking gates in Blade views
- [ ] Avoid: Returning `false` from `Gate::before()`

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Gate::allows() Without Fallback**: Checking a gate but not handling the unauthorized case
- [ ] Prevent: Multiple Gate::before() Registrations**: Registering `before()` in multiple providers â€” only the last takes effect
- [ ] Prevent: Type-Hinting Non-Nullable User**: Assuming user is always authenticated, causing errors on guest access
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Only checking gates in Blade views
- [ ] Avoid mistake: Returning `false` from `Gate::before()`
- [ ] Avoid mistake: Using role names as gate names
- [ ] Avoid mistake: Forgetting null user check

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
- Gate::allows() Without Fallback**: Checking a gate but not handling the unauthorized case
- Multiple Gate::before() Registrations**: Registering `before()` in multiple providers â€” only the last takes effect
- Type-Hinting Non-Nullable User**: Assuming user is always authenticated, causing errors on guest access
## Skills
- Define Authorization Gates Using Closures for Simple Access Rules


