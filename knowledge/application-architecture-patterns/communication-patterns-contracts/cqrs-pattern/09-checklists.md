# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 06-communication-patterns-contracts
**Knowledge Unit:** CQRS pattern
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] CQRS-for-CRUD prevented
- [ ] Leaky queries prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Default to segregated models, not full CQRS.** Segregated models within the same database provide CQRS benefits without the complexity of separate databases, eventual consistency, and cross-database transactions.
- [ ] Workflow step completed: **Use imperative naming for commands.** Name commands in verb-noun format (`PlaceOrder`, `CancelInvoice`). Past tense (`OrderPlaced`) is for events, not commands.
- [ ] Workflow step completed: **Never return domain objects from queries.** Queries return DTOs, read models, or plain arrays. Never return Eloquent models or entities Ã¢â‚¬â€ this couples presentation to domain internals.
- [ ] Workflow step completed: **Keep commands synchronous when the user waits.** Execute commands the user awaits synchronously. Only queue commands that don't require immediate feedback.
- [ ] Workflow step completed: **Use the command bus over direct service calls.** Route all commands through `Bus::dispatch()`. The command bus provides middleware, queuing, pipeline processing, and consistent mutation patterns.

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

- [ ] Failure addressed: CQRS for simple CRUD.
- [ ] Failure addressed: Domain objects in queries.
- [ ] Failure addressed: CQRS without command bus.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Commands use imperative naming via command bus
- [ ] Queries return DTOs (not domain objects/entities)
- [ ] Read and write models are separate classes
- [ ] Read models are optimized for specific queries
- [ ] CQRS not applied to simple CRUD operations
- [ ] Commands and queries authorized separately

### Success Criteria
- [ ] Segregated read/write models in the same database Ã¢â‚¬â€ no separate read databases.
- [ ] Commands use imperative verb-noun naming and go through the command bus.
- [ ] Queries return only DTOs/read models Ã¢â‚¬â€ no Eloquent models crossing the query boundary.
- [ ] User-facing commands are synchronous; only deferrable commands are queued.
- [ ] Commands have write authorization; queries have separate read authorization.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: CQRS-for-CRUD
- [ ] Anti-pattern prevented: Leaky queries

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: CQRS for simple CRUD.
- [ ] Failure scenario handled: Domain objects in queries.
- [ ] Failure scenario handled: CQRS without command bus.

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
