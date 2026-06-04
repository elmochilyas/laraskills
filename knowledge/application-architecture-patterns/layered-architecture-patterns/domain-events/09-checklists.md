# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-08-domain-events
**Generated:** 2026-06-03
**Based on:** 06
**Note:** Generated from partial input (missing: 04-standardized-knowledge.md, 05-rules.md, 07-decision-trees.md, 08-anti-patterns.md)

---

# Quick Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Production readiness verified

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Identify Domain Events.** Work with domain experts to identify significant business occurrences. Name them in past tense with the Ubiquitous Language (e.g., `InvoicePaid`, not `InvoicePaymentDone`). Events are facts Ã¢â‚¬â€ things that already happened.
- [ ] Workflow step completed: **Create Event classes in Application/Domain boundary layer.** Create plain PHP event classes (may implement an `DomainEvent` marker interface). Include only relevant data as immutable constructor parameters. Never include Laravel-specific traits.
- [ ] Workflow step completed: **Dispatch events in Domain or Application layer.** Record events inside Aggregate methods before persistence. Dispatch through a DomainEventCollector or directly to an event bus. Dispatch BEFORE persisting.
- [ ] Workflow step completed: **Create Listener classes in Infrastructure.** Create Infrastructure listeners that handle each Domain Event. Listeners may persist, send notifications, update search indexes, or dispatch integration events. One listener per side effect.
- [ ] Workflow step completed: **Register Event-Listener mapping in Service Provider.** Use Laravel's `EventServiceProvider` `$listen` array or an infrastructure-aware event registration. Keep Infrastructre listeners outside Domain/Application layers.

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

- [ ] Failure addressed: Commands vs Events confusion.
- [ ] Failure addressed: Events carrying too much data.
- [ ] Failure addressed: Infrastructure leaks into event classes.
- [ ] Failure addressed: Ordering assumptions.
- [ ] Failure addressed: Missing events.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Event class is in Domain/Application or has a `DomainEvent` marker interface
- [ ] Event names are past tense and express business meaning
- [ ] Events carry only relevant immutable data
- [ ] Events are dispatched BEFORE persistence
- [ ] Listener is in Infrastructure, not Domain/Application
- [ ] Event-Listener mapping in Service Provider
- [ ] Critical listeners are queued for reliability
- [ ] Tests verify event dispatch from business operations
- [ ] Tests verify listener side effects
- [ ] No Laravel traits in Domain Event classes

### Success Criteria
- [ ] Domain Events represent significant business occurrences with past tense names.
- [ ] Infrastructure handles all side effects Ã¢â‚¬â€ Domain/Application layers dispatch events and proceed.
- [ ] Listeners are idempotent, queued for reliability, and do not assume execution order.
- [ ] Tests verify correct event dispatch from business operations.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] No known anti-patterns for this KU

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Commands vs Events confusion.
- [ ] Failure scenario handled: Events carrying too much data.
- [ ] Failure scenario handled: Infrastructure leaks into event classes.

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
