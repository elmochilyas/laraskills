# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: GRASP: Information Expert
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Information Expert assigns responsibility to the class that has the information needed to fulfill it â€” the class with the most relevant data should perform operations on that data. This is the foundational principle for building rich domain models over anemic ones. In Laravel, Information Expert guides whether logic belongs in a model (has data) vs a service (coordinates operations across models). When a model has the data and the operation only concerns that data, the method belongs on the model.

---

# Core Concepts

- Responsibility assignment: who should do this work?
- Data locality: class with the data does the operation
- High cohesion: operations live near the data they operate on
- Information distribution: don't pull data out of objects to process elsewhere
- Encapsulation: data behavior stays with data

---

# Mental Models

- **Accountant**: Person who has the financial records does the calculations
- **Surgery**: Surgeon with the patient's information makes the incision
- **Owner**: Person who owns the house decides on renovations

---

# Detection

- Service class pulling data from models, processing it, then storing results â†’ logic should be on model
- Getter followed by if/else in service â†’ condition belongs on model
- `if ($order->status === 'pending')` in controller â†’ belongs on Order
- Transaction Script extracting data for validation â†’ validation belongs on model/value object

---

# Correction

- Move methods to the class that has the data
- `$order->isPending()` instead of `$order->status === 'pending'`
- `$product->isInStock($quantity)` instead of checking inventory in service
- `$user->canApprove()` instead of permission check in controller

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Logic lives near data | Model can grow large | Must balance with SRP |
| Encapsulation preserved | Sometimes data is in multiple places | May need domain service |
| Natural OOP design | Eloquent models become more than persistence | ActiveRecord vs Domain Model tension |

---

# Related Knowledge Units

**Prerequisites**: Encapsulation, OOP basics | **Related**: GRASP Creator, Controller, Pure Fabrication (when no natural Expert exists) | **Advanced**: Expert vs Service Layer, Rich domain models, Encapsulation boundaries

---

# Internal Mechanics

The internal mechanics of information-expert involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other — whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified — through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate — synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to information-expert:

| Pattern | Purpose | Application in design-patterns-principles |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust information-expert solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying information-expert:

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

# Common Mistakes

Note: This section already exists in the file. Ensure the existing content covers all key aspects. Common pitfalls include over-applying abstractions, premature optimization, ignoring domain complexity, and failing to enforce boundaries through automation.

---

# Failure Modes

Common failure modes when applying information-expert:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for information-expert concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave — state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for information-expert implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping — influencing architectural decisions across the ecosystem.

