# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** Incremental migration from MVC to layered architecture
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Architecture lip service prevented
- [ ] Boy Scout rule violation prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: Document current phase and target phase in MIGRATION.md Ã¢â‚¬â€ ensure all developers know which conventions to follow
- [ ] Workflow step completed: **Phase 1 (Controller Thinning):** Extract business logic from controllers into Service classes Ã¢â‚¬â€ inject services into controllers, keep one service per domain concept
- [ ] Workflow step completed: **Phase 2 (Action Isolation):** Break large Service classes into single-purpose Action classes Ã¢â‚¬â€ one public method per action, inject only what each action needs
- [ ] Workflow step completed: Evaluate at Phase 2: does this solve the concrete pain? If yes, stop and document. If no, proceed.
- [ ] Workflow step completed: **Phase 3 (Interface Introduction):** Add interface abstractions for infrastructure (repositories, mail, queue) where variation exists or testing requires mocking

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

- [ ] Failure addressed: Big-bang rewrite:
- [ ] Failure addressed: Deciding Phase 4 on day one:
- [ ] Failure addressed: Permanent half-migration:
- [ ] Failure addressed: Inconsistent enforcement:
- [ ] Failure addressed: Feature Boy Scout Rule violation:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Current migration phase documented in MIGRATION.md
- [ ] Old (app/) and new (src/) structures coexist with clear boundaries
- [ ] If Phase 1: Controllers delegate to Services (no business logic in controllers)
- [ ] If Phase 2: Services broken into single-purpose Action classes
- [ ] If Phase 3: Port interfaces exist for infrastructure where variation exists
- [ ] If Phase 4: Domain, Application, Infrastructure directories exist with arch tests
- [ ] Architecture tests enforce on new directories (old directories have relaxed rules)
- [ ] Adapter classes bridge old-new boundaries (no old code modified for new structure)
- [ ] Each feature migration includes equivalent or better test coverage
- [ ] Stopping point documented as intentional decision (not default half-state)

### Success Criteria
- [ ] Migration phase is explicitly documented and known by all developers
- [ ] New code written in target architecture; old code left untouched until feature is touched
- [ ] Adapter classes bridge old and new without modifying old code
- [ ] Architecture tests pass for new directories; old directories have relaxed rules
- [ ] Each phase transition is an intentional, documented decision (not accidental drift)

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Architecture lip service
- [ ] Anti-pattern prevented: Boy Scout rule violation

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Big-bang rewrite:
- [ ] Failure scenario handled: Deciding Phase 4 on day one:
- [ ] Failure scenario handled: Permanent half-migration:

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
