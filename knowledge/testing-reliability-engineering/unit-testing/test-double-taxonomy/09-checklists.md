# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Unit Testing
**Knowledge Unit:** Test Double Taxonomy
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Follow the preference hierarchy: Fakes > Spies > Mocks > Stubs > Dummies
- [ ] Apply rule: Use stubs for query methods, mocks/spies for command methods
- [ ] Apply rule: Prefer state verification over interaction verification
- [ ] Apply rule: Don't mock what you don't own
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Dummy is used when the dependency's behavior is irrelevant
- [ ] Stub is used when providing controlled return values is sufficient
- [ ] Spy is used when recording interaction for later assertion
- [ ] Mock is used when verifying call expectations before the action
- [ ] Fake is used when an in-memory implementation reduces test complexity
- [ ] Avoid: Mocking value objects
- [ ] Avoid: Using mocks for everything
- [ ] Avoid: Partial mocks of the class under test

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Double selection hierarchy**: Fakes (most preferred) â†’ Spies â†’ Mocks â†’ Stubs â†’ Dummies (least preferred).
- **Container binding**: Use `$this->instance(Contract::class, $mock)` to bind mocks into the service container.
- **Fake maintenance**: When real service interfaces change, fakes must be updated. Treat fakes as production code.
- **Mock visibility**: Test doubles should be as visible in code review as production code. Over-mocking is a code smell.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Follow the preference hierarchy: Fakes > Spies > Mocks > Stubs > Dummies
- [ ] Follow rule: Use stubs for query methods, mocks/spies for command methods
- [ ] Follow rule: Prefer state verification over interaction verification
- [ ] Follow rule: Don't mock what you don't own
- [ ] Follow rule: Keep mock setup minimal (mock lines < assertion lines)
- [ ] - [ ] Dummy is used when the dependency's behavior is irrelevant
- [ ] - [ ] Stub is used when providing controlled return values is sufficient
- [ ] - [ ] Spy is used when recording interaction for later assertion
- [ ] - [ ] Mock is used when verifying call expectations before the action

# Performance Checklist
- **Fake overhead**: Laravel fakes are lightweight. `HttpFake` stores requests in memory. Negligible overhead (<0.1ms per operation).
- **Mock generation**: PHPUnit mock generation uses reflection. First call per class is slower (~5ms), subsequent calls are cached.
- **Mockery comparison**: Mockery mocks are slightly faster than PHPUnit's native mocks. Difference is negligible for suites <10,000 mocks.
- **Memory**: Each mock stores method configuration and invocation history. 1,000 mocks use ~10MB memory.

# Security Checklist
- **Fake data exposure**: Fakes may store sensitive data in memory. Clear fakes between tests.
- **Mock expectations**: Incorrect mock expectations may mask security vulnerabilities in authorization or validation logic.
- **Partial mock risks**: Unmocked methods on partial mocks call real implementations with potential side effects. Use with caution.

# Reliability Checklist
- [ ] Ensure: Test doubles are stand-in objects that replace real dependencies during testing....
- [ ] Verify: Follow the preference hierarchy: Fakes > Spies > Mocks > Stubs > Dummies
- [ ] Verify: Use stubs for query methods, mocks/spies for command methods
- [ ] Verify: Prefer state verification over interaction verification
- [ ] Verify: Don't mock what you don't own

# Testing Checklist
- [ ] Dummy is used when the dependency's behavior is irrelevant
- [ ] Stub is used when providing controlled return values is sufficient
- [ ] Spy is used when recording interaction for later assertion
- [ ] Mock is used when verifying call expectations before the action
- [ ] Fake is used when an in-memory implementation reduces test complexity
- [ ] Double type choice is justified by the test's verification goal
- [ ] Avoid: Mocking value objects
- [ ] Avoid: Using mocks for everything
- [ ] Avoid: Partial mocks of the class under test

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Follow the preference hierarchy: Fakes > Spies > Mocks > Stubs > Dummies
- [ ] Apply: Use stubs for query methods, mocks/spies for command methods
- [ ] Apply: Prefer state verification over interaction verification
- [ ] Apply: Don't mock what you don't own

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mocking value objects
- [ ] Avoid mistake: Using mocks for everything
- [ ] Avoid mistake: Partial mocks of the class under test

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
- Follow the preference hierarchy: Fakes > Spies > Mocks > Stubs > Dummies
- Use stubs for query methods, mocks/spies for command methods
- Prefer state verification over interaction verification
- Don't mock what you don't own
- Keep mock setup minimal (mock lines < assertion lines)
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Select the Correct Test Double Type


