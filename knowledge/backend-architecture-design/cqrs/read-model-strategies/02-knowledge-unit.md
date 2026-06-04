# Metadata

Domain: Backend Architecture & Design
Subdomain: Command Query Separation
Knowledge Unit: Read model strategies (denormalized tables, materialized views, in-memory)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Read models are data structures optimized for specific query patterns, separate from write models. Strategies range from in-memory transformations (simplest) through denormalized database tables to materialized views and full-text indexes. The choice depends on read volume, data staleness tolerance, and infrastructure complexity tolerance. In Laravel, Eloquent API Resources and Spatie Data can serve as lightweight read models; full denormalization requires projection infrastructure.

---

# Strategies

| Strategy | Consistency | Complexity | Best For |
|----------|-------------|------------|----------|
| In-memory transformation | Immediate | Low | Simple reads, low volume |
| Eloquent with select/with | Immediate | Low | Most API reads |
| View (DB view) | Immediate | Low | SQL-level aggregation |
| Denormalized table | Near-real-time | Medium | High read volume, multiple sources |
| Materialized view | Refresh-based | Medium | Heavy aggregation, batch refresh |
| Cached read model | TTL/invalidation | Medium | Read-heavy, slow-changing data |
| Full-text index | Near-real-time | High | Search-heavy applications |
| Event-sourced projection | Eventually consistent | High | Temporal queries, audit trails |

---

# Decision Framework

| Criteria | In-Memory | Denormalized | Event-Sourced |
|----------|-----------|--------------|---------------|
| Read volume | Low | High | High |
| Data freshness | Immediate | Near-real-time | Eventually consistent |
| Query complexity | Simple | Complex joins pre-resolved | Arbitrary |
| Infrastructure cost | None | Moderate | High |
| Development cost | Low | Moderate | High |

---

# Common Mistakes

- Denormalizing when in-memory transformation suffices â†’ data duplication management
- Event-sourced projections for simple dashboards â†’ overengineering
- No read model at all â†’ write-optimized schema for complex reads â†’ slow queries
- Stale read model without refresh mechanism â†’ users see outdated data
- Cached read model without invalidation â†’ stale data persists

---

# Related Knowledge Units

**Prerequisites**: CQRS, Database design | **Related**: Event sourcing projections, Cache strategies, Eloquent API Resources | **Advanced**: Eventual consistency handling, Read model rebuild strategies, Projection idempotency

---

# Core Concepts

read-model-strategies is built on foundational concepts that govern its application in backend architecture.

| Concept | Description | Relevance |
|---------|-------------|-----------|
| Separation of Concerns | Dividing software into distinct features with little overlap | Enables independent development and testing |
| Dependency Management | Controlling how components reference each other | Prevents coupling and circular dependencies |
| Encapsulation | Hiding internal implementation details | Protects invariants and reduces change impact |
| Abstraction | Providing simplified interfaces over complex subsystems | Manages complexity at scale |

In the context of command-query-separation, these concepts manifest through specific structural and behavioral rules that guide implementation decisions.

---

# Mental Models

Several mental models help reason about read-model-strategies effectively:

- **Layered Abstraction**: Think of read-model-strategies as onion-like layers where inner layers know nothing about outer layers. Each layer provides a level of indirection that simplifies reasoning about the system.
- **Business Capability Mapping**: read-model-strategies boundaries are best understood by mapping business capabilities — each cohesive business function maps to one architectural unit.
- **Change Containment**: A useful heuristic is "what changes together, belongs together." If two components change for the same reason, they should be in the same unit. If they change for different reasons, they should be separated.
- **Dependency Direction**: Dependencies should point in the direction of stability — more stable components should depend on less stable ones, not the other way around.

---

# Internal Mechanics

The internal mechanics of read-model-strategies involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other — whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified — through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate — synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to read-model-strategies:

| Pattern | Purpose | Application in command-query-separation |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust read-model-strategies solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying read-model-strategies:

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

Common failure modes when applying read-model-strategies:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for read-model-strategies concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave — state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for read-model-strategies implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping — influencing architectural decisions across the ecosystem.

