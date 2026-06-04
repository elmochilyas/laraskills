# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Infrastructure layer: Eloquent implementations, external adapters
Knowledge Unit ID: LAP-07
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

The Infrastructure layer implements interfaces (ports) defined by inner layers using specific technologies: Eloquent for database access, Mail for email, Queue for async processing, HTTP clients for external APIs. This is where Laravel's framework capabilities are fully utilized. The Infrastructure layer is the "dirty" layer — it absorbs framework coupling so all other layers stay clean.

---

# Core Concepts

- **Implements Ports**: Repository interfaces from Application/Domain → Eloquent implementations. Event bus interfaces → Laravel events. Mail interfaces → Laravel Mail. Queue → Laravel Queue.
- **Adapters in Hexagonal Terms**: Each implementation is an Adapter connecting the core to specific technology.
- **Mapping Layer**: Translates between Domain entities and Eloquent models — the explicit mapping manages coupling.
- **Framework Utilization Zone**: Eloquent, Mail, Queue, HTTP Client used fully here — these capabilities are confined to Infrastructure.

---

# When To Use

- Clean Architecture or Hexagonal Architecture with explicit port/adapter separation
- Applications requiring swappable infrastructure (multiple database drivers, email providers)
- Any layered architecture where framework coupling must be contained

---

# When NOT To Use

- Three-layer architecture where Eloquent models serve as both data access and business objects
- Applications where infrastructure swapping is not anticipated
- When over-abstraction creates interfaces for every infrastructure class with only one implementation

---

# Best Practices

- **Map domain entities to Eloquent models explicitly** in repository implementations. WHY: Domain entities are pure PHP; Eloquent models are infrastructure. Explicit mapping keeps concerns separate and the Domain layer framework-free.
- **Never place business logic in Infrastructure.** WHY: Business rules (discount calculations, validation) in Eloquent model methods or repositories leak domain concerns. Business logic belongs in Domain.
- **Avoid leaking Eloquent-specific return types** from repository methods (`Collection`, `LengthAwarePaginator`). WHY: Return domain types or application-layer DTOs to keep abstractions clean.
- **Write integration tests for Infrastructure code.** WHY: Infrastructure deals with databases, APIs, and filesystems — these need real integration tests, not mocks.
- **Monitor Infrastructure layer with observability tooling** (Laravel Pulse, Telescope). WHY: Most production bugs manifest here — database issues, API timeouts, queue failures.

---

# Architecture Guidelines

- Infrastructure implementations should be the only classes importing Laravel-specific code.
- Each Eloquent model in Infrastructure corresponds to a Domain entity, mapped explicitly.
- External API clients (payment gateways, shipping APIs) have adapter classes implementing port interfaces.
- If only one implementation of an interface exists and will ever exist, consider whether the interface adds value.

---

# Performance Considerations

- Infrastructure layer is the primary performance concern — N+1 queries, missing indexes, slow API calls.
- Eloquent optimization (eager loading, chunking, cursor) happens entirely in Infrastructure.
- Profile infrastructure code separately from domain/application code.

---

# Security Considerations

- SQL injection prevention belongs in Infrastructure (parameterized queries, Eloquent ORM protection).
- External API credential management belongs in Infrastructure (environment variables, encrypted storage).

---

# Common Mistakes

1. **Business logic in Infrastructure:** Business rules in Eloquent model methods or repository implementations. Cause: convenience. Consequence: domain concerns scattered. Better: put business methods on Domain entities.

2. **Leaky abstractions:** Repository methods returning `Collection` or `LengthAwarePaginator`. Cause: Eloquent habit. Consequence: Application layer depends on Laravel collections. Better: return domain types or DTOs.

3. **Over-abstracting Infrastructure:** Interface for every Infrastructure class even with one implementation. Cause: anticipating future needs. Consequence: abstraction overhead without benefit. Better: add interfaces when variation exists.

4. **Eloquent in Domain:** Eloquent models in Domain directories extending `Model`. Cause: misunderstanding layer boundaries. Consequence: Domain coupled to Laravel. Better: architecture tests prevent this.

---

# Anti-Patterns

- **Infrastructure coupling spread**: A single `use` statement importing Infrastructure in Application layer — once one exists, more follow.
- **Anemic Infrastructure**: Repository classes that just passthrough to Eloquent without any mapping or value-add.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-06 Application layer | LAP-10 Domain entity mapping | LAP-09 Framework independence |
| LAP-04 Dependency Rule | CPC-01 Interface contracts | AEG-01 Architecture testing |

---

# AI Agent Notes

- Put all Eloquent models and framework-specific code in Infrastructure, never in Domain or Application.
- Repository implementations should handle mapping between domain entities and Eloquent models.
- Use adapter pattern for external service integration.

---

# Verification

- [ ] No Eloquent models exist outside Infrastructure layer
- [ ] Repository methods return domain types, not Eloquent collections
- [ ] Business logic is absent from Infrastructure classes
- [ ] External API adapters implement port interfaces from Application/Domain
- [ ] Integration tests cover all Infrastructure code paths
- [ ] Architecture tests prevent Infrastructure imports from inner layers
