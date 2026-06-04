# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Clean Architecture layers: Domain, Application, Infrastructure, Presentation
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Clean Architecture (Robert C. Martin, 2012) organizes code into four concentric layers: Domain (entities, business rules), Application (use cases, DTOs), Infrastructure (databases, external APIs), and Presentation (HTTP, controllers). The defining rule is the Dependency Rule: source code dependencies can only point inward—from Presentation → Infrastructure → Application → Domain. The Domain layer knows nothing about the outside world. This architecture is the most explicit separation of business rules from technical concerns, but it carries significant complexity and ceremony that must be justified by the application's complexity.

---

# Core Concepts

**Domain Layer (innermost):** Enterprise business rules. Entities, value objects, domain events, domain services. Zero framework dependencies. Pure PHP with no Laravel imports.

**Application Layer:** Use cases (interactors), DTOs, application services, repository interfaces (ports). Orchestrates domain objects to fulfill use cases. Depends only on Domain layer.

**Infrastructure Layer:** Eloquent model implementations, repository implementations (adapters), external API clients, mail drivers, queue implementations. Depends on Application layer (implements its interfaces).

**Presentation Layer:** Controllers, Form Requests, API Resources, routes. Depends on Application layer (calls use cases). No business logic.

Dependency flow: Presentation → Infrastructure → Application ← Domain. Application and Domain define interfaces; Infrastructure implements them.

---

# Mental Models

**The "Onion" model:** Domain is the core, wrapped by Application, wrapped by Infrastructure, wrapped by Presentation. Dependencies point inward like onion layers.

**The "Framework as Detail" model:** Laravel is an implementation detail of the Infrastructure layer. The Domain doesn't know it exists. This is the key distinction from three-layer architecture.

**The "Interface Ownership" model:** The inner layer (Application) defines the interface (port); the outer layer (Infrastructure) implements it (adapter). The inner layer never depends on the outer layer.

---

# Internal Mechanics

Implementation pattern: Domain defines interfaces, Application uses them, Infrastructure implements them via Laravel-specific code.

```
src/
├── Domain/
│   ├── Entities/Invoice.php        # Pure PHP, no Laravel
│   ├── ValueObjects/Money.php      # Pure PHP
│   └── Events/InvoiceCreated.php   # Pure PHP event
├── Application/
│   ├── UseCases/CreateInvoice.php  # Orchestrates domain objects
│   ├── Ports/InvoiceRepository.php # Interface only
│   └── DTOs/CreateInvoiceDto.php   # Data transfer
├── Infrastructure/
│   ├── Persistence/EloquentInvoiceRepository.php  # Implements InvoiceRepository
│   └── Queue/LaravelEventBus.php   # Wraps Laravel events
└── Presentation/
    ├── Http/Controllers/InvoiceController.php
    └── Http/Requests/StoreInvoiceRequest.php
```

Laravel's service container binds Application port interfaces to Infrastructure implementations:
```php
// AppServiceProvider
$this->app->bind(InvoiceRepository::class, EloquentInvoiceRepository::class);
```

---

# Patterns

**Port-Adapter:** The Application layer defines ports (interfaces). Infrastructure provides adapters (implementations). This is the core architectural mechanism.

**Use Case Interactor:** Each use case is a class with a single `execute()` or `handle()` method that takes a DTO, orchestrates domain objects via ports, and returns a result.

**Domain Event Dispatching:** Domain events are pure PHP objects defined in the Domain layer. An Application service dispatches them via a port (EventBus interface) implemented by Infrastructure (Laravel's event system).

---

# Architectural Decisions

**Use Clean Architecture when:** Business logic is complex enough to warrant framework independence, multiple delivery mechanisms exist (HTTP API, CLI, queue workers), the application has a long expected lifespan (5+ years), and you need to test business logic without Laravel bootstrapping.

**Avoid Clean Architecture when:** Simple CRUD with straightforward business rules, small team with limited architectural experience, short-lived project, or the framework coupling isn't causing problems.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Framework-independent domain | Significant mapping overhead | Entity <-> Eloquent model mapping requires adapter code |
| Business logic testable without Laravel | High initial setup cost | Each use case requires interface + DTO + implementation |
| Multiple delivery mechanisms supported | Ceremony for simple operations | Creating an invoice requires 5+ files instead of 1 |
| Swappable infrastructure | Developer cognitive load | Developers must navigate 4 layers for every feature |

---

# Performance Considerations

Clean Architecture adds method call overhead for interface dispatch, mapping between domain entities and Eloquent models, and DTO construction. This is negligible for most applications but can add up in high-throughput endpoints.

Octane compatibility requires careful management—all injected dependencies must be stateless. Domain entities should be immutable or carefully managed.

---

# Production Considerations

**Development speed penalty:** The initial period with Clean Architecture is significantly slower. Developers must create interfaces, DTOs, mappers, and tests for each feature.

**Onboarding cost:** New developers need to understand the four-layer model, the dependency rule, and the mapping patterns before they can contribute effectively.

**Testing strategy:** Unit tests for Domain and Application layers (fast, no Laravel). Integration tests for Infrastructure layer. Feature tests for Presentation layer.

---

# Common Mistakes

**Eloquent models in Domain layer:** The most common violation. Eloquent models extend `Illuminate\Database\Eloquent\Model`, which couples them to Laravel. They belong in Infrastructure.

**Breaking the Dependency Rule:** Application layer code that imports `Illuminate\Http\Request` or `DB::`. This re-introduces framework coupling.

**Over-mapping:** Creating domain entities that are identical copies of Eloquent models. If there's no behavioral difference, the mapping adds cost without value.

---

# Failure Modes

**Architecture paralysis:** The overhead of creating the correct abstractions prevents shipping features. Team productivity drops significantly for 3-6 months.

**Contaminated Domain:** Infrastructure concerns leak into the domain via subtle imports, method signatures, or inherited behavior. Architecture tests catch this.

---

# Ecosystem Usage

Packages like `laravel-clean-architecture` (ElberCanoles) generate the full four-layer structure. The `buckpal` project by thombergs is the canonical reference implementation (Java/Spring). Spatie's `laravel-event-sourcing` package follows Clean Architecture principles internally.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| LAP-01 Three-layer architecture | LAP-04 Dependency Rule | LAP-09 Framework independence |
| DDD tactical patterns | LAP-05 Domain layer | LAP-10 Domain entity mapping |

---

## Research Notes

The layered architecture debate in the Laravel community continues to evolve. Three-layer architecture remains the dominant pattern, with most production Laravel applications implementing a Controller ? Service ? Model stack. Clean Architecture and Hexagonal Architecture adoption is growing but remains niche�most Laravel teams find the overhead of port-adapter separation unnecessary until team sizes exceed 8-10 engineers. The Archidux tool and pestphp/pest-plugin-arch make architectural rule enforcement practical at CI time. Key community voices (Benjamin Crozat, Spatie team, Taylor Otwell) consistently recommend starting with three layers and adding indirection only when specific coupling pain emerges. Laravel 12's continuing minimalism trend makes the framework even more agnostic to architectural choices.
