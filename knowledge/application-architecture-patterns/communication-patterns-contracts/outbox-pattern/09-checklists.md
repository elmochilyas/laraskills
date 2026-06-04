# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 06-communication-patterns-contracts
**Knowledge Unit:** Outbox pattern for reliable event delivery
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] No transactional guarantee prevented
- [ ] Separate transaction outbox prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Write to the outbox in the same transaction as the business operation.** If the outbox write is in a separate transaction, the business transaction can commit while the outbox write fails Ã¢â‚¬â€ the event is lost. Same-transaction guarantees atomicity.
- [ ] Workflow step completed: **Make all outbox consumers idempotent.** The outbox pattern provides at-least-once delivery. Duplicates are possible. Consumers must handle duplicate events safely Ã¢â‚¬â€ use idempotency checks.
- [ ] Workflow step completed: **Use a polling publisher for simplicity.** Implement as a scheduled command (Laravel `schedule:run` every minute) that polls the outbox table, publishes pending events, and marks them as published.
- [ ] Workflow step completed: **Implement outbox cleanup.** Regularly archive or delete published outbox records to prevent table bloat. Configure a retention period.
- [ ] Workflow step completed: **Use `dispatchAfterCommit` for non-critical events instead of outbox.** Reserve the outbox pattern for events where delivery guarantees are critical. `dispatchAfterCommit` is sufficient for logging, analytics, and non-critical notifications.

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

- [ ] Failure addressed: No outbox.
- [ ] Failure addressed: Outbox in a separate transaction.
- [ ] Failure addressed: No idempotency.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Outbox writes are in the same transaction as the business operation
- [ ] A polling publisher processes pending events
- [ ] Consumers are idempotent (handle duplicates safely)
- [ ] Published records are cleaned up after retention period
- [ ] Outbox pattern is used for critical events (not logging/analytics)

### Success Criteria
- [ ] Outbox records are inserted within the same database transaction as the originating business operation.
- [ ] A scheduled polling publisher processes pending outbox events and marks them as published.
- [ ] All event consumers that use outbox delivery implement idempotency checks.
- [ ] Published outbox records are deleted or archived after the retention period.
- [ ] `dispatchAfterCommit` is used for non-critical events; outbox is used only for critical must-not-lose events.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: No transactional guarantee
- [ ] Anti-pattern prevented: Separate transaction outbox

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No outbox.
- [ ] Failure scenario handled: Outbox in a separate transaction.
- [ ] Failure scenario handled: No idempotency.

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
