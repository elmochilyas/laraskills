# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Service layer testing strategies
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Mock/reality mismatch prevented
- [ ] Brittle tests from tight coupling prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Mock the boundaries, not the internals.** Mock repositories, mailers, and external APIs Ã¢â‚¬â€ the boundaries of the service. Do not mock value objects, request data, or domain models.
- [ ] Workflow step completed: **Test outcomes, not call sequences.** Assert on return values and observable state, not the specific order of method calls on mocks. Testing call sequences couples tests to implementation details.
- [ ] Workflow step completed: **Use in-memory implementations for contract tests.** In-memory repositories are faster than mocks for testing complex query logic and more reliable than mocked expectations. Create `InMemoryInvoiceRepository` that implements the interface.
- [ ] Workflow step completed: **Add integration tests for repositories.** Test every repository method against a real database using `RefreshDatabase`. Mocked repositories can produce incorrect results that pass tests.
- [ ] Workflow step completed: **Prioritize unit tests for coverage, feature tests for critical paths.** Unit tests (milliseconds) should be the majority. Feature tests (hundreds of milliseconds) reserved for critical business journeys.

---

# Performance Checklist

- [ ] N+1 queries reviewed
- [ ] Caching strategy evaluated
- [ ] Expensive operations queued

---

# Security Checklist

- [ ] Authorization enforced
- [ ] Validation implemented
- [ ] Secrets protected

---

# Reliability Checklist

- [ ] Failure addressed: Testing implementation details.
- [ ] Failure addressed: Over-mocking.
- [ ] Failure addressed: No integration tests for repositories.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Services tested with mocked dependencies (boundaries only)
- [ ] Tests verify outcomes, not call sequences
- [ ] In-memory implementations exist for contract tests
- [ ] Repository methods have integration tests against real DB
- [ ] Tests are fast (unit) with few slow (feature) tests
- [ ] No over-mocking (value objects and models are real objects)

### Success Criteria
- [ ] Service tests mock only boundary dependencies; value objects and models are real.
- [ ] Tests assert on outcomes and state, not on call sequences.
- [ ] In-memory implementations exist for contract testing of complex query logic.
- [ ] Every repository method has an integration test against a real database.
- [ ] Unit tests dominate the test suite; feature tests cover only critical paths.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Mock/reality mismatch
- [ ] Anti-pattern prevented: Brittle tests from tight coupling

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Testing implementation details.
- [ ] Failure scenario handled: Over-mocking.
- [ ] Failure scenario handled: No integration tests for repositories.

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
