# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Service layer testing strategies
Knowledge Unit ID: SLP-17
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Service layer testing strategies depend on which pattern is used. Services (multi-method) require integration tests with mocked dependencies. Actions (single-method) are easily unit-testable with constructor-injected mocks. Use Cases (Clean Architecture) are unit-testable without Laravel bootstrap. Rule: test the service/action/use case as the unit, mock its external dependencies, verify the orchestration logic.

---

# Core Concepts

- **Testing Services**: Mock repositories/other services. Test each method's orchestration logic. Verify correct methods called with correct arguments.
- **Testing Actions**: Mock repositories. Test single `execute()`/`handle()` method. Verify complete operation.
- **Testing Use Cases**: Mock port interfaces. Test with input DTOs. Verify output DTOs and side effects.

---

# When To Use

- Always. Service layer is where orchestration bugs live — test it thoroughly.

---

# When NOT To Use

- Prototype-stage (but add tests before production).

---

# Best Practices

- **Mock the boundaries, not the internals.** WHY: Mock repositories, mailers, and external APIs — the boundaries of the service. Don't mock value objects or request data.
- **Test outcomes, not call sequences.** WHY: Testing that specific methods were called in specific order couples tests to implementation. Test the result and side effects.
- **Use in-memory implementations for contract tests.** WHY: In-memory repositories are faster and more reliable than mocks for testing complex query logic. Mocks still useful for verifying side effects.
- **Add integration tests for repositories.** WHY: Mocked repositories can pass while real database interactions fail. Test each repository method against a real database.

---

# Architecture Guidelines

- Unit test services with mocked dependencies: the majority of tests (fast, focused).
- Integration test repositories/adapters: few tests per repository (verify real DB interaction).
- Feature test critical controllers: small number (full stack for critical journeys).

---

# Performance Considerations

- Unit tests with mocks: milliseconds.
- Feature tests with database: hundreds of milliseconds.
- Prioritize unit tests for coverage, feature tests for critical paths.

---

# Security Considerations

- No direct implications. Test authorization separately.

---

# Common Mistakes

1. **Testing implementation details:** Verifying specific method calls in specific order. Cause: testing implementation. Consequence: brittle tests break on refactoring. Better: test outcomes.

2. **Over-mocking:** Mocking every dependency including value objects. Cause: excessive isolation. Consequence: tests don't verify real behavior. Better: mock only external boundaries.

3. **No integration tests for repositories:** Relying only on mocked repositories. Cause: speed. Consequence: mock may pass while real DB fails. Better: integration test each repository method.

---

# Anti-Patterns

- **Mock/reality mismatch**: Mock returns a value the real implementation never would. Tests pass, production fails.
- **Brittle tests from tight coupling**: Every constructor change breaks all tests. Signal of too many dependencies.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-01 Service classes | SLP-02 Action classes | MMD-16 Testing strategies |
| SLP-09 Dependency injection | LAP-13 Architecture tests | AEG-01 Architecture testing |

---

# AI Agent Notes

- Generate test files with mocked boundaries for every service/action.
- Use in-memory implementations for contract tests.
- Include integration tests for repository methods.

---

# Verification

- [ ] Services tested with mocked dependencies
- [ ] Tests verify outcomes, not call sequences
- [ ] In-memory implementations exist for contract tests
- [ ] Repository methods have integration tests
- [ ] Tests are fast (unit) with few slow (feature) tests
