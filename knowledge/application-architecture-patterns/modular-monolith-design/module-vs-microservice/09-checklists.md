# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 03-modular-monolith-design
**Knowledge Unit:** Module vs. microservice: definition and key differences
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Distributed monolith prevented
- [ ] Module extraction failure prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Default to modular monolith for teams under 30 engineers.** Modules provide domain isolation without distribution costs (single CI, single deploy, single monitoring surface). Document this decision in an ADR.
- [ ] Workflow step completed: **Extract to microservice only when specific constraints are measurable.** Track per-module resource usage (CPU, memory, connections). Extract only when a module's resource requirements diverge significantly from the rest.
- [ ] Workflow step completed: **Design modules as extraction-ready from the start.** Define explicit contracts for inter-module communication, own database schema per module, and avoid shared Eloquent models. This makes future extraction straightforward.
- [ ] Workflow step completed: **Enforce module boundaries with architecture tests, not just folder conventions.** Write Pest architecture tests that prevent cross-module imports, shared model usage, and cross-module table access.
- [ ] Workflow step completed: **Respect the 100-1000x latency difference.** Keep latency-sensitive operations in-process via contracts. Move to async events for non-critical cross-module notifications.

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

- [ ] Failure addressed: Premature microservices.
- [ ] Failure addressed: Module as folder, not boundary.
- [ ] Failure addressed: Distributed monolith.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Modular monolith is the default unless specific constraints require microservices
- [ ] Module extraction readiness is built in (contracts, schema ownership, no shared models)
- [ ] Architecture tests enforce module boundaries in CI
- [ ] Module vs microservice decision is documented with rationale
- [ ] Team-size threshold is acknowledged (<30 = modular monolith, >50 = consider microservices)

### Success Criteria
- [ ] Modular monolith is the default architecture for teams under 30 engineers.
- [ ] Module boundaries are enforced by architecture tests, not folder conventions.
- [ ] Extraction-readiness is built in from day one.
- [ ] The team-size threshold and extraction triggers are documented in an ADR.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Distributed monolith
- [ ] Anti-pattern prevented: Module extraction failure

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Premature microservices.
- [ ] Failure scenario handled: Module as folder, not boundary.
- [ ] Failure scenario handled: Distributed monolith.

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
