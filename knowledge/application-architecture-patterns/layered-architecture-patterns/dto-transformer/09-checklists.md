# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-14-dto-transformer
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

- [ ] Workflow step completed: **Identify DTO boundaries.** Determine where data crosses layer boundaries: Controller Ã¢â€ â€™ Use Case (input), Use Case Ã¢â€ â€™ Controller (output), API response formatting. Each crossing is a DTO candidate.
- [ ] Workflow step completed: **Create input DTOs for Use Case methods.** Create readonly classes with typed properties. Use named constructors for creation from HTTP Request or CLI input. Never pass Request objects to Application/Domain layers.
- [ ] Workflow step completed: **Create output DTOs for Use Case responses.** Define readonly DTOs representing return data. Use only primitives and other DTOs Ã¢â‚¬â€ no Domain objects. Include only data the caller needs.
- [ ] Workflow step completed: **Create Transformers for API responses.** Build transformer classes or `JsonResource` classes for converting Domain/Application objects to API response arrays. One transformer per entity/response type.
- [ ] Workflow step completed: **Implement `toArray()` on Transformers.** Return structured arrays matching the API contract. Handle relationship inclusion (`include`, `with`). Support sparse fieldsets if needed.

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

- [ ] Failure addressed: DTOs as anemic data bags.
- [ ] Failure addressed: Domain objects in DTO roles.
- [ ] Failure addressed: Shared mutable DTOs.
- [ ] Failure addressed: Transformer coupled to Eloquent.
- [ ] Failure addressed: Over-fragmentation.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] DTOs are readonly (PHP 8.1+ readonly class or immutable)
- [ ] DTOs contain only primitives and other DTOs
- [ ] No Domain objects passed as DTOs
- [ ] DTOs exist in Application layer (not Domain, not Presentation)
- [ ] No Request objects passed to Use Cases
- [ ] Transformers output consistent API structure
- [ ] Transformers handle relationships correctly
- [ ] Tests verify exact API response format
- [ ] Transformers are stateless (no session/dependency on request state)

### Success Criteria
- [ ] DTOs are readonly with typed properties and exist in the Application layer.
- [ ] Use Case methods accept DTOs (not Request objects) and return DTOs (not Domain objects).
- [ ] Transformers produce consistent, tested API response structures.
- [ ] No sensitive fields are exposed through response formatting.

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
- [ ] Failure scenario handled: DTOs as anemic data bags.
- [ ] Failure scenario handled: Domain objects in DTO roles.
- [ ] Failure scenario handled: Shared mutable DTOs.

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
