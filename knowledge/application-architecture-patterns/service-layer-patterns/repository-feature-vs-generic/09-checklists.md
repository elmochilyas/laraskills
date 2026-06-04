# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Repository pattern: feature-oriented vs. generic
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Repository becomes query dumping ground prevented
- [ ] Repository + Eloquent duplicate logic prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Use feature-oriented repositories always if using repositories.** Methods like `findOverdueInvoices()` centralize meaningful query logic. Generic CRUD methods like `findAll()` add ceremony without business value.
- [ ] Workflow step completed: **Name methods after business queries, not data operations.** `findOverdueInvoices()` communicates business purpose. `findAll()` does not. Method names should describe what business question the query answers.
- [ ] Workflow step completed: **Return the right type for each method.** `getMonthlyRevenue()` returns a `Money` value object. `findOverdueInvoices()` returns a Collection of models. Not every method returns Eloquent models Ã¢â‚¬â€ return DTOs, value objects, or primitives where appropriate.
- [ ] Workflow step completed: **Avoid repository with 50+ methods.** When a repository exceeds 50 methods, split into multiple repositories by concern (e.g., `OrderQueryRepository`, `OrderReportRepository`, `OrderSearchRepository`).
- [ ] Workflow step completed: **Create repositories per aggregate root, not per database table.** Group related data access for a domain aggregate (Order + OrderItems + Payments) in one repository.

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

- [ ] Failure addressed: Generic base repository.
- [ ] Failure addressed: Repository returning models for all methods.
- [ ] Failure addressed: Repository with 50+ methods.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Repository methods are business queries, not CRUD
- [ ] No `BaseRepository` or inheritance-based generic repository
- [ ] Return types match the query (model, DTO, value object)
- [ ] No repository has 50+ methods
- [ ] Integration tests verify query correctness
- [ ] Repository per aggregate root, not per table

### Success Criteria
- [ ] All repository methods are named after business queries, not data operations.
- [ ] Return types match the query (Money for revenue queries, model collections for entity queries).
- [ ] No repository has 50+ methods; no `BaseRepository` exists.
- [ ] Repositories are organized per aggregate root, not per table.
- [ ] Each repository method has an integration test.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Repository becomes query dumping ground
- [ ] Anti-pattern prevented: Repository + Eloquent duplicate logic

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Generic base repository.
- [ ] Failure scenario handled: Repository returning models for all methods.
- [ ] Failure scenario handled: Repository with 50+ methods.

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
