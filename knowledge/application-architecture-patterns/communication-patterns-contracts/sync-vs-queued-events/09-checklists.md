# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 06-communication-patterns-contracts
**Knowledge Unit:** Synchronous vs queued event handling
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Queue for everything prevented
- [ ] Sync for slow operations prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Default to sync within context, queue across contexts.** Within a context, events are part of the same transactional boundary Ã¢â‚¬â€ sync ensures consistency. Across contexts, queuing decouples availability.
- [ ] Workflow step completed: **Keep critical side effects synchronous.** Operations requiring transactional consistency (inventory deduction, balance updates) must run synchronously. Queuing these risks inconsistent state on worker failure.
- [ ] Workflow step completed: **Queue expensive or slow operations.** Defer email sending, PDF generation, report building, and third-party API calls to the queue. Synchronous execution blocks the HTTP response.
- [ ] Workflow step completed: **Always set `$afterCommit = true` on queued handlers.** This ensures the event is only queued if the database transaction commits. Prevents phantom events for rolled-back changes.
- [ ] Workflow step completed: **Do not queue everything indiscriminately.** Mix sync and queued handlers intentionally. If all handlers are queued and the worker goes down, the entire system becomes inconsistent.

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

- [ ] Failure addressed: Queuing everything.
- [ ] Failure addressed: Sync for expensive operations.
- [ ] Failure addressed: Not configuring `afterCommit` for queued events.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Sync handlers used within context
- [ ] Queued handlers used across contexts
- [ ] `$afterCommit` is set on all queued event handlers
- [ ] Critical side effects are sync (not queued)
- [ ] Expensive operations are queued (not sync)
- [ ] Not all handlers are queued (mix of sync and queue)

### Success Criteria
- [ ] Within-context events use synchronous handlers for consistency.
- [ ] Cross-context integration events use queued handlers with `$afterCommit = true`.
- [ ] Critical side effects (inventory, balance) are always sync.
- [ ] Expensive operations (email, PDF, API calls) are always queued.
- [ ] Event listeners are a deliberate mix of sync and queued Ã¢â‚¬â€ not all queued.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Queue for everything
- [ ] Anti-pattern prevented: Sync for slow operations

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Queuing everything.
- [ ] Failure scenario handled: Sync for expensive operations.
- [ ] Failure scenario handled: Not configuring `afterCommit` for queued events.

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
