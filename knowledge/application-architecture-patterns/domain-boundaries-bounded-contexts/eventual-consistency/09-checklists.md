# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 05-domain-boundaries-bounded-contexts
**Knowledge Unit:** Eventual consistency across context boundaries
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Forcing strong consistency across contexts prevented
- [ ] No staleness handling prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Default to eventual consistency for cross-context data synchronization.** Use events for data propagation across contexts. Eventual consistency enables context independence.
- [ ] Workflow step completed: **Make all event handlers idempotent.** Use `updateOrCreate` or deduplication tracking. Events may be delivered more than once (at-least-once semantics).
- [ ] Workflow step completed: **Design UIs to tolerate stale cross-context data.** Build interfaces that function correctly even when cross-context data is slightly stale. Show staleness indicators if needed.
- [ ] Workflow step completed: **Monitor the consistency window.** Track the average time between event dispatch and processing. Set up alerting when the window exceeds the defined threshold.
- [ ] Workflow step completed: **Implement read-your-writes consistency for the initiating user.** When a user initiates a change that triggers eventual consistency, ensure they see their own write immediately on subsequent reads.

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

- [ ] Failure addressed: Assuming strongly consistent data.
- [ ] Failure addressed: No staleness tolerance.
- [ ] Failure addressed: No monitoring of inconsistency.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Event handlers are idempotent
- [ ] Staleness window is defined and acceptable
- [ ] UIs handle stale cross-context data gracefully
- [ ] Consistency window is monitored
- [ ] Read-your-writes consistency implemented for writers
- [ ] Synchronous calls used for correctness-critical operations
- [ ] Acceptable staleness windows defined per data type
- [ ] Conflict resolution strategies defined for concurrent writes
- [ ] Alerting configured for consistency window breaches

### Success Criteria
- [ ] Eventual consistency is the default pattern for all cross-context data synchronization.
- [ ] All event handlers are idempotent (use updateOrCreate or deduplication).
- [ ] UIs gracefully handle stale data with staleness indicators where needed.
- [ ] Consistency window is monitored with alerting for threshold breaches.
- [ ] Read-your-writes consistency ensures initiating users see their own changes immediately.
- [ ] Synchronous calls are used for correctness-critical operations (financial, authorization).
- [ ] Acceptable staleness windows are documented per data type with defined conflict resolution strategies.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Forcing strong consistency across contexts
- [ ] Anti-pattern prevented: No staleness handling

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Assuming strongly consistent data.
- [ ] Failure scenario handled: No staleness tolerance.
- [ ] Failure scenario handled: No monitoring of inconsistency.

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
