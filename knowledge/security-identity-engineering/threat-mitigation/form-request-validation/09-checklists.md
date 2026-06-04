# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Threat Mitigation
**Knowledge Unit:** Form Request validation rules and best practices
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No Form Requests at All**: All validation in controllers
- [ ] Prevent anti-pattern: authorize() Always Returns true**: No authorization checks
- [ ] Prevent anti-pattern: Validation Logic Duplicated**: Same rules repeated across multiple form requests
- [ ] Form Requests used for all significant data input
- [ ] `authorize()` checks permission before validation runs
- [ ] `$request->validated()` used in controllers (not `$request->all()`)
- [ ] Validation rules match database constraints (length, format)
- [ ] Custom error messages provided where default messages are unclear
- [ ] Avoid: Mistake
- [ ] Avoid: Using `$request->all()` instead of `$request->validated()`
- [ ] Avoid: Forgetting `authorize()` method

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- One Form Request per controller action (or per logical validation group)
- Form Request classes in `app/Http/Requests/`
- Validation rules should be readable and declarative â€” avoid closures in rules() method
- Custom rules in `app/Rules/` â€” implement `Illuminate\Contracts\Validation\Rule`
- Inject dependencies via Form Request's `__construct()` â€” resolves from container

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Form Requests used for all significant data input
- [ ] - [ ] `authorize()` checks permission before validation runs
- [ ] - [ ] `$request->validated()` used in controllers (not `$request->all()`)
- [ ] - [ ] Validation rules match database constraints (length, format)

# Performance Checklist
- Form Request instantiation: lightweight class resolution â€” negligible
- Validation execution: O(n) where n is the number of fields Ã— rules â€” usually <1ms
- Database validation rules (`unique`, `exists`): adds DB query per rule
- Custom rule objects: performance depends on internal logic

# Security Checklist
- **First Line of Defense**: Form Requests validate input before the controller receives it. Combined with mass assignment protection, this provides defense in depth.
- **`authorize()` Default**: Default `false` â€” if `authorize()` is not implemented, all requests are denied. Always add `return true` or proper authorization.
- **SQL Injection**: Validation rules prevent malformed input but do not replace parameterized queries.
- **File Upload Validation**: Use `file`, `mimes`, `max` rules for upload security. Validate before the file reaches the controller.

# Reliability Checklist
- [ ] Ensure: Form Requests are dedicated validation classes that encapsulate validation logic...

# Testing Checklist
- [ ] Form Requests used for all significant data input
- [ ] `authorize()` checks permission before validation runs
- [ ] `$request->validated()` used in controllers (not `$request->all()`)
- [ ] Validation rules match database constraints (length, format)
- [ ] Custom error messages provided where default messages are unclear
- [ ] Avoid: Mistake
- [ ] Avoid: Using `$request->all()` instead of `$request->validated()`
- [ ] Avoid: Forgetting `authorize()` method

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No Form Requests at All**: All validation in controllers
- [ ] Prevent: authorize() Always Returns true**: No authorization checks
- [ ] Prevent: Validation Logic Duplicated**: Same rules repeated across multiple form requests
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using `$request->all()` instead of `$request->validated()`
- [ ] Avoid mistake: Forgetting `authorize()` method
- [ ] Avoid mistake: Complex closures in rules()
- [ ] Avoid mistake: Not using bail modifier

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
- No Form Requests at All**: All validation in controllers
- authorize() Always Returns true**: No authorization checks
- Validation Logic Duplicated**: Same rules repeated across multiple form requests
## Skills
- Centralize Input Validation with Form Requests


