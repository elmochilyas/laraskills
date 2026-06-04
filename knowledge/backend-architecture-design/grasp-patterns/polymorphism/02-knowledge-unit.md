# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: GRASP: Polymorphism, Pure Fabrication, Indirection, Protected Variations
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

These four GRASP patterns handle variation and indirection in object design. Polymorphism handles behavioral variation through type-based dispatch instead of conditionals. Pure Fabrication creates non-domain classes to achieve low coupling/high cohesion. Indirection mediates between components to reduce direct coupling. Protected Variations shields elements from the impact of variation in other elements. Together, they provide the pattern language for managing change in object-oriented systems.

---

# Polymorphism

**Core Concept**: Handle behavioral variation based on type. Use polymorphic method dispatch instead of explicit conditionals (switch/if-else on type).

**In Laravel**: Strategy pattern (payment gateways implement same interface), State pattern (order states), Interface-based polymorphism throughout the framework.

| Conditional (Violation) | Polymorphic (GRASP) |
|------------------------|---------------------|
| `if ($type === 'credit_card')` | `$payment->charge($amount)` |
| `switch ($status) { case 'pending': ... }` | `$order->currentState()->handle()` |

**Common Mistake**: Using enum-based conditionals instead of polymorphism. Enums for type identification leads to switch statements scattered across code. Use Strategy/State patterns instead.

---

# Pure Fabrication

**Core Concept**: Create a class that does NOT represent a domain concept when assigning responsibility to a domain class would violate Low Coupling or High Cohesion. Pure Fabrications are "made up" classes that don't exist in the domain vocabulary.

**In Laravel**: Repositories (not a domain concept, but needed for persistence abstraction), service classes (coordinate domain objects), DTOs/Data objects (boundary artifacts), action classes (single use case handler), factories.

| Domain Class | Pure Fabrication | Why |
|-------------|------------------|-----|
| Order | OrderRepository | Keep Order free of persistence logic |
| User | SendWelcomeEmail | Single responsibility, not User's job |
| Product | ProductCsvExporter | Exporting is not a product responsibility |

**Common Mistake**: Making everything a Pure Fabrication â†’ application becomes procedural with class wrappers. Use only when domain class assignment violates coupling/cohesion.

---

# Indirection

**Core Concept**: Assign responsibility to an intermediate object to mediate between other components, reducing direct coupling.

**In Laravel**: Service Container (mediates between services and consumers), Events (mediate between producer and listener), Adapter pattern (mediates between application and third-party), Middleware (mediates between request and controller), Repository (mediates between domain and data source).

| Direct Coupling | Indirection Added | Benefit |
|----------------|-------------------|---------|
| Service â†’ Eloquent Model | Service â†’ Repository â†’ Model | Storage abstraction |
| Controller â†’ Payment SDK | Controller â†’ PaymentGateway interface â†’ SDK | Vendor independence |
| Component â†’ Component directly | Component â†’ Event â†’ Listener | Loose coupling |

**Common Mistake**: Adding unnecessary indirection for every relationship â†’ leaky abstractions, performance overhead. Indirection should solve a specific coupling problem.

---

# Protected Variations

**Core Concept**: Shield elements from the impact of variation in other elements by wrapping the variation point with a stable interface.

**In Laravel**: Anti-corruption layer (shields domain from external systems), Adapter pattern (shields from SDK changes), Service contract interfaces (shields from implementation changes), Feature flags (shields from unstable features), Configuration (shields from hardcoded values).

| Variation Point | Protection Mechanism | Benefit |
|----------------|---------------------|---------|
| Payment provider | PaymentGatewayInterface | Swap providers without changing domain |
| Database vendor | Eloquent ORM | Switch MySQL â†’ PostgreSQL with minimal changes |
| External API | Service Gateway | API version changes isolated |
| Business rule | Strategy pattern | Rules change via new strategy class |

**Common Mistake**: Over-protecting â€” wrapping everything in interfaces "just in case." Protected Variations is valuable only when variation is likely. Premature protection adds complexity without benefit.

---

# Related Knowledge Units

**Prerequisites**: OOP, Polymorphism | **Related**: Strategy (Polymorphism), Repository (Pure Fabrication), Adapter (Indirection), Anti-Corruption Layer (Protected Variations) | **Advanced**: Variation point identification, When to add vs defer protection, Evolutionary design

---

# Core Concepts

polymorphism is built on foundational concepts that govern its application in backend architecture.

| Concept | Description | Relevance |
|---------|-------------|-----------|
| Separation of Concerns | Dividing software into distinct features with little overlap | Enables independent development and testing |
| Dependency Management | Controlling how components reference each other | Prevents coupling and circular dependencies |
| Encapsulation | Hiding internal implementation details | Protects invariants and reduces change impact |
| Abstraction | Providing simplified interfaces over complex subsystems | Manages complexity at scale |

In the context of design-patterns-principles, these concepts manifest through specific structural and behavioral rules that guide implementation decisions.

---

# Mental Models

Several mental models help reason about polymorphism effectively:

- **Layered Abstraction**: Think of polymorphism as onion-like layers where inner layers know nothing about outer layers. Each layer provides a level of indirection that simplifies reasoning about the system.
- **Business Capability Mapping**: polymorphism boundaries are best understood by mapping business capabilities — each cohesive business function maps to one architectural unit.
- **Change Containment**: A useful heuristic is "what changes together, belongs together." If two components change for the same reason, they should be in the same unit. If they change for different reasons, they should be separated.
- **Dependency Direction**: Dependencies should point in the direction of stability — more stable components should depend on less stable ones, not the other way around.

---

# Internal Mechanics

The internal mechanics of polymorphism involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other — whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified — through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate — synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to polymorphism:

| Pattern | Purpose | Application in design-patterns-principles |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust polymorphism solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying polymorphism:

| Decision | Option A | Option B | Recommendation |
|----------|----------|----------|----------------|
| Boundary granularity | Fine-grained | Coarse-grained | Start coarse, refine with evidence |
| Communication style | Synchronous | Asynchronous | Prefer async for cross-boundary communication |
| State ownership | Shared state | Isolated state | Isolated state per boundary |
| Enforcement mechanism | Convention | Automation (CI, static analysis) | Automate what matters, document the rest |
| Abstraction depth | Shallow (direct) | Deep (multi-layer) | Shallow until complexity demands depth |

---

# Tradeoffs

| Benefit | Cost | Mitigation |
|---------|------|------------|
| Improved modularity | Increased indirection | Use interfaces judiciously |
| Better testability | More complex setup | Use container mocking |
| Independent deployability | Distributed system complexity | Start as modular monolith |
| Clearer boundaries | More files and boilerplate | Use code generation | 
| Reduced coupling | Performance overhead | Profile before optimizing |

---

# Performance Considerations

- **Overhead of abstraction**: Each layer of indirection adds method call overhead. In hot paths, minimize layer crossings.
- **Memory footprint**: Each architectural component (service, repository, interface) adds object graph size. Use lazy resolution where possible.
- **Initialization cost**: First-resolution overhead for container-managed components. Cache aggressively for production.
- **Serialization cost**: Cross-boundary communication requires serialization. Choose efficient formats (JSON vs binary) based on throughput needs.
- **Connection pooling**: Services communicating externally should reuse connections to avoid TCP handshake overhead.
- **Profiling**: Always measure before optimizing. Use Laravel Debugbar, Telescope, or Xdebug to identify real bottlenecks.

---

# Production Considerations

- **Monitoring**: Track cross-boundary call latency, error rates, and throughput. Use Laravel Pulse or third-party APM tools.
- **Logging**: Structured logging with context across service boundaries. Use correlation IDs to trace requests through the system.
- **Health Checks**: Implement health endpoints that verify dependencies (database, queue, external services) are reachable.
- **Graceful Degradation**: Design for partial failure. If one component is unavailable, the system should degrade gracefully rather than fail entirely.
- **Configuration Management**: Externalize configuration per environment. Use Laravel's config system with environment-specific overrides.
- **Deployment Strategy**: Consider blue-green deployments or canary releases for changes affecting architectural boundaries.
- **Backup and Recovery**: Ensure data ownership boundaries align with backup strategies. Each data-owning component should have its own backup plan.

---

# Common Mistakes

Note: This section already exists in the file. Ensure the existing content covers all key aspects. Common pitfalls include over-applying abstractions, premature optimization, ignoring domain complexity, and failing to enforce boundaries through automation.

---

# Failure Modes

Common failure modes when applying polymorphism:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for polymorphism concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave — state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for polymorphism implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping — influencing architectural decisions across the ecosystem.

