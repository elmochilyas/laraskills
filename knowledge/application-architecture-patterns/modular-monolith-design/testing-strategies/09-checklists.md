# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Testing strategies for modular monolith
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Contract mismatch prevented
- [ ] Test suite too slow prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Unit test domain logic with pure PHP tests (no Laravel boot).** Write tests for entities, value objects, services, and actions as `extends \PHPUnit\Framework\TestCase`. These should run in milliseconds without a database.
- [ ] Workflow step completed: **Contract test every cross-module interface.** Write contract tests for every interface in each module's Contracts/. The providing module's test suite verifies the implementation satisfies the contract interface and behavior.
- [ ] Workflow step completed: **Use in-memory adapters for contract tests.** Provide in-memory implementations of module dependencies. These replace real infrastructure (database, queue, HTTP) with in-memory versions that satisfy the same contract.
- [ ] Workflow step completed: **Create test data through contracts, not by direct table insertion.** When Module A needs Module B's data in a test, create it through Module B's contract interface. This prevents test coupling to internal schemas.
- [ ] Workflow step completed: **Architecturally test module isolation.** Write Pest architecture tests that verify: no cross-module imports from internal namespaces, no cross-module Eloquent model usage, no cross-module database table references.

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

- [ ] Failure addressed: Skipping contract tests.
- [ ] Failure addressed: Testing internal implementation across modules.
- [ ] Failure addressed: No in-memory adapters.
- [ ] Failure addressed: Creating test data through direct DB insertion.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Domain logic has pure unit tests (no Laravel boot, milliseconds)
- [ ] Every contract interface has a contract test
- [ ] In-memory adapters exist for contract tests
- [ ] Module test suites can run independently
- [ ] E2E tests are minimal (only critical paths)
- [ ] Architecture tests enforce module isolation rules
- [ ] Module CI runs in parallel jobs

### Success Criteria
- [ ] Domain logic tests run in milliseconds without Laravel boot.
- [ ] Every contract interface has a contract test with in-memory adapters.
- [ ] Module test suites run in parallel CI, completing in the time of the slowest module.
- [ ] E2E tests cover only critical multi-module journeys.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Contract mismatch
- [ ] Anti-pattern prevented: Test suite too slow

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Skipping contract tests.
- [ ] Failure scenario handled: Testing internal implementation across modules.
- [ ] Failure scenario handled: No in-memory adapters.

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
