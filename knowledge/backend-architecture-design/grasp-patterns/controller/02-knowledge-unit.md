# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: GRASP: Creator, Controller, Low Coupling, High Cohesion
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

GRASP Creator, Controller, Low Coupling, and High Cohesion are responsibility assignment patterns that guide object design. Creator assigns creation responsibility based on containment/aggregation. Controller handles system events as the first object beyond UI. Low Coupling minimizes dependency strength between classes. High Cohesion keeps related responsibilities together. Together, these form the foundational design principles for modular, maintainable Laravel applications.

---

## Creator

**Core Concept**: Assign class B the responsibility to create class A if B contains/composites A, records A, closely uses A, or has the data to initialize A.

**In Laravel**: Aggregate roots create their children (`Order` creates `OrderLine`). Factories create complex objects. Repositories create domain objects from data. Controller actions may create DTOs/commands.

| Strength | Guideline |
|----------|-----------|
| Containment | B contains A â†’ B creates A |
| Aggregation | B composites A â†’ B creates A |
| Recording | B records A â†’ B creates A |

**Common Mistake**: Creation logic scattered across unrelated classes. Extract to Factory or Creator class.

---

## Controller

**Core Concept**: The first object beyond the UI layer that receives and coordinates a system operation. Controller interprets UI events, delegates to domain, and returns results.

**In Laravel**: Controllers, CLI commands, and queue handlers are Controllers. They should be thin â€” receive request, delegate to service, return response.

| Purpose | Example | Anti-pattern |
|---------|---------|--------------|
| System operation delegation | `OrderController::store()` | Controller doing all work |
| Use case coordinator | `CheckoutController` | Controller with 20+ methods |

**Common Mistake**: Fat controller with business logic. Move logic to services/actions. Controller only coordinates.

---

## Low Coupling

**Core Concept**: Minimize the number and strength of dependencies between classes. Loosely coupled classes can change independently.

**In Laravel**: Dependency injection reduces coupling. Interface abstractions decouple consumers from implementations. Events decouple producers from listeners.

| Coupling Type | Strength | Example in Laravel |
|---------------|----------|-------------------|
| Content | Strongest | Direct property access on external class |
| Common | Very Strong | Global state, facades in business logic |
| Control | Moderate | Boolean parameter controlling behavior |
| Stamp | Moderate | Fat DTO with unused fields |
| Data | Weakest | Only required parameters |

**Common Mistake**: Injecting many dependencies â†’ high coupling to many services. Consider event-driven decoupling.

---

## High Cohesion

**Core Concept**: Responsibilities within a class should be strongly related and focused. High cohesion means a class does one thing well.

**In Laravel**: Action classes (single purpose), focused services (order service, not mega service), separated event listeners (one per side effect).

| Cohesion Level | Characteristic | Example |
|----------------|----------------|---------|
| Functional | Single purpose | `SendWelcomeEmail` action |
| Sequential | Outputâ†’input chain | Pipeline stages |
| Communicational | Same data operations | Report generator |
| Logical | Category grouping | "All utilities" class |

**Common Mistake**: God classes (fat models, fat services) with low cohesion. Extract responsibilities to dedicated classes.

---

# Related Knowledge Units

**Prerequisites**: OOP, Class design | **Related**: SRP (high cohesion), Information Expert (creator decisions), Hexagonal Architecture (low coupling at scale) | **Advanced**: Coupling metrics measurement, Cohesion metrics, Package coupling vs class coupling

---

# Core Concepts

controller is built on foundational concepts that govern its application in backend architecture.

| Concept | Description | Relevance |
|---------|-------------|-----------|
| Separation of Concerns | Dividing software into distinct features with little overlap | Enables independent development and testing |
| Dependency Management | Controlling how components reference each other | Prevents coupling and circular dependencies |
| Encapsulation | Hiding internal implementation details | Protects invariants and reduces change impact |
| Abstraction | Providing simplified interfaces over complex subsystems | Manages complexity at scale |

In the context of design-patterns-principles, these concepts manifest through specific structural and behavioral rules that guide implementation decisions.

---

# Mental Models

Several mental models help reason about controller effectively:

- **Layered Abstraction**: Think of controller as onion-like layers where inner layers know nothing about outer layers. Each layer provides a level of indirection that simplifies reasoning about the system.
- **Business Capability Mapping**: controller boundaries are best understood by mapping business capabilities — each cohesive business function maps to one architectural unit.
- **Change Containment**: A useful heuristic is "what changes together, belongs together." If two components change for the same reason, they should be in the same unit. If they change for different reasons, they should be separated.
- **Dependency Direction**: Dependencies should point in the direction of stability — more stable components should depend on less stable ones, not the other way around.

---

# Internal Mechanics

The internal mechanics of controller involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other — whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified — through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate — synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to controller:

| Pattern | Purpose | Application in design-patterns-principles |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust controller solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying controller:

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

Common failure modes when applying controller:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for controller concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave — state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for controller implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping — influencing architectural decisions across the ecosystem.

