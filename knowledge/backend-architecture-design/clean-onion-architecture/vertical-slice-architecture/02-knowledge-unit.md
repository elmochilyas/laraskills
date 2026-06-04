# Metadata

Domain: Backend Architecture & Design
Subdomain: Architectural Styles
Knowledge Unit: Vertical Slice Architecture as emerging alternative
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Vertical Slice Architecture organizes code by feature/use case rather than by technical layer. Each "slice" contains all layers needed for one feature — controller, request, service, model, view — creating vertical stacks through the system. This contrasts with layered architecture (horizontal layers for all features). Slices are independent, allowing each to use its own patterns without affecting others. The pattern is gaining traction in PHP/Laravel (2024-2026) for its pragmatic alignment with feature teams and its tolerance of controlled duplication.

---

# Core Concepts

- Feature-based organization: one slice per feature/use case
- Self-contained: each slice has its own request, handler, model queries
- Controlled duplication: similar logic across slices is tolerated (not prematurely abstracted)
- No shared service layer: services are slice-specific unless proven necessary
- Communication: slices communicate via shared kernel (VOs, events) or dedicated interfaces

---

# Structure (Laravel)

```
app/
├── Features/
│   ├── CreateOrder/
│   │   ├── CreateOrderRequest.php
│   │   ├── CreateOrderController.php
│   │   ├── CreateOrderHandler.php
│   │   └── create-order.blade.php
│   ├── CancelOrder/
│   │   ├── CancelOrderRequest.php
│   │   ├── CancelOrderController.php
│   │   ├── CancelOrderHandler.php
│   │   └── Models/
│   │       └── CancelOrderModel.php (scope-specific)
│   └── ShipOrder/
└── Shared/
    ├── Domain/ (VOs, domain events)
    └── Kernel/ (base types, helpers)
```

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| High cohesion per feature | Potential code duplication | Duplication before abstraction is acceptable |
| Independent evolution per slice | Cross-slice changes harder | Need shared kernel for common operations |
| Feature team autonomy | No global layer patterns | Each slice may use different patterns |
| Easy to add new features | Harder to see system-wide patterns | Architecture emerges, not prescribed |
| Replaces layered/horizontal organization | Fights framework conventions | Laravel's default is layered, not sliced |

---

# Common Mistakes

- Premature abstraction across slices → creating shared service layer anyway (returns to layered)
- No shared kernel at all → inconsistent value objects, duplicate VOs
- Slices too granular → one slice per HTTP method, not per feature
- Slices too coarse → entire module in one slice (should be split)
- Communication between slices via shared database → tight coupling
- Importing from other slice's internal code → slice boundary violation

---

# Related Knowledge Units

**Prerequisites**: Feature organization, Layered architecture | **Related**: Modular monolith (horizontal vs vertical split), Domain modules, Feature-based development | **Advanced**: Slice communication patterns, Duplication tolerance, Emergent architecture

---

# Mental Models

Several mental models help reason about vertical-slice-architecture effectively:

- **Layered Abstraction**: Think of vertical-slice-architecture as onion-like layers where inner layers know nothing about outer layers. Each layer provides a level of indirection that simplifies reasoning about the system.
- **Business Capability Mapping**: vertical-slice-architecture boundaries are best understood by mapping business capabilities � each cohesive business function maps to one architectural unit.
- **Change Containment**: A useful heuristic is "what changes together, belongs together." If two components change for the same reason, they should be in the same unit. If they change for different reasons, they should be separated.
- **Dependency Direction**: Dependencies should point in the direction of stability � more stable components should depend on less stable ones, not the other way around.

---

# Internal Mechanics

The internal mechanics of vertical-slice-architecture involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other � whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified � through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate � synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to vertical-slice-architecture:

| Pattern | Purpose | Application in architectural-styles |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust vertical-slice-architecture solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying vertical-slice-architecture:

| Decision | Option A | Option B | Recommendation |
|----------|----------|----------|----------------|
| Boundary granularity | Fine-grained | Coarse-grained | Start coarse, refine with evidence |
| Communication style | Synchronous | Asynchronous | Prefer async for cross-boundary communication |
| State ownership | Shared state | Isolated state | Isolated state per boundary |
| Enforcement mechanism | Convention | Automation (CI, static analysis) | Automate what matters, document the rest |
| Abstraction depth | Shallow (direct) | Deep (multi-layer) | Shallow until complexity demands depth |

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

Common failure modes when applying vertical-slice-architecture:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for vertical-slice-architecture concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave � state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for vertical-slice-architecture implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

