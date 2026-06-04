# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Repository pattern debate: when it adds value vs. overhead
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Repository drift prevented
- [ ] Abandoned repository prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Use feature-oriented repositories, not generic CRUD.** A repository with `findOverdueInvoices()` provides value by centralizing complex query logic. A repository with `find()`, `all()`, `create()`, `update()`, `delete()` adds ceremony without value.
- [ ] Workflow step completed: **Skip the `BaseRepository`.** Generic base repositories with shared CRUD recreate the problem at the inheritance level. Each repository should have methods specific to its domain.
- [ ] Workflow step completed: **Test repository methods with integration tests.** A feature-oriented method with a wrong WHERE clause is a data retrieval bug. Test against a real database with `RefreshDatabase`.
- [ ] Workflow step completed: **Do not use "swap the database" as justification.** Eloquent semantics permeate the application Ã¢â‚¬â€ a repository interface doesn't make a MongoDB or DynamoDB switch trivial. Use repos for multi-source data, not hypothetical database swaps.
- [ ] Workflow step completed: **Repository must not leak Eloquent types.** Do not return `Builder` or `LengthAwarePaginator` from repository methods. Return collections, domain objects, or DTOs.

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

- [ ] Failure addressed: Generic repository.
- [ ] Failure addressed: Repository leaking Eloquent.
- [ ] Failure addressed: Repository without tests.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Repositories are feature-oriented, not generic CRUD
- [ ] No `BaseRepository` or generic inheritance
- [ ] Repository methods are tested with integration tests
- [ ] Repositories are actually used (not abandoned)
- [ ] Feature-oriented methods map to business queries
- [ ] Repository does not leak Eloquent types (Builder, Paginator)
- [ ] "Swap the database" is NOT the primary justification

### Success Criteria
- [ ] Repositories are feature-oriented with business-specific methods, not generic CRUD.
- [ ] No `BaseRepository` exists in the codebase.
- [ ] Every repository method has an integration test against a real database.
- [ ] All repositories are actively used (no abandoned repos).
- [ ] Repository return types are domain objects or DTOs, not Eloquent builders/paginators.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Repository drift
- [ ] Anti-pattern prevented: Abandoned repository

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Generic repository.
- [ ] Failure scenario handled: Repository leaking Eloquent.
- [ ] Failure scenario handled: Repository without tests.

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
