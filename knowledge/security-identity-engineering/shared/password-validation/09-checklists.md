# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Shared Security Concerns
**Knowledge Unit:** Password validation rule objects
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Inconsistent password rules across forms**: Some endpoints have weak rules, others stricter.
- [ ] Prevent anti-pattern: Never reviewing bcrypt cost**: Same cost for years â€” increasingly vulnerable to brute force.
- [ ] Prevent anti-pattern: No `Hash::needsRehash()` on login**: Passwords stay at outdated cost after upgrade.
- [ ] Minimum 8 characters enforced
- [ ] Mixed case required (lowercase + uppercase)
- [ ] At least one number required
- [ ] At least one special character required
- [ ] Password confirmation field validated
- [ ] Avoid: Mistake
- [ ] Avoid: Not setting defaults
- [ ] Avoid: Using plain `min:8` string rule

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Centralized defaults in `AppServiceProvider` for 90% of endpoints
- Override for admin or high-security contexts: `Password::min(12)->mixedCase()->numbers()->symbols()->uncompromised()`
- Graceful failure for uncompromised(): Use callback to handle HIBP API errors

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Minimum 8 characters enforced
- [ ] - [ ] Mixed case required (lowercase + uppercase)
- [ ] - [ ] At least one number required
- [ ] - [ ] At least one special character required

# Performance Checklist
- `uncompromised()` adds 200-500ms to password validation (HTTP request to HIBP API)
- Without `uncompromised()`, password validation is entirely local
- Bcrypt hashing: default cost 10 (~100ms per hash). Cost 12 (~400ms) for admin accounts
- HIBP response cached per request â€” subsequent uncompromised() calls reuse

# Security Checklist
- **k-Anonymity**: Only the first 5 characters of the password's SHA-1 hash are sent to HIBP. The password never leaves the server.
- **Bcrypt Default Cost**: Cost 10 provides ~100ms per hash. Review annually and increase as hardware improves.
- **Rehash on Login**: When bcrypt cost is increased, existing passwords still work. Implement `Hash::needsRehash()` check on login to seamlessly rehash.
- **No Plain-Text Passwords in Logs**: Ensure password validation does not log input values.

# Reliability Checklist
- [ ] Ensure: Laravel's `Password` rule object (`Illuminate\Validation\Rules\Password`) provid...

# Testing Checklist
- [ ] Minimum 8 characters enforced
- [ ] Mixed case required (lowercase + uppercase)
- [ ] At least one number required
- [ ] At least one special character required
- [ ] Password confirmation field validated
- [ ] No max-length restriction on passwords
- [ ] Avoid: Mistake
- [ ] Avoid: Not setting defaults
- [ ] Avoid: Using plain `min:8` string rule

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Inconsistent password rules across forms**: Some endpoints have weak rules, others stricter.
- [ ] Prevent: Never reviewing bcrypt cost**: Same cost for years â€” increasingly vulnerable to brute force.
- [ ] Prevent: No `Hash::needsRehash()` on login**: Passwords stay at outdated cost after upgrade.
- [ ] Prevent: Logging password values**: Passwords exposed in logs, exception reports, or debug dumps.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not setting defaults
- [ ] Avoid mistake: Using plain `min:8` string rule
- [ ] Avoid mistake: uncompromised() without error handling
- [ ] Avoid mistake: Bcrypt cost too low

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
- Inconsistent password rules across forms**: Some endpoints have weak rules, others stricter.
- Never reviewing bcrypt cost**: Same cost for years â€” increasingly vulnerable to brute force.
- No `Hash::needsRehash()` on login**: Passwords stay at outdated cost after upgrade.
- Logging password values**: Passwords exposed in logs, exception reports, or debug dumps.
## Skills
- Implement Secure Password Validation Rules


