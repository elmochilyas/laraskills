# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Event sourcing and CQRS within modular monolith
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Shared event store across modules prevented
- [ ] Event schema not versioned prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Apply event sourcing per-aggregate, not module-wide.** Decide per aggregate whether event sourcing provides value. A module can have both event-sourced and traditionally persisted aggregates.
- [ ] Workflow step completed: **Keep the event store as a module-specific implementation detail.** Each module owns its event store tables and infrastructure. Never share event stores across modules.
- [ ] Workflow step completed: **Version events from day one.** Include a version identifier in every event class. When schema changes, create new version classes with upcasters to migrate old events during replay.
- [ ] Workflow step completed: **Implement snapshots for long-running aggregates.** Snapshot every 100 events or daily. Snapshots prevent minutes-long replay times for aggregates with 10,000+ events.
- [ ] Workflow step completed: **Apply CQRS only when read/write workloads diverge.** Separate read and write models only when they have different performance requirements, data shapes, or change frequencies.

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

- [ ] Failure addressed: Event sourcing for everything.
- [ ] Failure addressed: No snapshot strategy.
- [ ] Failure addressed: CQRS without justification.
- [ ] Failure addressed: Shared event store across modules.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Event sourcing applied per-aggregate, not module-wide
- [ ] Snapshots configured for long-running aggregates (100+ events)
- [ ] Events are versioned with upcasters
- [ ] Event store is module-specific (not shared)
- [ ] CQRS is justified by different read/write performance needs
- [ ] Projectors for cross-module reads use standard domain events
- [ ] Cross-module communication uses standard events, not event-sourced events

### Success Criteria
- [ ] Event sourcing is applied only where justified (audit trail, temporal queries, complex state reconstruction).
- [ ] Event store is module-specific with versioned events and snapshotting.
- [ ] CQRS is applied only where read/write workloads diverge.
- [ ] Cross-module communication uses standard domain events, not event-sourced events.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Shared event store across modules
- [ ] Anti-pattern prevented: Event schema not versioned

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Event sourcing for everything.
- [ ] Failure scenario handled: No snapshot strategy.
- [ ] Failure scenario handled: CQRS without justification.

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
