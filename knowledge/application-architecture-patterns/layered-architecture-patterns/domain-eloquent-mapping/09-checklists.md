# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-10-domain-eloquent-mapping
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

- [ ] Workflow step completed: **Define mapping direction: Domain Ã¢â€ â€™ Model (write) and Model Ã¢â€ â€™ Domain (read).** Build separate methods or classes for each direction. Keep mapping logic in Infrastructure, not in Domain or Eloquent models.
- [ ] Workflow step completed: **Implement Model Ã¢â€ â€™ Domain mapping (hydrator).** In the Repository implementation, convert Eloquent Model(s) to Domain Entity/Aggregate. Handle related models, nested entities, and Value Objects. Recursively construct the full Aggregate.
- [ ] Workflow step completed: **Implement Domain Ã¢â€ â€™ Model mapping (extractor).** Extract data from Domain Entity into a format suitable for Eloquent. Flatten Value Objects to primitives. Handle nested entities for upsert.
- [ ] Workflow step completed: **Handle persistence diffs.** Compare current Model state against Domain Aggregate changes. Apply only changed fields using `$model->fill()` or attribute-by-attribute assignment. Use Eloquent's `wasChanged()` for optimization.
- [ ] Workflow step completed: **Handle Value Object mapping.** Convert between Value Object (Domain) and primitive/full-column (database). Provide explicit mapping in both directions. Use custom Eloquent casts as an alternative for simple Value Objects.

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

- [ ] Failure addressed: Domain dependencies in mapping.
- [ ] Failure addressed: Eloquent in Domain.
- [ ] Failure addressed: Circular mapping.
- [ ] Failure addressed: Over-mapping.
- [ ] Failure addressed: Identity mismatch.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Mapper exists in Infrastructure, not in Domain or Model
- [ ] Mapping is bidirectional (Domain Ã¢â€ â€™ Model, Model Ã¢â€ â€™ Domain)
- [ ] Value Objects are fully mapped in both directions
- [ ] Nested entities/relationships are mapped recursively
- [ ] Persistence diff is handled (full replace or field-level update)
- [ ] Round-trip tests pass (Domain Ã¢â€ â€™ Model Ã¢â€ â€™ Domain equals original)
- [ ] No Domain logic leaks into mapping code
- [ ] No Eloquent-specific code in Domain Entities
- [ ] Repository returns Domain Entities, not Eloquent Models

### Success Criteria
- [ ] Mapper classes convert Domain Entities Ã¢â€ â€ Eloquent Models bidirectionally.
- [ ] Repository returns Domain objects, not Eloquent Models.
- [ ] Round-trip tests confirm Domain Ã¢â€ â€™ Model Ã¢â€ â€™ Domain produces identical Aggregates.
- [ ] No Eloquent-specific code exists in Domain classes.

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
- [ ] Failure scenario handled: Domain dependencies in mapping.
- [ ] Failure scenario handled: Eloquent in Domain.
- [ ] Failure scenario handled: Circular mapping.

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
