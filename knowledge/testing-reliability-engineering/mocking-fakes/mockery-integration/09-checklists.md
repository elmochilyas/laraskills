# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Mocking & Fakes
**Knowledge Unit:** Mockery Integration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use Mockery only for custom interfaces, not Laravel-native services
- [ ] Apply rule: Always specify explicit call count expectations
- [ ] Apply rule: Use spies for post-hoc verification, mocks for pre-configured behavior
- [ ] Apply rule: Never mock Eloquent models
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `Mockery::close()` is called after the test to verify expectations
- [ ] Mock expectations use `with()` to verify arguments
- [ ] Call counts are specified (`once()`, `twice()`, `times(3)`, `zeroOrMoreTimes()`)
- [ ] Partial mocks are used correctly (only mock the specific method, not the whole class)
- [ ] Argument matchers are used for complex validation
- [ ] Avoid: Mistake
- [ ] Avoid: Over-mocking (mocking everything)
- [ ] Avoid: Using partial mocks for internal method testing

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Mock vs Fake**: Fakes for Laravel services. Mocks for custom interfaces. Spies for post-hoc verification.
- **Mock vs Spy**: Mocks when call count matters. Spies when call existence matters.
- **Partial mock vs dependency extraction**: Prefer extracting a dependency over partial mocking.
- **`mock()` vs `instance()` + `Mockery::mock()`**: Use `$this->mock()` for container-managed classes. Use `Mockery::mock()` directly for classes not resolved from the container.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use Mockery only for custom interfaces, not Laravel-native services
- [ ] Follow rule: Always specify explicit call count expectations
- [ ] Follow rule: Use spies for post-hoc verification, mocks for pre-configured behavior
- [ ] Follow rule: Never mock Eloquent models
- [ ] Follow rule: Prefer dependency extraction over partial mocking
- [ ] Follow rule: Keep mock setup visible in test methods
- [ ] - [ ] `Mockery::close()` is called after the test to verify expectations
- [ ] - [ ] Mock expectations use `with()` to verify arguments
- [ ] - [ ] Call counts are specified (`once()`, `twice()`, `times(3)`, `zeroOrMoreTimes()`)
- [ ] - [ ] Partial mocks are used correctly (only mock the specific method, not the whole class)

# Performance Checklist
- Mock creation: 1-5ms per mock (class generation + reflection).
- Expectation setup: <0.1ms per expectation.
- Mock reset (`Mockery::close()`): <0.5ms per mock.
- Spy call recording: <0.01ms per recorded call.

# Security Checklist
- Mocks of security-related interfaces (auth providers, token generators) must accurately simulate security behavior. A mock that always returns "authenticated" may hide auth bugs.

# Reliability Checklist
- [ ] Ensure: Mockery is the de facto mocking framework in the Laravel ecosystem, providing `m...
- [ ] Verify: Use Mockery only for custom interfaces, not Laravel-native services
- [ ] Verify: Always specify explicit call count expectations
- [ ] Verify: Use spies for post-hoc verification, mocks for pre-configured behavior
- [ ] Verify: Never mock Eloquent models

# Testing Checklist
- [ ] `Mockery::close()` is called after the test to verify expectations
- [ ] Mock expectations use `with()` to verify arguments
- [ ] Call counts are specified (`once()`, `twice()`, `times(3)`, `zeroOrMoreTimes()`)
- [ ] Partial mocks are used correctly (only mock the specific method, not the whole class)
- [ ] Argument matchers are used for complex validation
- [ ] Spies are used when post-action assertion is more natural
- [ ] Avoid: Mistake
- [ ] Avoid: Over-mocking (mocking everything)
- [ ] Avoid: Using partial mocks for internal method testing

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use Mockery only for custom interfaces, not Laravel-native services
- [ ] Apply: Always specify explicit call count expectations
- [ ] Apply: Use spies for post-hoc verification, mocks for pre-configured behavior
- [ ] Apply: Never mock Eloquent models

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Over-mocking (mocking everything)
- [ ] Avoid mistake: Using partial mocks for internal method testing
- [ ] Avoid mistake: Not setting expected call count
- [ ] Avoid mistake: Mocking Eloquent models

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
- Use Mockery only for custom interfaces, not Laravel-native services
- Always specify explicit call count expectations
- Use spies for post-hoc verification, mocks for pre-configured behavior
- Never mock Eloquent models
- Prefer dependency extraction over partial mocking
- Keep mock setup visible in test methods
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Integrate Mockery into Laravel Tests


