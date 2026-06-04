# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** Clean Architecture layers: Domain, Application, Infrastructure, Presentation
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Contaminated Domain prevented
- [ ] Anemic Domain prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Create the four-layer directory structure.** Set up `src/Domain/`, `src/Application/`, `src/Infrastructure/`, `src/Presentation/` with separate PSR-4 roots. Each layer has its own namespace and strict dependency rules.
- [ ] Workflow step completed: **Build the Domain layer with pure PHP.** Create entities with business behavior, value objects with constructor validation, and domain services for multi-entity operations. Zero imports from `Illuminate\*` Ã¢â‚¬â€ use only PHP primitives and domain-defined types.
- [ ] Workflow step completed: **Define port interfaces in the Application layer.** Create interfaces for repositories, event buses, and mailers that the Application layer needs. Infrastructure implements these interfaces.
- [ ] Workflow step completed: **Implement use cases as single-method classes.** Each use case (`CreateInvoice`, `CancelInvoice`) has one public `execute()` method receiving a DTO. Use cases orchestrate domain objects, manage transactions, and return results.
- [ ] Workflow step completed: **Create Infrastructure adapters.** Implement port interfaces using Eloquent, Laravel Mail, Queue, etc. Build explicit mappers to convert between Domain entities and Eloquent models.

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

- [ ] Failure addressed: Eloquent models in Domain layer.
- [ ] Failure addressed: Breaking the Dependency Rule.
- [ ] Failure addressed: Over-mapping.
- [ ] Failure addressed: Architecture paralysis.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Domain layer has zero imports from `Illuminate\` or other frameworks
- [ ] No Eloquent models exist in Domain or Application directories
- [ ] Application layer only depends on Domain (not Infrastructure or Presentation)
- [ ] Every Infrastructure class implements a port interface from Application
- [ ] Architecture tests enforce the Dependency Rule in CI
- [ ] Use case classes have single public method
- [ ] No framework helpers or Facades in Application layer
- [ ] Mappers exist for aggregate root entity conversion

### Success Criteria
- [ ] Domain layer has zero framework dependencies and is testable without Laravel bootstrapping.
- [ ] Application use cases orchestrate domain objects without containing business rules.
- [ ] Infrastructure contains all framework-specific code behind port interfaces.
- [ ] Architecture tests fail if any layer violates the Dependency Rule.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Contaminated Domain
- [ ] Anti-pattern prevented: Anemic Domain
- [ ] Anti-pattern prevented: Over-Mapping

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Eloquent models in Domain layer.
- [ ] Failure scenario handled: Breaking the Dependency Rule.
- [ ] Failure scenario handled: Over-mapping.

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
