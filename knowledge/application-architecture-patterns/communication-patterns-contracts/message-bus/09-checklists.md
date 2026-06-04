# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 06-communication-patterns-contracts
**Knowledge Unit:** Message bus and pub/sub patterns
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] God bus prevented
- [ ] Lost messages prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Use Laravel events for in-process, dedicated bus for cross-process.** Laravel's event system is optimized for same-process communication. A dedicated bus provides persistence, delivery guarantees, and routing for cross-process.
- [ ] Workflow step completed: **Register subscriptions explicitly in service providers.** Never use auto-discovery or convention-based scanning for cross-context events. Explicit registration makes dependencies visible.
- [ ] Workflow step completed: **Avoid a single shared bus for all contexts.** Use separate buses or topics per domain or bounded context. Topic-per-domain isolates failures and makes topology understandable.
- [ ] Workflow step completed: **Use pub/sub for domain events, point-to-point for commands.** Domain events go to all interested subscribers. Commands go to exactly one handler. Mixing semantics causes unintended side effects.
- [ ] Workflow step completed: **Configure dead letter queues for all message buses.** Never let message processing failures result in silent message loss. DLQ preserves failed messages for inspection and replay.

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

- [ ] Failure addressed: Bus as monolithic pipeline.
- [ ] Failure addressed: No dead letter handling.
- [ ] Failure addressed: Over-routing.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] In-process events use Laravel's event system
- [ ] Cross-process events use a dedicated message bus
- [ ] Bus has dead letter queue configured
- [ ] Subscriptions registered explicitly in service providers
- [ ] No monolithic "god bus" shared by all contexts
- [ ] Pub/sub for domain events, point-to-point for commands
- [ ] Bus access permissions limited per context

### Success Criteria
- [ ] In-process events use Laravel's event system; cross-process events use a dedicated message bus.
- [ ] All event subscriptions are explicitly registered in service providers.
- [ ] Per-domain topics separate events Ã¢â‚¬â€ no single shared bus.
- [ ] Domain events use pub/sub; commands use point-to-point routing.
- [ ] All bus topics have dead letter queues configured.
- [ ] Bus publish/subscribe permissions are scoped per context.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: God bus
- [ ] Anti-pattern prevented: Lost messages

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Bus as monolithic pipeline.
- [ ] Failure scenario handled: No dead letter handling.
- [ ] Failure scenario handled: Over-routing.

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
