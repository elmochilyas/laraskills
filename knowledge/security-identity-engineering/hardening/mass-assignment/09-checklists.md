# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** Mass assignment $fillable/$guarded
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Model::unguard() in Application Code**: Disables mass assignment protection globally
- [ ] Prevent anti-pattern: Relying on Frontend for Mass Assignment Protection**: Disabled inputs or client-side validation
- [ ] Prevent anti-pattern: No Form Requests**: Inline validation in controllers, no consistent input filtering
- [ ] All models have `$fillable` or `$guarded` defined
- [ ] Sensitive attributes (is_admin, role_id) not in `$fillable`
- [ ] `$request->validated()` used with Form Requests
- [ ] No `create($request->all())` patterns in codebase
- [ ] Enlightn mass assignment check passes
- [ ] Avoid: Mistake
- [ ] Avoid: Using `$request->all()`
- [ ] Avoid: `$guarded = []` (empty)

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Define `$fillable` on every model â€” empty array or explicit list
- Form Requests return validated data â€” pass directly to `create()` or `update()`
- For admin-only fields (roles, permissions, is_admin), ensure they are NOT in `$fillable`
- Use `forceCreate()` sparingly and only in internal code paths with explicit attribute setting

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] All models have `$fillable` or `$guarded` defined
- [ ] - [ ] Sensitive attributes (is_admin, role_id) not in `$fillable`
- [ ] - [ ] `$request->validated()` used with Form Requests
- [ ] - [ ] No `create($request->all())` patterns in codebase

# Performance Checklist
- Mass assignment protection is a runtime check â€” negligible overhead (~0.001ms)
- No database impact â€” purely application-level validation

# Security Checklist
- **`$request->all()` is Dangerous**: Includes all request fields, including any the user added maliciously. Always use validated data.
- **is_admin Attack**: If `is_admin` is not in `$fillable` but the request includes it, the field is silently ignored. If using `$request->all()`, the field may be set if `$guarded` doesn't include it.
- **Nested Attributes**: Mass assignment protection works one level deep. Nested relationships may need additional protection.
- **`forceCreate()`**: Completely bypasses protection. Audit all uses.

# Reliability Checklist
- [ ] Ensure: Mass assignment protection prevents users from setting arbitrary model attribute...

# Testing Checklist
- [ ] All models have `$fillable` or `$guarded` defined
- [ ] Sensitive attributes (is_admin, role_id) not in `$fillable`
- [ ] `$request->validated()` used with Form Requests
- [ ] No `create($request->all())` patterns in codebase
- [ ] Enlightn mass assignment check passes
- [ ] Avoid: Mistake
- [ ] Avoid: Using `$request->all()`
- [ ] Avoid: `$guarded = []` (empty)

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Model::unguard() in Application Code**: Disables mass assignment protection globally
- [ ] Prevent: Relying on Frontend for Mass Assignment Protection**: Disabled inputs or client-side validation
- [ ] Prevent: No Form Requests**: Inline validation in controllers, no consistent input filtering
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using `$request->all()`
- [ ] Avoid mistake: `$guarded = []` (empty)
- [ ] Avoid mistake: `Model::unguard()` in production
- [ ] Avoid mistake: Assuming validated data is safe

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
- Model::unguard() in Application Code**: Disables mass assignment protection globally
- Relying on Frontend for Mass Assignment Protection**: Disabled inputs or client-side validation
- No Form Requests**: Inline validation in controllers, no consistent input filtering
## Skills
- Protect Against Mass Assignment Vulnerabilities


