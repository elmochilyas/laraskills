# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Unit Testing
**Knowledge Unit:** Unit Testing Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly
- [ ] Apply rule: Test behavior, not implementation details
- [ ] Apply rule: Use real instances for value objects and collections
- [ ] Apply rule: Mock at class boundaries only
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] 70/20/10 distribution is maintained across the test suite
- [ ] Unit tests exist for service classes, actions, and value objects
- [ ] Each unit test verifies one behavior
- [ ] Tests are organized by feature, not by implementation type
- [ ] First-Right (TDD) is used for new business logic
- [ ] Avoid: Framework boot in unit tests
- [ ] Avoid: Testing implementation details
- [ ] Avoid: Over-mocking

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **File organization**: Mirror source structure in `tests/Unit/`. `tests/Unit/Services/TaxCalculatorTest.php` tests `app/Services/TaxCalculator.php`.
- **Framework-agnostic design**: Design business logic classes to accept dependencies via constructor injection. Avoid facades in unit-tested code.
- **Static state management**: Reset static properties in `setUp()` to prevent state leakage between tests.
- **DateTime determinism**: Use `Carbon::setTestNow()` in `setUp()` to freeze time for any time-dependent logic.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly
- [ ] Follow rule: Test behavior, not implementation details
- [ ] Follow rule: Use real instances for value objects and collections
- [ ] Follow rule: Mock at class boundaries only
- [ ] Follow rule: Target >90% line coverage on business logic
- [ ] Follow rule: Freeze time in `setUp()` for date-dependent logic
- [ ] - [ ] 70/20/10 distribution is maintained across the test suite
- [ ] - [ ] Unit tests exist for service classes, actions, and value objects
- [ ] - [ ] Each unit test verifies one behavior
- [ ] - [ ] Tests are organized by feature, not by implementation type

# Performance Checklist
- **Execution speed**: Unit tests with `#[UnitTest]` execute in <1ms. Comparable tests with boot take ~30-50ms.
- **Memory**: No framework boot = minimal memory (~2MB per test process vs ~30MB with framework).
- **Paratest efficiency**: Unit tests benefit most from parallel execution because they're CPU-bound with no I/O contention.
- **OpCache impact**: Unit tests benefit from OpCache because the same classes are loaded repeatedly.

# Security Checklist
- **Test isolation**: Ensure unit tests cannot leak data between test cases. Reset any static or singleton state in `setUp()`.
- **Sensitive logic**: Unit tests for security-critical code (policies, permissions) should cover both authorized and unauthorized scenarios.

# Reliability Checklist
- [ ] Ensure: Unit tests validate isolated business logicâ€”services, actions, value objects, ...
- [ ] Verify: Use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly
- [ ] Verify: Test behavior, not implementation details
- [ ] Verify: Use real instances for value objects and collections
- [ ] Verify: Mock at class boundaries only

# Testing Checklist
- [ ] 70/20/10 distribution is maintained across the test suite
- [ ] Unit tests exist for service classes, actions, and value objects
- [ ] Each unit test verifies one behavior
- [ ] Tests are organized by feature, not by implementation type
- [ ] First-Right (TDD) is used for new business logic
- [ ] Given-When-Then structure is used consistently if adopted by the team
- [ ] Avoid: Framework boot in unit tests
- [ ] Avoid: Testing implementation details
- [ ] Avoid: Over-mocking

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly
- [ ] Apply: Test behavior, not implementation details
- [ ] Apply: Use real instances for value objects and collections
- [ ] Apply: Mock at class boundaries only

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Framework boot in unit tests
- [ ] Avoid mistake: Testing implementation details
- [ ] Avoid mistake: Over-mocking
- [ ] Avoid mistake: Database calls in unit tests

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
- Use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly
- Test behavior, not implementation details
- Use real instances for value objects and collections
- Mock at class boundaries only
- Target >90% line coverage on business logic
- Freeze time in `setUp()` for date-dependent logic
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Apply Unit Testing Patterns for Laravel Classes


