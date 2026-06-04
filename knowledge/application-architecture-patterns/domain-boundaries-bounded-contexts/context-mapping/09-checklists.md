# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 05-domain-boundaries-bounded-contexts
**Knowledge Unit:** Context mapping: relationships between contexts
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] No translation layer prevented
- [ ] Context map not maintained prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Document all cross-context relationships in a context map.** Record the relationship type between every pair of interacting contexts. Store as code or diagram in the repository.
- [ ] Workflow step completed: **Prefer Open Host Service for stable upstream APIs.** When a context provides data to multiple downstream consumers, publish a clear contract (interface + DTOs). This decouples upstream implementation from downstream consumers.
- [ ] Workflow step completed: **Use Anti-Corruption Layer for integrating with divergent models.** When integrating with a context whose domain model significantly differs from yours, use ACL (translation) to protect your model's integrity.
- [ ] Workflow step completed: **Avoid defaulting to Shared Kernel.** Default to Separate Ways or Open Host Service. Use Shared Kernel only when the shared code is stable, minimal, and used by three or more contexts.
- [ ] Workflow step completed: **Default to Separate Ways when contexts implement the same concept differently.** Each context should model the concept in its own language Ã¢â‚¬â€ don't force a shared model.

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

- [ ] Failure addressed: No context map.
- [ ] Failure addressed: Defaulting to Shared Kernel.
- [ ] Failure addressed: Defaulting to Separate Ways.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Context map documents all cross-context relationships
- [ ] Relationship type is intentional (not default)
- [ ] Integration patterns match the relationship type
- [ ] Shared Kernel is minimal where used
- [ ] Context map is kept up-to-date
- [ ] Rationale for each relationship type is documented

### Success Criteria
- [ ] Context map exists as documented code or diagram with all cross-context relationships recorded.
- [ ] Each relationship type is intentional with documented rationale.
- [ ] Shared Kernel is minimal (<20 classes) and not the default relationship type.
- [ ] Context map is kept up-to-date as part of architectural reviews.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: No translation layer
- [ ] Anti-pattern prevented: Context map not maintained

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No context map.
- [ ] Failure scenario handled: Defaulting to Shared Kernel.
- [ ] Failure scenario handled: Defaulting to Separate Ways.

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
