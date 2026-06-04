# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Transaction management: where transactions belong
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Distributed transaction without distributed infrastructure prevented
- [ ] Transaction per action prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Place transactions in the Service layer only.** The service method wraps `DB::transaction(function() { ... })`. This defines the unit of work Ã¢â‚¬â€ everything inside either succeeds or fails together.
- [ ] Workflow step completed: **Never nest transactions.** If an inner class calls `DB::transaction()`, it becomes a savepoint, not a true transaction. Only the outermost transaction is real.
- [ ] Workflow step completed: **Use `DB::afterCommit()` for side effects.** Schedule external API calls, email sending, and event dispatching with `afterCommit()` so they only execute if the transaction commits successfully.
- [ ] Workflow step completed: **Keep transactions short.** Do not perform slow operations (HTTP API calls, file processing, image manipulation, email sending) inside a transaction. Move them to `afterCommit()` callbacks or queue jobs.
- [ ] Workflow step completed: **Actions must never call `DB::transaction()`.** Actions are leaf-node operations that participate in the transaction managed by the calling service.

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

- [ ] Failure addressed: Multiple transaction layers.
- [ ] Failure addressed: Transactions in repositories.
- [ ] Failure addressed: External API calls in transactions.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Transactions are in Service layer only
- [ ] Actions and repositories don't call `DB::transaction()`
- [ ] No nested transaction layers
- [ ] External API calls are outside transactions (afterCommit/queue)
- [ ] Transaction duration is monitored
- [ ] Side effects use `afterCommit()` to avoid executing on rollback

### Success Criteria
- [ ] All transaction boundaries are in Service layer methods Ã¢â‚¬â€ never in Actions, Repositories, or Controllers.
- [ ] Side effects use `afterCommit()` to avoid executing on transaction rollback.
- [ ] No nested transaction calls exist in the codebase.
- [ ] Transaction durations are monitored and kept short.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Distributed transaction without distributed infrastructure
- [ ] Anti-pattern prevented: Transaction per action

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Multiple transaction layers.
- [ ] Failure scenario handled: Transactions in repositories.
- [ ] Failure scenario handled: External API calls in transactions.

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
