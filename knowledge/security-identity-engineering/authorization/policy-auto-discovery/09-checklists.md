# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Authorization & Access Control
**Knowledge Unit:** Policy auto-discovery by naming convention
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Duplicate Registration**: Registering policies manually AND having auto-discovery active simultaneously
- [ ] Prevent anti-pattern: Inconsistent Naming**: Mixing standard `PostPolicy` with non-standard `PostAccessPolicy` without manual registration
- [ ] Prevent anti-pattern: Artisan Policy Without --model Flag**: Creating policies with `make:policy` without `--model`, missing pre-populated methods
- [ ] Avoid: Mistake
- [ ] Avoid: Policy not discovered
- [ ] Avoid: Creating policy with artisan without --model

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Auto-discovery matches class name prefixes: `PostPolicy` â†’ `App\Models\Post`
- Directory: `app/Policies/` (configurable in `config/auth.php` policies path)
- Manual registration in `AuthServiceProvider::$policies` overrides auto-discovery
- Policies can be in subdirectories: `app/Policies/Admin/PostPolicy` â€” may need manual registration

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Use constructor injection
- [ ] Follow naming conventions
- [ ] Handle errors with typed exceptions

# Performance Checklist
- Directory scan happens once per request (or on cache clear). Cached after first use.
- No database queries â€” purely class name matching.
- Zero overhead for non-policy models (scan only matches if policy class exists).

# Security Checklist
- No direct security impact â€” auto-discovery is a code organization feature
- Ensure policies directory does not contain non-policy classes with `Policy` suffix (will cause errors)
- Permissions on policy files should follow standard Laravel application code access controls

# Reliability Checklist
- [ ] Ensure: Laravel automatically discovers policies by convention: a `PostPolicy` class in ...

# Testing Checklist
- [ ] Avoid: Mistake
- [ ] Avoid: Policy not discovered
- [ ] Avoid: Creating policy with artisan without --model

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Duplicate Registration**: Registering policies manually AND having auto-discovery active simultaneously
- [ ] Prevent: Inconsistent Naming**: Mixing standard `PostPolicy` with non-standard `PostAccessPolicy` without manual registration
- [ ] Prevent: Artisan Policy Without --model Flag**: Creating policies with `make:policy` without `--model`, missing pre-populated methods
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Policy not discovered
- [ ] Avoid mistake: Creating policy with artisan without --model
- [ ] Avoid mistake: Manual registration AND auto-discovery
- [ ] Avoid mistake: Model in non-standard directory

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
- Duplicate Registration**: Registering policies manually AND having auto-discovery active simultaneously
- Inconsistent Naming**: Mixing standard `PostPolicy` with non-standard `PostAccessPolicy` without manual registration
- Artisan Policy Without --model Flag**: Creating policies with `make:policy` without `--model`, missing pre-populated methods
## Skills
- Configure Policy Auto-Discovery for Convention-Based Authorization


