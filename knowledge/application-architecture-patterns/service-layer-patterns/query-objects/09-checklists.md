# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Query objects as alternative to repositories
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Query object explosion prevented
- [ ] Query/scopes duplication prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Keep query objects read-only.** Query objects encapsulate SELECT queries only. Do not add `create()`, `update()`, or `delete()` methods. Write operations belong in repositories or services.
- [ ] Workflow step completed: **Return arrays or DTOs, not Eloquent models.** Consumers of query objects are often read-only views. Returning arrays or DTOs decouples consumers from the ORM, enables select-column optimization, and prevents N+1 lazy loading.
- [ ] Workflow step completed: **Don't create a query object for every query.** Simple one-liners like `User::find($id)` stay inline. Extract only when the query is complex or repeated across multiple consumers.
- [ ] Workflow step completed: **Avoid duplication with model scopes.** Choose one pattern: scopes for simple queries on the model, query objects for complex cross-entity queries. Do not define the same query in both places.
- [ ] Workflow step completed: **Prefer query objects over repositories for read-heavy applications.** For reports, dashboards, and search, query objects are lighter and more focused on read optimization than repositories.

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

- [ ] Failure addressed: Query object with writes.
- [ ] Failure addressed: Query object for every query.
- [ ] Failure addressed: Returning Eloquent models.
- [ ] Failure addressed: Query/scopes duplication.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Query objects are read-only (no write methods)
- [ ] Query objects are for complex/repeated queries, not simple one-liners
- [ ] Return DTOs or arrays, not Eloquent models
- [ ] No duplication with model scopes
- [ ] Queries are testable in isolation
- [ ] Query objects respect authorization boundaries

### Success Criteria
- [ ] Query objects are read-only and encapsulate only complex or repeated queries.
- [ ] Query objects return DTOs or arrays, not Eloquent models.
- [ ] No query exists in both a model scope and a query object (no duplication).
- [ ] Authorization boundaries are respected Ã¢â‚¬â€ no unfiltered data exposure.
- [ ] Read-heavy applications use query objects instead of repositories for reads.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Query object explosion
- [ ] Anti-pattern prevented: Query/scopes duplication

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Query object with writes.
- [ ] Failure scenario handled: Query object for every query.
- [ ] Failure scenario handled: Returning Eloquent models.

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
