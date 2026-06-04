# Metadata

Domain: Backend Architecture & Design
Subdomain: Architectural Styles
Knowledge Unit: Layered architecture comparative analysis
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Layered architecture organizes code into horizontal layers (presentation â†’ application â†’ domain â†’ infrastructure), where each layer depends on the layer below. It is the default architecture for most Laravel applications. Compared to Hexagonal/Clean, layered architecture is simpler but allows more coupling â€” layers often skip or leak across boundaries. In Laravel, the standard structure (controllers â†’ services â†’ models) is a layered architecture with varying degrees of layer discipline.

---

# Layer Structure

| Layer | Laravel Component | Responsibility |
|-------|------------------|----------------|
| Presentation | Controllers, Views, Blade | HTTP handling, UI rendering |
| Application | Services, Actions, Form Requests | Use case coordination |
| Domain | Eloquent Models (when rich), Domain Services | Business rules (varying) |
| Infrastructure | Repositories, Mail, Queue, Cache | External system access |

---

# Common Violations

- Presentation calling Infrastructure directly â†’ Controller uses Eloquent directly
- Domain depending on Infrastructure â†’ Model calls Mail facade
- Layer skipping â†’ View calls Eloquent directly (Blade `App\Models\User::find()`)
- No clear layer boundaries â†’ business logic in controllers, database in views
- God layer: Infrastructure layer used everywhere â†’ no isolation

---

# Comparison with Hexagonal/Clean

| Aspect | Layered | Hexagonal/Clean |
|--------|---------|-----------------|
| Complexity | Lower | Higher |
| Layer isolation | Porous | Strict |
| Framework binding | Tight | Loose |
| Testability | Moderate | High |
| Team learning curve | Low | High |
| Refactoring safety | Lower | Higher |

---

# Decision

- Layered for: most Laravel applications, CRUD-heavy, small-medium teams
- Hexagonal/Clean for: complex domains, long-lived applications, framework independence needed
- Evolution path: start layered with discipline, isolate domain as complexity grows

---

# Common Mistakes

- Believing layered architecture prevents coupling (it requires discipline, not enforcement)
- Not enforcing layer dependencies (no static analysis for layer violations)
- Layer skipping as "shortcut" â†’ shortcuts become permanent patterns
- No domain layer: services are Transaction Scripts, no business object model
- Infrastructure in every layer: Eloquent models used throughout all layers

---

# Related Knowledge Units

**Prerequisites**: Separation of concerns | **Related**: Hexagonal (strict boundary alternative), Vertical Slice (cross-cutting alternative), Layer enforcement via static analysis | **Advanced**: Layer dependency graphs, Migration from layered to hexagonal

---

# Core Concepts

layered-architecture is built on foundational concepts that govern its application in backend architecture.

| Concept | Description | Relevance |
|---------|-------------|-----------|
| Separation of Concerns | Dividing software into distinct features with little overlap | Enables independent development and testing |
| Dependency Management | Controlling how components reference each other | Prevents coupling and circular dependencies |
| Encapsulation | Hiding internal implementation details | Protects invariants and reduces change impact |
| Abstraction | Providing simplified interfaces over complex subsystems | Manages complexity at scale |

In the context of architectural-styles, these concepts manifest through specific structural and behavioral rules that guide implementation decisions.

---

# Mental Models

Several mental models help reason about layered-architecture effectively:

- **Layered Abstraction**: Think of layered-architecture as onion-like layers where inner layers know nothing about outer layers. Each layer provides a level of indirection that simplifies reasoning about the system.
- **Business Capability Mapping**: layered-architecture boundaries are best understood by mapping business capabilities — each cohesive business function maps to one architectural unit.
- **Change Containment**: A useful heuristic is "what changes together, belongs together." If two components change for the same reason, they should be in the same unit. If they change for different reasons, they should be separated.
- **Dependency Direction**: Dependencies should point in the direction of stability — more stable components should depend on less stable ones, not the other way around.

---

# Internal Mechanics

The internal mechanics of layered-architecture involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other — whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified — through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate — synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to layered-architecture:

| Pattern | Purpose | Application in architectural-styles |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust layered-architecture solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying layered-architecture:

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

# Failure Modes

Common failure modes when applying layered-architecture:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for layered-architecture concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave — state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for layered-architecture implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping — influencing architectural decisions across the ecosystem.

