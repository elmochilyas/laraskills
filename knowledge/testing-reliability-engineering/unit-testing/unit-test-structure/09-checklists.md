# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Unit Testing
**Knowledge Unit:** Unit Test Structure
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly
- [ ] Apply rule: Prefer state verification over interaction verification
- [ ] Apply rule: Test one scenario per test method
- [ ] Apply rule: Cover all conditional branches (if/else, switch, match)
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Test name describes the expected behavior, not the implementation
- [ ] AAA sections are visually separated by blank lines
- [ ] Arrange creates only the minimum data needed
- [ ] Act is a single, clear action
- [ ] Assert verifies the outcome, not implementation details
- [ ] Avoid: Framework boot in unit tests
- [ ] Avoid: Testing implementation details
- [ ] Avoid: Over-mocking

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **File location**: `tests/Unit/` directory, mirroring `app/` namespace structure.
- **Class naming**: `{ClassName}Test` for PHPUnit. `{ClassName}Test.php` file for Pest with class-free syntax.
- **Dependency injection**: Constructor-inject dependencies into the class under test. Use `$this->createMock()` or `$this->createStub()` for unit tests.
- **Attribute usage**: `#[UnitTest]` on the test class (Pest). For PHPUnit, extend `PHPUnit\Framework\TestCase`.
- **Helper function usage**: Laravel helpers (`str()->slug()`, `collect()`, `retry()`) work without framework boot.
- **Facade avoidance**: Facades require the container. Use dependency injection instead in unit-tested classes.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly
- [ ] Follow rule: Prefer state verification over interaction verification
- [ ] Follow rule: Test one scenario per test method
- [ ] Follow rule: Cover all conditional branches (if/else, switch, match)
- [ ] Follow rule: Use `Carbon::setTestNow()` in `setUp()` for time-dependent tests
- [ ] Follow rule: Never call Eloquent methods that trigger SQL queries in unit tests
- [ ] - [ ] Test name describes the expected behavior, not the implementation
- [ ] - [ ] AAA sections are visually separated by blank lines
- [ ] - [ ] Arrange creates only the minimum data needed
- [ ] - [ ] Act is a single, clear action

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: Unit tests validate isolated business logic â€” services, actions, value objects...
- [ ] Verify: Always use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly
- [ ] Verify: Prefer state verification over interaction verification
- [ ] Verify: Test one scenario per test method
- [ ] Verify: Cover all conditional branches (if/else, switch, match)

# Testing Checklist
- [ ] Test name describes the expected behavior, not the implementation
- [ ] AAA sections are visually separated by blank lines
- [ ] Arrange creates only the minimum data needed
- [ ] Act is a single, clear action
- [ ] Assert verifies the outcome, not implementation details
- [ ] One logical assertion per test
- [ ] Avoid: Framework boot in unit tests
- [ ] Avoid: Testing implementation details
- [ ] Avoid: Over-mocking

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly
- [ ] Apply: Prefer state verification over interaction verification
- [ ] Apply: Test one scenario per test method
- [ ] Apply: Cover all conditional branches (if/else, switch, match)

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
- Always use `#[UnitTest]` or extend `PHPUnit\Framework\TestCase` directly
- Prefer state verification over interaction verification
- Test one scenario per test method
- Cover all conditional branches (if/else, switch, match)
- Use `Carbon::setTestNow()` in `setUp()` for time-dependent tests
- Never call Eloquent methods that trigger SQL queries in unit tests
- Name tests as behavior specifications
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Structure Unit Tests with AAA and Descriptive Naming


