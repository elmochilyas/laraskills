# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Unit Testing
**Knowledge Unit:** Test Doubles & Mocks
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Prefer Laravel fakes over Mockery mocks for framework services
- [ ] Apply rule: Stub queries, mock commands
- [ ] Apply rule: Never mock value objects, Eloquent models, or the class under test
- [ ] Apply rule: Keep mock setups visible in test methods, not hidden in `setUp()`
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Correct double type is chosen for the test scenario
- [ ] Stub return values are deterministic and cover edge cases
- [ ] Mock expectations verify meaningful interaction, not implementation details
- [ ] Mock expectations are verified (Mockery::close or PHPUnit mock verification)
- [ ] Fakes behave like the real implementation for the scenario under test
- [ ] Avoid: Mocking value objects
- [ ] Avoid: Using mocks for everything
- [ ] Avoid: Partial mocks of the class under test

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Dependency injection**: Design classes to receive dependencies via constructor injection. Testable code has explicit dependencies.
- **Interface boundaries**: Define interfaces for external services. Mock/implement the interface, not the concrete class.
- **Laravel fakes hierarchy**: `Http::fake()` > `Queue::fake()` > `Mail::fake()` > `Notification::fake()` > `Storage::fake()` > `Event::fake()` > `Bus::fake()`.
- **Mockery vs PHPUnit**: Use PHPUnit's `$this->createMock()` for simple stubs. Use Mockery's `mock()`, `spy()`, `partialMock()` for advanced expectations.
- **Container binding**: `$this->instance(Contract::class, $mock)` binds mocks into the service container for feature tests.
- **Partial mocks caution**: `$this->partialMock(Service::class)` creates a mock where unmocked methods call the real implementation. Use sparingly.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Prefer Laravel fakes over Mockery mocks for framework services
- [ ] Follow rule: Stub queries, mock commands
- [ ] Follow rule: Never mock value objects, Eloquent models, or the class under test
- [ ] Follow rule: Keep mock setups visible in test methods, not hidden in `setUp()`
- [ ] Follow rule: Don't mock what you don't own
- [ ] Follow rule: Use spies for post-hoc verification instead of pre-configured mocks
- [ ] - [ ] Correct double type is chosen for the test scenario
- [ ] - [ ] Stub return values are deterministic and cover edge cases
- [ ] - [ ] Mock expectations verify meaningful interaction, not implementation details
- [ ] - [ ] Mock expectations are verified (Mockery::close or PHPUnit mock verification)

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: Test doubles are stand-in objects that replace real dependencies during testing....
- [ ] Verify: Prefer Laravel fakes over Mockery mocks for framework services
- [ ] Verify: Stub queries, mock commands
- [ ] Verify: Never mock value objects, Eloquent models, or the class under test
- [ ] Verify: Keep mock setups visible in test methods, not hidden in `setUp()`

# Testing Checklist
- [ ] Correct double type is chosen for the test scenario
- [ ] Stub return values are deterministic and cover edge cases
- [ ] Mock expectations verify meaningful interaction, not implementation details
- [ ] Mock expectations are verified (Mockery::close or PHPUnit mock verification)
- [ ] Fakes behave like the real implementation for the scenario under test
- [ ] Tests pass without network or filesystem access
- [ ] Avoid: Mocking value objects
- [ ] Avoid: Using mocks for everything
- [ ] Avoid: Partial mocks of the class under test

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Prefer Laravel fakes over Mockery mocks for framework services
- [ ] Apply: Stub queries, mock commands
- [ ] Apply: Never mock value objects, Eloquent models, or the class under test
- [ ] Apply: Keep mock setups visible in test methods, not hidden in `setUp()`

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mocking value objects
- [ ] Avoid mistake: Using mocks for everything
- [ ] Avoid mistake: Partial mocks of the class under test
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
- Prefer Laravel fakes over Mockery mocks for framework services
- Stub queries, mock commands
- Never mock value objects, Eloquent models, or the class under test
- Keep mock setups visible in test methods, not hidden in `setUp()`
- Don't mock what you don't own
- Use spies for post-hoc verification instead of pre-configured mocks
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Use Test Doubles, Stubs, and Mocks


