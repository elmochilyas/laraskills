# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 06-communication-patterns-contracts
**Knowledge Unit:** Facade pattern risks at context boundaries
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] God facade context prevented
- [ ] Facade-only access prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Never use context-level facades.** Never define a single facade (e.g., `BillingFacade`) that exposes all capabilities of a bounded context. Use multiple small capability-based interfaces instead.
- [ ] Workflow step completed: **Cap small facades at 5-7 methods.** If a facade is necessary, limit it to 5-7 methods covering a single concern. Split any facade that exceeds this threshold into smaller interfaces.
- [ ] Workflow step completed: **Never expose internal types through the facade.** Facades must never return internal value objects, enums, or entities. Convert all return types to shared or public DTOs.
- [ ] Workflow step completed: **Do not make the facade the only entry point.** Allow consumers to use capability interfaces directly without going through a facade. A facade is a convenience, not a requirement.
- [ ] Workflow step completed: **Use facades for third-party integration only.** Reserve the facade pattern for wrapping external third-party libraries. Prefer capability-based interfaces for internal context boundaries.

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

- [ ] Failure addressed: God facade.
- [ ] Failure addressed: Facade exposes internal types.
- [ ] Failure addressed: Facade as the only entry point.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] No single "god facade" per context (e.g., `BillingFacade` with 20+ methods)
- [ ] Capability-based interfaces used instead of context facades
- [ ] Facades (if used) are limited to 5-7 methods
- [ ] Facades don't expose internal types
- [ ] Third-party integrations use facades for isolation
- [ ] Consumers can use capability interfaces directly (facade not mandatory)

### Success Criteria
- [ ] No bounded context has a single monolithic facade covering all its capabilities.
- [ ] Every cross-context capability is accessed via a dedicated focused interface (2-5 methods).
- [ ] Any existing facades are limited to 5-7 methods covering a single concern.
- [ ] No facade returns internal types Ã¢â‚¬â€ all return values are shared DTOs.
- [ ] Consumers can inject capability interfaces directly without going through a facade.
- [ ] Facades are used only for wrapping third-party libraries Ã¢â‚¬â€ not for internal context boundaries.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: God facade context
- [ ] Anti-pattern prevented: Facade-only access

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: God facade.
- [ ] Failure scenario handled: Facade exposes internal types.
- [ ] Failure scenario handled: Facade as the only entry point.

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
