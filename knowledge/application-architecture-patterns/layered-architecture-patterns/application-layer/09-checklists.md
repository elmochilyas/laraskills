# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** Application layer: use cases, DTOs, application services
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Fat use case prevented
- [ ] Use case calling use case prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: Identify a user goal (one per use case): "Create Invoice", "Cancel Order", "Process Refund" Ã¢â‚¬â€ each maps to one business operation
- [ ] Workflow step completed: Create an input DTO class per use case with `readonly` properties for exactly the fields that operation needs Ã¢â‚¬â€ no shared fat DTOs
- [ ] Workflow step completed: Create the use case class with a single public method (`execute()` or `handle()`) accepting the input DTO
- [ ] Workflow step completed: Inject dependencies via constructor: repository interfaces (Domain), domain services, application services, event bus Ã¢â‚¬â€ never inject Infrastructure classes
- [ ] Workflow step completed: Place `DB::transaction()` boundary inside the use case, wrapping all repository calls that must be atomic

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

- [ ] Failure addressed: Business logic in use cases:
- [ ] Failure addressed: Fat DTOs:
- [ ] Failure addressed: Transactions in controllers:
- [ ] Failure addressed: Use case calling use case:
- [ ] Failure addressed: No DTO validation:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Each use case has a single public method representing one user goal
- [ ] Input DTO is specific to the use case (not shared fat DTO)
- [ ] No business rule `if` statements in use cases (delegated to Domain)
- [ ] `DB::transaction()` is in the use case, not in Controller or Repository
- [ ] External API calls after transaction commit, not within
- [ ] Authorization checked before transaction, not within
- [ ] Dependencies are interfaces from Domain, not Infrastructure implementations
- [ ] Use case logs entry, exit, timing, and result
- [ ] Use case does not call another use case directly
- [ ] Output DTO is returned with only needed fields

### Success Criteria
- [ ] Each use case contains zero business rule logic (verified by architecture tests)
- [ ] Input DTOs are specific per use case with no unused nullable fields
- [ ] All database transactions scoped in use cases, not in controllers or repositories
- [ ] External API calls always happen after transaction commit
- [ ] Use cases are independently testable with mocked Domain interfaces

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Fat use case
- [ ] Anti-pattern prevented: Use case calling use case
- [ ] Anti-pattern prevented: DTO as God object

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Business logic in use cases:
- [ ] Failure scenario handled: Fat DTOs:
- [ ] Failure scenario handled: Transactions in controllers:

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
