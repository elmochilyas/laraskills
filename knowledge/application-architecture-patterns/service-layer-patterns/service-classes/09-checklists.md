# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Service classes: grouping operations by entity
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Service calling service calling service prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Create service classes grouping by entity or domain.** Name after the entity (`UserService`, `OrderService`) Ã¢â‚¬â€ not by operation type (`CreateService`, `UpdateService`). This keeps related operations together.
- [ ] Workflow step completed: **Give each method one business operation responsibility.** `register()`, `changePassword()`, `suspend()` Ã¢â‚¬â€ not `doUserStuff()`. One complete business operation per method.
- [ ] Workflow step completed: **Return data, not HTTP responses.** Services return models, collections, DTOs, or primitives. Response formatting (`response()->json(...)`) belongs in the controller. This preserves reusability from CLI/queue contexts.
- [ ] Workflow step completed: **Limit constructor dependencies to 5 or fewer.** A service with 6+ dependencies is doing too much. Split into multiple services or extract actions.
- [ ] Workflow step completed: **Wrap multi-write operations in `DB::transaction()`.** Single-write operations don't need explicit transactions. Multi-write operations must be atomic.

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

- [ ] Failure addressed: God service class.
- [ ] Failure addressed: Anemic service.
- [ ] Failure addressed: Service returning responses.
- [ ] Failure addressed: Service-to-service deep call chains.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Services grouped by entity/domain, not by operation type
- [ ] Methods return data (models/DTOs), not HTTP responses
- [ ] Constructor dependencies Ã¢â€°Â¤ 5 per service
- [ ] Multi-write operations wrapped in transactions
- [ ] No god service classes (> 30 methods)
- [ ] No anemic services (logicless model wrappers)
- [ ] No deep service-to-service call chains
- [ ] Services orchestrate, delegating work to models/events/jobs

### Success Criteria
- [ ] Business logic resides in service classes, not in controllers or models.
- [ ] Each method performs one complete business operation and returns data.
- [ ] Multi-write operations are transactional.
- [ ] No god services or anemic services exist.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Service calling service calling service

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: God service class.
- [ ] Failure scenario handled: Anemic service.
- [ ] Failure scenario handled: Service returning responses.

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
