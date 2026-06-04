# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Mocking & Fakes
**Knowledge Unit:** Laravel Fakes
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Prefer `::fake()` over Mockery mocks for all Laravel-native services
- [ ] Apply rule: Call `::fake()` before the code under test, not after
- [ ] Apply rule: Every `::fake()` must be paired with at least one assertion
- [ ] Apply rule: Use assertion callbacks for data verification
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Appropriate `*::fake()` method is called before the action
- [ ] Specific fakes are used when relevant (not over-faking)
- [ ] Assertions verify both dispatch and payload
- [ ] Dispatch count is verified when relevant
- [ ] Operations that should not occur are asserted with `assertNot*` methods
- [ ] Avoid: Mistake
- [ ] Avoid: Not calling `::fake()` before code that uses the service
- [ ] Avoid: Assuming fakes validate input

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Fake vs Mock**: Always prefer fakes when available. Use mocks only for services without built-in fakes.
- **Fake all vs fake selectively**: Fake all at start of integration tests. Fake selectively in unit tests.
- **Assertion granularity**: `assertSent(Class)` for existence checks. `assertSent(fn () => ...)` for detailed verification.
- **Count assertions**: `assertSentTimes('Class', 3)` for idempotency testing.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Prefer `::fake()` over Mockery mocks for all Laravel-native services
- [ ] Follow rule: Call `::fake()` before the code under test, not after
- [ ] Follow rule: Every `::fake()` must be paired with at least one assertion
- [ ] Follow rule: Use assertion callbacks for data verification
- [ ] Follow rule: Fake all external services in feature tests
- [ ] Follow rule: Fake selectively in unit tests, comprehensively in integration tests
- [ ] - [ ] Appropriate `*::fake()` method is called before the action
- [ ] - [ ] Specific fakes are used when relevant (not over-faking)
- [ ] - [ ] Assertions verify both dispatch and payload
- [ ] - [ ] Dispatch count is verified when relevant

# Performance Checklist
- Fake registration: <1ms per fake (container binding replacement).
- Fake operation: In-memory operations. <0.1ms per recorded call.
- Assertion execution: <1ms per assertion (array search).
- Storage fakes with large files: In-memory storage may increase memory. Clear between tests.

# Security Checklist
- Fakes prevent accidental external interactions in tests. Critical for CI where network access may be limited or have costs.
- Ensure fake data doesn't contain real credentials or secrets.
- `Exceptions::fake()` prevents real error reporting, which is important for not polluting error monitoring with test errors.

# Reliability Checklist
- [ ] Ensure: Laravel built-in fakes (Bus, Event, Http, Mail, Notification, Queue, Storage) pr...
- [ ] Verify: Prefer `::fake()` over Mockery mocks for all Laravel-native services
- [ ] Verify: Call `::fake()` before the code under test, not after
- [ ] Verify: Every `::fake()` must be paired with at least one assertion
- [ ] Verify: Use assertion callbacks for data verification

# Testing Checklist
- [ ] Appropriate `*::fake()` method is called before the action
- [ ] Specific fakes are used when relevant (not over-faking)
- [ ] Assertions verify both dispatch and payload
- [ ] Dispatch count is verified when relevant
- [ ] Operations that should not occur are asserted with `assertNot*` methods
- [ ] Storage assertions verify both creation and content of files
- [ ] Avoid: Mistake
- [ ] Avoid: Not calling `::fake()` before code that uses the service
- [ ] Avoid: Assuming fakes validate input

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Prefer `::fake()` over Mockery mocks for all Laravel-native services
- [ ] Apply: Call `::fake()` before the code under test, not after
- [ ] Apply: Every `::fake()` must be paired with at least one assertion
- [ ] Apply: Use assertion callbacks for data verification

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not calling `::fake()` before code that uses the service
- [ ] Avoid mistake: Assuming fakes validate input
- [ ] Avoid mistake: Mocking instead of using fakes
- [ ] Avoid mistake: Not asserting on fake after the action

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
- Prefer `::fake()` over Mockery mocks for all Laravel-native services
- Call `::fake()` before the code under test, not after
- Every `::fake()` must be paired with at least one assertion
- Use assertion callbacks for data verification
- Fake all external services in feature tests
- Fake selectively in unit tests, comprehensively in integration tests
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Use Laravel's Built-in Fakes for Testing


