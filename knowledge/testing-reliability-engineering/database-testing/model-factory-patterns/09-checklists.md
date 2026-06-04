# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Database Testing
**Knowledge Unit:** Model Factory Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use fixed strings, not faker, in factory `definition()` defaults
- [ ] Apply rule: Create only the minimum data needed for the test
- [ ] Apply rule: Extract named states for scenarios used in 2+ tests
- [ ] Apply rule: Define required belongs-to relationships in the factory definition
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Factory defaults use fixed strings, not faker
- [ ] Named states exist for scenarios used in 2+ tests
- [ ] Required belongs-to relationships defined in factory definitions
- [ ] Tests create only minimum data needed
- [ ] `afterCreating()` callbacks are lightweight
- [ ] Avoid: Mistake
- [ ] Avoid: Random data in factory defaults
- [ ] Avoid: Creating more data than needed

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Factory location**: `database/factories/` following model name convention (`UserFactory` â†’ `User`).
- **States vs explicit overrides**: States for named scenarios used in 2+ tests. Explicit `->state(['key' => 'value'])` for one-off overrides.
- **Single factory per model**: One factory class per Eloquent model. For complex models, organize states using traits.
- **create() vs make()**: `create()` when the record must be persisted. `make()` when the test doesn't need database persistence.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use fixed strings, not faker, in factory `definition()` defaults
- [ ] Follow rule: Create only the minimum data needed for the test
- [ ] Follow rule: Extract named states for scenarios used in 2+ tests
- [ ] Follow rule: Define required belongs-to relationships in the factory definition
- [ ] Follow rule: Use `make()` instead of `create()` when database persistence is not needed
- [ ] Follow rule: Keep `afterCreating()` callbacks lightweight
- [ ] - [ ] Factory defaults use fixed strings, not faker
- [ ] - [ ] Named states exist for scenarios used in 2+ tests
- [ ] - [ ] Required belongs-to relationships defined in factory definitions
- [ ] - [ ] Tests create only minimum data needed

# Performance Checklist
- `make()`: <1ms per model (no persistence).
- `create()`: 2-10ms per model (insert + callbacks).
- `count(N)->create()`: Individual inserts. For N > 100, consider chunked inserts.
- Relationship creation: `hasPosts(3)` adds ~6-30ms. Nested relationships multiply.
- `afterCreating` callbacks: Add linear time per created model. Avoid heavy callbacks in loops.

# Security Checklist
- Factory data should never contain real user credentials or secrets
- Factories that create users with password fields should use `Hash::make('password')` or `bcrypt('password')` for consistency
- Factory-created data should be clearly identifiable as test data

# Reliability Checklist
- [ ] Ensure: Model factories create Eloquent model instances with consistent defaults, enabli...
- [ ] Verify: Use fixed strings, not faker, in factory `definition()` defaults
- [ ] Verify: Create only the minimum data needed for the test
- [ ] Verify: Extract named states for scenarios used in 2+ tests
- [ ] Verify: Define required belongs-to relationships in the factory definition

# Testing Checklist
- [ ] Factory defaults use fixed strings, not faker
- [ ] Named states exist for scenarios used in 2+ tests
- [ ] Required belongs-to relationships defined in factory definitions
- [ ] Tests create only minimum data needed
- [ ] `afterCreating()` callbacks are lightweight
- [ ] `make()` used when database persistence isn't required
- [ ] Avoid: Mistake
- [ ] Avoid: Random data in factory defaults
- [ ] Avoid: Creating more data than needed

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use fixed strings, not faker, in factory `definition()` defaults
- [ ] Apply: Create only the minimum data needed for the test
- [ ] Apply: Extract named states for scenarios used in 2+ tests
- [ ] Apply: Define required belongs-to relationships in the factory definition

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Random data in factory defaults
- [ ] Avoid mistake: Creating more data than needed
- [ ] Avoid mistake: Missing factories for related models
- [ ] Avoid mistake: Overriding definitions instead of using states

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
## Rules
- Use fixed strings, not faker, in factory `definition()` defaults
- Create only the minimum data needed for the test
- Extract named states for scenarios used in 2+ tests
- Define required belongs-to relationships in the factory definition
- Use `make()` instead of `create()` when database persistence is not needed
- Keep `afterCreating()` callbacks lightweight
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Design and Use Model Factories


