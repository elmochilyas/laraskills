# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** Infrastructure layer: Eloquent implementations, external adapters
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Infrastructure coupling spread prevented
- [ ] Anemic Infrastructure prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: Create Eloquent model in Infrastructure namespace (`App\Infrastructure\Persistence\EloquentInvoiceModel`) extending `Model` Ã¢â‚¬â€ with relationships, casts, scopes only (no business logic)
- [ ] Workflow step completed: Create mapper class in Infrastructure: `toDomain(InvoiceModel $model): Invoice` and `toEloquent(Invoice $invoice): array` Ã¢â‚¬â€ explicit field-by-field mapping, no lazy loading
- [ ] Workflow step completed: Implement repository interface from Domain: `class EloquentInvoiceRepository implements InvoiceRepository` Ã¢â‚¬â€ eager-load all needed relationships before calling mapper
- [ ] Workflow step completed: Map both directions in repository: `find()` loads model Ã¢â€ â€™ calls mapper to Domain; `save()` calls mapper to array Ã¢â€ â€™ `updateOrCreate`
- [ ] Workflow step completed: Create adapter classes for external services: implement port interface, wrap third-party SDK/API calls

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

- [ ] Failure addressed: Business logic in Infrastructure:
- [ ] Failure addressed: Leaky abstractions:
- [ ] Failure addressed: Eloquent in Domain:
- [ ] Failure addressed: N+1 from lazy loading in mapper:
- [ ] Failure addressed: Over-abstraction:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Eloquent models in Infrastructure, never in Domain or Application
- [ ] Repository methods return Domain types (not Eloquent models or `Collection`)
- [ ] Explicit mapper between Domain entity and Eloquent model
- [ ] Eager loading before mapping (no lazy loading triggered in mapper)
- [ ] Zero business logic in Eloquent models or repository implementations
- [ ] External API adapters implement port interfaces from Domain/Application
- [ ] Integration tests cover all Infrastructure code paths (real database, real API mocks)
- [ ] Architecture tests prevent Infrastructure imports from Domain/Application
- [ ] ServiceProvider binds port interfaces to Infrastructure implementations
- [ ] Interface abstractions added only when multiple implementations exist (or testing requires them)

### Success Criteria
- [ ] All Eloquent models live exclusively in Infrastructure namespace
- [ ] Repository methods return Domain types only (no `Collection`, no `LengthAwarePaginator`)
- [ ] Mapper tests verify roundtrip: domain Ã¢â€ â€™ model Ã¢â€ â€™ domain (all fields preserved)
- [ ] Zero business logic in any Infrastructure class (verified by architecture tests)
- [ ] Integration tests catch SQL/API errors before production deployment

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Infrastructure coupling spread
- [ ] Anti-pattern prevented: Anemic Infrastructure

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Business logic in Infrastructure:
- [ ] Failure scenario handled: Leaky abstractions:
- [ ] Failure scenario handled: Eloquent in Domain:

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
