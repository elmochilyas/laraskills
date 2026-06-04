# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 06-communication-patterns-contracts
**Knowledge Unit:** Event sourcing fundamentals
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Event sourcing everywhere prevented
- [ ] Snapshot neglect prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Use snapshots for performance.** Periodically save the aggregate's current state to avoid replaying all events from the beginning. Load aggregate from snapshot + events after snapshot.
- [ ] Workflow step completed: **Never modify or delete events.** Treat the event store as strictly append-only. Append a correction event instead of mutating committed events. Events are immutable facts.
- [ ] Workflow step completed: **Use event sourcing selectively.** Apply only to aggregates that genuinely need audit trails, temporal queries, or replayable projections. Not every entity needs event sourcing.
- [ ] Workflow step completed: **Make projections idempotent.** Every projection handler must handle the same event multiple times and produce the same result. Use `updateOrInsert` and other idempotent patterns.
- [ ] Workflow step completed: **Version events in the event store.** Store a version or event type identifier with every event. Use upcasters to handle schema evolution for old events in the store.

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

- [ ] Failure addressed: Event sourcing without snapshots.
- [ ] Failure addressed: Mutable events.
- [ ] Failure addressed: Event sourcing for everything.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Event store is append-only (no updates, no deletes)
- [ ] Snapshots are configured for performance
- [ ] Projections are idempotent and rebuildable
- [ ] Event sourcing is only used where justified
- [ ] Aggregate state is rebuilt from events (or snapshot + events)
- [ ] Events are versioned in the store

### Success Criteria
- [ ] Event store is strictly append-only Ã¢â‚¬â€ no updates or deletes of committed events.
- [ ] Snapshots are configured for every event-sourced aggregate to prevent full-stream replay.
- [ ] Event sourcing is applied only to entities that need audit trails or temporal queries.
- [ ] All projections use idempotent handlers (safe for rebuild/replay).
- [ ] All stored events carry explicit version identifiers with upcasters for schema evolution.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Event sourcing everywhere
- [ ] Anti-pattern prevented: Snapshot neglect

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Event sourcing without snapshots.
- [ ] Failure scenario handled: Mutable events.
- [ ] Failure scenario handled: Event sourcing for everything.

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
