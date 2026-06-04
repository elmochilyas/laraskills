# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** Framework independence of domain layer in practice
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Independent domain, coupled tests prevented
- [ ] Framework-as-core prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: Document independence decision in ADR: state chosen level (full/partial/none), rationale, and criteria for revisiting
- [ ] Workflow step completed: If full independence: create `app/Domain/` with pure PHP entities/value objects/services Ã¢â‚¬â€ zero `use Illuminate\*`, zero `extends Model`, zero Facades
- [ ] Workflow step completed: If full independence: create explicit mapper layer in Infrastructure (`InvoiceMapper::toDomain()`, `InvoiceMapper::toEloquent()`) Ã¢â‚¬â€ bidirectional, tested roundtrip
- [ ] Workflow step completed: If full independence: define port interfaces in Domain (Repository, EventBus, Mailer interfaces) Ã¢â‚¬â€ implement in Infrastructure
- [ ] Workflow step completed: If full independence: architecture tests enforce no Laravel imports in Domain (`arch('domain')->expect('App\Domain')->toOnlyUse(['App\Domain'])`)

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

- [ ] Failure addressed: Accidental coupling:
- [ ] Failure addressed: Not deciding:
- [ ] Failure addressed: Purity at all costs:
- [ ] Failure addressed: Tests not matching architecture:
- [ ] Failure addressed: Abandoned mapper:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Independence level documented in ADR (full/partial/none)
- [ ] Architecture tests enforce the chosen level
- [ ] If full: no `Illuminate\*` imports in Domain (arch test passes)
- [ ] If full: mapper layer exists with roundtrip tests for each aggregate
- [ ] If full: Domain tests run without Laravel bootstrap (pure PHPUnit)
- [ ] If partial: value objects are framework-agnostic (no Carbon, no Facades)
- [ ] If partial: business logic on Eloquent models but no HTTP coupling
- [ ] No Facade calls or helper functions in any Domain class
- [ ] No `extends Model` in Domain namespace
- [ ] Independence level reviewed within last 3 months

### Success Criteria
- [ ] Independence level documented in ADR with rationale and review triggers
- [ ] Architecture tests enforce the chosen level (CI fails on violations)
- [ ] Domain tests run in <50ms without Laravel bootstrap (full independence) or value object tests run independently (partial)
- [ ] Zero accidental coupling Ã¢â‚¬â€ no Facades, Helpers, or Carbon in any Domain class
- [ ] Independence level reviewed quarterly and adjusted as justified

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Independent domain, coupled tests
- [ ] Anti-pattern prevented: Framework-as-core

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Accidental coupling:
- [ ] Failure scenario handled: Not deciding:
- [ ] Failure scenario handled: Purity at all costs:

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
