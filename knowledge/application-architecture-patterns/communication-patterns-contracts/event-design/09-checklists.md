# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 06-communication-patterns-contracts
**Knowledge Unit:** Event design patterns
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Thin-event mania prevented
- [ ] Event version chaos prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Default to fat events.** Include relevant data the consumer likely needs Ã¢â‚¬â€ saves round-trips and reduces coupling. The consumer shouldn't need to query the producer to act on the event.
- [ ] Workflow step completed: **Always use event envelope with metadata.** Separate metadata (event ID, type, version, timestamp, correlation ID, causation ID) from domain payload. Enables tracing, versioning, and debugging.
- [ ] Workflow step completed: **Default to coarse granularity.** One event per meaningful aggregate state change, not one per field change. Consumers listen to business-relevant events, not noise.
- [ ] Workflow step completed: **Never mutate an event after publication.** Events are facts about the past. Publish a correction event instead. Once read, events are immutable.
- [ ] Workflow step completed: **Version event schemas explicitly.** Carry a version label on every event. When schema changes, increment the version and keep backward compatibility for at least one migration cycle.

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

- [ ] Failure addressed: Thin events that require fetching.
- [ ] Failure addressed: No correlation ID.
- [ ] Failure addressed: Mutable events.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Events carry fat payloads (not just IDs)
- [ ] Event envelope includes eventId, eventType, version, timestamp, correlationId, causationId
- [ ] Events are immutable (no update mechanism)
- [ ] Event versions exist for schema migration
- [ ] Events are coarse-grained (one per aggregate change, not per field)

### Success Criteria
- [ ] All integration events use fat payloads with all data consumers need.
- [ ] Every event is wrapped in an envelope with eventId, eventType, version, timestamp, correlationId, causationId.
- [ ] One coarse event per aggregate change Ã¢â‚¬â€ no field-level event noise.
- [ ] No mutation of published events Ã¢â‚¬â€ corrections published as new events.
- [ ] Event schemas are versioned (V1, V2) with backward compatibility during migration.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Thin-event mania
- [ ] Anti-pattern prevented: Event version chaos

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Thin events that require fetching.
- [ ] Failure scenario handled: No correlation ID.
- [ ] Failure scenario handled: Mutable events.

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
