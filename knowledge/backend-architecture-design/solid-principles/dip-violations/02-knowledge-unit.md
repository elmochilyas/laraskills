# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: SOLID principles in PHP: DIP violations
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Dependency Inversion Principle states that high-level modules should not depend on low-level modules; both should depend on abstractions. Furthermore, abstractions should not depend on details; details should depend on abstractions. In Laravel, DIP violations include Eloquent model dependencies in domain services, direct third-party SDK usage, static method calls (`::`) to infrastructure, and facades in business logic. The correction involves depending on interfaces owned by the high-level module, with concrete implementations injected via the container.

---

# Core Concepts

- High-level policy: business logic should not depend on infrastructure
- Abstraction ownership: interfaces belong to the high-level module (caller defines the contract)
- Dependency injection: abstractions injected, not created internally
- Inversion of control: high-level calls abstractions, not low-level implementations
- Dependency rule: source code dependencies point inward (in layered architectures)

---

# Mental Models

- **Plugin System**: Application defines plugin interface, plugins implement it (not the other way)
- **Power Socket**: Appliance defines plug shape, wall socket conforms
- **Vehicle Control**: Driver uses steering wheel interface, not direct access to wheels

---

# Common Laravel DIP Violations

- Service class depending directly on Eloquent Model → `new User()` or `User::find()`
- Direct third-party SDK calls in business logic → new `Stripe\Charge()` in service
- Static method calls to facades → `Cache::remember()` in domain service
- `app()` calls inside business classes → service locator anti-pattern
- Creating dependencies with `new` in constructors/methods → hard-coded coupling
- Eloquent model extending base model (acceptable) but depending on Eloquent in domain (not acceptable)

---

# Detection

- `use` statements pointing to infrastructure packages in domain classes
- Constructor injection of concrete Eloquent Model classes
- Static calls to facades in domain logic
- `new` keyword creating infrastructure objects in business methods
- `app()` or `resolve()` calls in business classes
- Domain class that cannot be instantiated without database connection

---

# Correction Strategies

- Inject interfaces, not concrete implementations
- Interface ownership: define the abstraction in the domain layer, implement in infrastructure
- Repository pattern: domain depends on `UserRepositoryInterface`, infrastructure implements it
- Action classes: use case classes depend on abstractions only
- Anti-corruption layer: isolate third-party SDKs behind domain-owned interfaces
- Constructor injection over service location

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Domain is framework-independent | More interfaces and wiring | Increased complexity for simple apps |
| Infrastructure swappable (cache, DB, mail) | Must maintain interface compatibility | Interface evolution costs |
| Testable without infrastructure | Test doubles for all abstractions | More test infrastructure |
| Clear dependency direction | Design must consider dependency boundaries | Upfront architectural decisions |

---

# Performance Considerations

- DIP adds interface method dispatch (negligible)
- Repository pattern adds mapping overhead between domain and ORM
- Anti-corruption layer adds translation cost
- Dependency injection container adds resolution overhead (first call)
- No significant performance penalty when amortized across request

---

# Production Considerations

- Don't apply DIP to simple CRUD apps without infrastructure variation needs
- DIP strictness varies by layer: domain strict, application moderate, infrastructure flexible
- Octane: dependencies held in container — ensure injected services are scoped correctly
- Over-abstraction is the main risk: not everything needs an interface

---

# Common Mistakes

- Creating interfaces for every class → over-abstraction (YAGNI)
- Interface owned by infrastructure layer → still violates DIP (high-level depends on low-level abstraction)
- Domain layer depending on Laravel contracts → `Illuminate\Contracts` is still a framework dependency
- Constructor injection of primitives (strings, ints) → use value objects or config objects
- DIP only at service layer but not at presentation layer → controllers still depend on concrete services

---

# Related Knowledge Units

**Prerequisites**: Dependency injection, Interface design | **Related**: Hexagonal Architecture (DIP at architectural scale), Repository pattern (DIP for persistence), Anti-corruption layer (DIP for external systems) | **Advanced**: Interface ownership guidelines, Abstractions vs concrete class injection, DIP in layered vs hexagonal architecture

---

# Internal Mechanics

The internal mechanics of dip-violations involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other � whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified � through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate � synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to dip-violations:

| Pattern | Purpose | Application in design-patterns-principles |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust dip-violations solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying dip-violations:

| Decision | Option A | Option B | Recommendation |
|----------|----------|----------|----------------|
| Boundary granularity | Fine-grained | Coarse-grained | Start coarse, refine with evidence |
| Communication style | Synchronous | Asynchronous | Prefer async for cross-boundary communication |
| State ownership | Shared state | Isolated state | Isolated state per boundary |
| Enforcement mechanism | Convention | Automation (CI, static analysis) | Automate what matters, document the rest |
| Abstraction depth | Shallow (direct) | Deep (multi-layer) | Shallow until complexity demands depth |

---

# Failure Modes

Common failure modes when applying dip-violations:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for dip-violations concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave � state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for dip-violations implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

