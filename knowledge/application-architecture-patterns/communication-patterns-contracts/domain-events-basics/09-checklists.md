# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 06-communication-patterns-contracts
**Knowledge Unit:** Domain events within and across contexts
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Event avalanche prevented
- [ ] Lost events prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Name domain events in past tense.** Events are immutable records of facts that already happened. `OrderPlaced`, not `PlaceOrder`. Past-tense reinforces this semantic.
- [ ] Workflow step completed: **Dispatch events after DB commit.** Use `dispatchAfterCommit()` to dispatch events only if the transaction commits. Prevents phantom events for rolled-back changes.
- [ ] Workflow step completed: **Separate internal events from integration events.** Internal events can carry entity references (e.g., `Order $order`). Integration events must be self-contained DTOs with no internal model references.
- [ ] Workflow step completed: **Include the aggregate ID in every event.** Consumers use the aggregate ID to correlate events to the same business entity.
- [ ] Workflow step completed: **Make domain events immutable.** Use `readonly` properties with promoted constructor. Events are facts Ã¢â‚¬â€ once published, they must never change.

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

- [ ] Failure addressed: Technical events instead of domain events.
- [ ] Failure addressed: Too many fields.
- [ ] Failure addressed: Dispatching before commit.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Events named in past tense
- [ ] Events dispatched after DB commit (`dispatchAfterCommit`)
- [ ] Integration events are self-contained (no entity references)
- [ ] Internal and integration events are separate classes
- [ ] Event payloads are minimal (not entire models)
- [ ] Aggregate ID included in every event
- [ ] Events are immutable (readonly properties)

### Success Criteria
- [ ] All domain events use past-tense naming with immutable readonly properties.
- [ ] Events are dispatched after DB commit using `dispatchAfterCommit`.
- [ ] Internal events are separate classes from integration events (no internals leaked across contexts).
- [ ] Every event includes the originating aggregate ID.
- [ ] Event payloads contain only the data consumers actually need.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Event avalanche
- [ ] Anti-pattern prevented: Lost events

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Technical events instead of domain events.
- [ ] Failure scenario handled: Too many fields.
- [ ] Failure scenario handled: Dispatching before commit.

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
