# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Clean Architecture layers: Domain, Application, Infrastructure, Presentation
Knowledge Unit ID: LAP-02
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Clean Architecture (Robert C. Martin, 2012) organizes code into four concentric layers: Domain (entities, business rules), Application (use cases, DTOs), Infrastructure (databases, external APIs), and Presentation (HTTP, controllers). The Dependency Rule: source code dependencies can only point inward. The Domain layer knows nothing about the outside world. This architecture provides the most explicit separation of business rules from technical concerns but carries significant complexity.

---

# Core Concepts

- **Domain Layer (innermost):** Enterprise business rules. Entities, value objects, domain events, domain services. Zero framework dependencies — pure PHP.
- **Application Layer:** Use cases (interactors), DTOs, application services, repository interfaces (ports). Depends only on Domain.
- **Infrastructure Layer:** Eloquent models, repository implementations (adapters), external API clients. Depends on Application (implements its interfaces).
- **Presentation Layer:** Controllers, Form Requests, API Resources, routes. Calls use cases with no business logic.
- **Dependency Flow:** Presentation → Infrastructure → Application ← Domain. Inner layers define interfaces; outer layers implement them.

---

# When To Use

- Business logic is complex enough to warrant framework independence
- Multiple delivery mechanisms exist (HTTP API, CLI, queue workers)
- Application has long expected lifespan (5+ years)
- Need to test business logic without Laravel bootstrapping
- Team size >10 engineers with architectural experience

---

# When NOT To Use

- Simple CRUD with straightforward business rules
- Small team with limited architectural experience
- Short-lived project (<3 years)
- Framework coupling isn't causing problems
- Team cannot commit to maintaining architectural discipline

---

# Best Practices

- **Keep Domain layer pure PHP with zero Laravel imports.** WHY: The entire value of Clean Architecture is framework independence. A single `use Illuminate\...` in Domain violates the Dependency Rule.
- **Use Port-Adapter pattern** — Application defines interfaces (ports), Infrastructure implements them (adapters). WHY: This is the core mechanism that enables dependency inversion.
- **Bind ports to adapters in service providers.** WHY: Laravel's service container resolves `Interface::class` to Concrete::class, implementing the dependency inversion at runtime.
- **Use mappers for domain entity → Eloquent model conversion.** WHY: Domain entities are pure PHP; Eloquent models are infrastructure. They must be mapped, not used interchangeably.
- **Write architecture tests that forbid Domain imports from outer layers.** WHY: Without enforcement, the Dependency Rule degrades over time.

---

# Architecture Guidelines

- Each use case is a class with a single `execute()` or `handle()` method taking a DTO.
- Domain events are pure PHP objects; dispatching goes through a port interface.
- The Application layer orchestrates domain objects but contains no business rules — those belong in Domain.
- Eloquent models belong in Infrastructure, not Domain.
- If a domain entity is identical to an Eloquent model, consider whether Clean Architecture is justified.

---

# Performance Considerations

- Method call overhead for interface dispatch, entity mapping, and DTO construction is negligible for most apps.
- High-throughput endpoints may see measurable overhead from mapping layers — profile before optimizing.
- Octane compatibility: all injected dependencies must be stateless; domain entities should be immutable.

---

# Security Considerations

- Domain layer should not handle authentication or authorization — those are infrastructure concerns.
- Application layer can check authorization via a port interface to an authorization service.

---

# Common Mistakes

1. **Eloquent models in Domain layer.** Cause: convenience or misunderstanding. Consequence: Domain coupled to Laravel ORM. Better: keep Eloquent models in Infrastructure; map to/from domain entities.

2. **Breaking the Dependency Rule:** Application imports `Illuminate\Http\Request` or `DB::`. Cause: convenience. Consequence: framework coupling in inner layers. Better: pass primitives or DTOs.

3. **Over-mapping:** Domain entities identical to Eloquent models. Cause: no behavioral difference. Consequence: mapping adds cost without value. Better: reconsider if Clean Architecture is needed.

4. **Architecture paralysis:** Spending excessive time on correct abstractions. Cause: perfectionism. Consequence: productivity drops for 3-6 months. Better: start with three-layer, migrate incrementally.

---

# Anti-Patterns

- **Contaminated Domain**: Infrastructure imports in Domain layer — defeats the purpose entirely.
- **Anemic Domain**: Domain entities are property bags with no behavior — business logic lives in Application services.
- **Framework-as-core**: Treating Laravel as the application core instead of as an infrastructure detail.

---

# Examples

Clean Architecture directory structure:
```
src/
├── Domain/
│   ├── Entities/Invoice.php
│   ├── ValueObjects/Money.php
│   └── Events/InvoiceCreated.php
├── Application/
│   ├── UseCases/CreateInvoice.php
│   ├── Ports/InvoiceRepository.php
│   └── DTOs/CreateInvoiceDto.php
├── Infrastructure/
│   ├── Persistence/EloquentInvoiceRepository.php
│   └── Queue/LaravelEventBus.php
└── Presentation/
    ├── Http/Controllers/InvoiceController.php
    └── Http/Requests/StoreInvoiceRequest.php
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-01 Three-layer architecture | LAP-04 Dependency Rule | LAP-09 Framework independence |
| DDD tactical patterns | LAP-05 Domain layer | LAP-10 Domain entity mapping |

---

# AI Agent Notes

- When generating Clean Architecture code, never place framework-specific code in Domain or Application layers.
- Application layer classes should never import Laravel-specific classes.
- Infrastructure layer is where Laravel-specific code (Eloquent, Facades, DB) belongs.
- Use case classes should have exactly one public `execute()`/`handle()` method.

---

# Verification

- [ ] Domain layer has zero imports from `Illuminate\` or other frameworks
- [ ] No Eloquent models exist in Domain or Application directories
- [ ] Application layer only depends on Domain (not Infrastructure or Presentation)
- [ ] Every Infrastructure class implements a port interface from Application
- [ ] Architecture tests enforce the Dependency Rule in CI
- [ ] Use case classes have single public method
