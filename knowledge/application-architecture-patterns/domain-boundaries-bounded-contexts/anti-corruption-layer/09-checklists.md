# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 05-domain-boundaries-bounded-contexts
**Knowledge Unit:** Anti-corruption layer pattern
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Leaky ACL prevented
- [ ] ACL that's never updated prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Build ACL when model divergence exists, not for every integration.** If the external model closely matches your context's model, direct integration is simpler. ACL is for protecting model integrity from foreign schemas.
- [ ] Workflow step completed: **Own the ACL in the consuming context.** Place the ACL within the consuming context's boundary, not in the upstream system. The consuming context is responsible for protecting its own model integrity.
- [ ] Workflow step completed: **Translate conceptually, not just syntactically.** True translation converts foreign concepts (status codes, money formats) into your context's native concepts. A thin pass-through that renames fields doesn't protect your domain.
- [ ] Workflow step completed: **Structure ACL with Translator, Facade, and Adapter sub-patterns.** The Translator handles two-way conversion, Facade simplifies the external system's complex interface, and Adapter implements the port interface defined by the consuming context.
- [ ] Workflow step completed: **Do not expose legacy system details through the ACL.** Hide all legacy table names, API endpoints, and data formats behind the ACL interface. The consuming context must not know about legacy implementation.

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

- [ ] Failure addressed: No ACL when one is needed.
- [ ] Failure addressed: ACL too thin.
- [ ] Failure addressed: Leaky ACL.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] ACL protects context model integrity
- [ ] Translation is conceptual (not just field mapping)
- [ ] ACL lives in consuming context's boundary
- [ ] Legacy models never imported directly into context
- [ ] ACL is updated when legacy system changes
- [ ] Translator + Facade + Adapter sub-patterns used
- [ ] Bidirectional translation if writes to external system
- [ ] ACL translation logic has isolated unit tests

### Success Criteria
- [ ] ACL exists between consuming context and legacy/external system where model divergence exists.
- [ ] Translation covers both directions (inbound read and outbound write) where applicable.
- [ ] Legacy classes are never imported outside the ACL's boundary.
- [ ] ACL translation logic is unit tested in isolation, covering all status/currency/date conversion rules.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Leaky ACL
- [ ] Anti-pattern prevented: ACL that's never updated

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No ACL when one is needed.
- [ ] Failure scenario handled: ACL too thin.
- [ ] Failure scenario handled: Leaky ACL.

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
