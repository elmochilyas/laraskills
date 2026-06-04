# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** Mapping between domain entities and Eloquent models
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Skipping mapping entirely prevented
- [ ] Mapper as anemic service prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: Place mapper class in Infrastructure namespace (`App\Infrastructure\Persistence\InvoiceMapper`) Ã¢â‚¬â€ never in Domain or Application
- [ ] Workflow step completed: Implement `toDomain(InvoiceModel $model): Invoice` Ã¢â‚¬â€ convert from Eloquent model to Domain entity, mapping each field explicitly
- [ ] Workflow step completed: Implement `toEloquent(Invoice $invoice): array` Ã¢â‚¬â€ convert from Domain entity to array for Eloquent `updateOrCreate()`, mapping each field explicitly
- [ ] Workflow step completed: Eager-load ALL needed relationships before calling `toDomain()`: `InvoiceModel::with('items.product.category', 'customer')->findOrFail($id)`
- [ ] Workflow step completed: Map ALL fields between Domain entity and Eloquent model Ã¢â‚¬â€ no partial field mapping, no pass-through of unmapped fields

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

- [ ] Failure addressed: Partial mapping:
- [ ] Failure addressed: Lazy loading in mapper:
- [ ] Failure addressed: Roundtrip failure:
- [ ] Failure addressed: Identity crisis:
- [ ] Failure addressed: Skipping mapper under time pressure:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Mapper is in Infrastructure namespace, not Domain or Application
- [ ] `toDomain()` and `toEloquent()` map ALL fields explicitly (no partial mapping)
- [ ] Eager loading before mapping (no lazy loading triggered in `toDomain()`)
- [ ] Roundtrip test passes: domain Ã¢â€ â€™ eloquent Ã¢â€ â€™ domain preserves all fields
- [ ] Complex mappings use intermediate DTO (decoupled mapping steps)
- [ ] Identity handled correctly: update existing record, don't duplicate on save
- [ ] No transformation logic duplicated with Eloquent casts (single source of truth)
- [ ] Mapper doesn't expose sensitive data beyond what Domain entity defines
- [ ] Roundtrip test covers edge cases: null values, empty collections, special floats
- [ ] Architecture tests verify mapper location and imports

### Success Criteria
- [ ] Every aggregate root with framework-independent Domain has a dedicated mapper
- [ ] All mappers have passing roundtrip tests (domain Ã¢â€ â€™ model Ã¢â€ â€™ domain field equivalence)
- [ ] Zero lazy loading events during any mapper execution (verified by query count assertions)
- [ ] All fields explicitly mapped Ã¢â‚¬â€ no partial mapping gaps
- [ ] Mapper lives in Infrastructure, verified by architecture tests

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Skipping mapping entirely
- [ ] Anti-pattern prevented: Mapper as anemic service

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Partial mapping:
- [ ] Failure scenario handled: Lazy loading in mapper:
- [ ] Failure scenario handled: Roundtrip failure:

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
