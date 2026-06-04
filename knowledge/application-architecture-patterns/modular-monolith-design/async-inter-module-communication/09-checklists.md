# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Inter-module asynchronous communication via events
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Event-driven request-response prevented
- [ ] Event explosion prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Create domain event classes in the publishing module.** Use past-tense names (`OrderPlaced`, `PaymentReceived`). Include only relevant data as immutable constructor parameters (IDs and changed values, not Eloquent models).
- [ ] Workflow step completed: **Dispatch events at the right time in business operations.** Dispatch after the core operation completes and data is persisted. Use Laravel's `Event::dispatch()` or a dedicated event bus.
- [ ] Workflow step completed: **Queue cross-module events by default.** Implement `ShouldQueue` on listeners. Slow listeners (email, reports, webhooks) must not block the HTTP response. Sync dispatch only when data consistency requires it.
- [ ] Workflow step completed: **Create listener classes in subscribing modules.** Each listener class handles one event. Listeners belong in the subscriber's Infrastructure layer. One listener per side effect.
- [ ] Workflow step completed: **Make listeners idempotent.** Check if the action was already performed before executing. Use a deduplication table or natural idempotency (e.g., INSERT IGNORE, idempotency keys).

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

- [ ] Failure addressed: Events within a single module.
- [ ] Failure addressed: Too much data in events.
- [ ] Failure addressed: Sync events for slow operations.
- [ ] Failure addressed: Non-idempotent listeners.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Event classes use past-tense naming
- [ ] Event payloads contain IDs and values, not Eloquent models
- [ ] Cross-module events are queued by default (ShouldQueue)
- [ ] Listeners perform idempotency checks
- [ ] No events used for within-module communication
- [ ] Event dispatch is after data persistence
- [ ] Module events are documented

### Success Criteria
- [ ] All asynchronous cross-module communication uses domain events.
- [ ] Event payloads are minimal (IDs and DTOs, never Eloquent models).
- [ ] Listeners are queued and idempotent.
- [ ] Module events are documented as the async API contract.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Event-driven request-response
- [ ] Anti-pattern prevented: Event explosion

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Events within a single module.
- [ ] Failure scenario handled: Too much data in events.
- [ ] Failure scenario handled: Sync events for slow operations.

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
