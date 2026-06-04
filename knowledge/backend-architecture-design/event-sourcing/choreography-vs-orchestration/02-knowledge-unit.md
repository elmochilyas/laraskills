# Metadata

Domain: Backend Architecture & Design
Subdomain: Event-Driven Architecture
Knowledge Unit: Choreography vs orchestration in event-driven systems
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Choreography and orchestration are two patterns for coordinating distributed transactions/workflows. Choreography uses events: each service reacts to events and emits its own, forming a decentralized workflow. Orchestration uses a central coordinator (orchestrator/saga) that tells each service what to do. Choreography scales better but is harder to trace; orchestration is more maintainable but creates a central coordination point. In Laravel, choreography maps to event listeners; orchestration maps to command/workflow sagas.

---

# Comparison

| Characteristic | Choreography | Orchestration |
|---------------|--------------|---------------|
| Coordination | Decentralized (events) | Centralized (coordinator) |
| Traceability | Hard (follow event chain) | Easy (one coordinator to trace) |
| Coupling | Low (services know events only) | Higher (services know coordinator) |
| State management | Distributed across services | Centralized in coordinator |
| Fault handling | Compensating events | Coordinator manages rollback |
| Complexity | Can create circular event chains | More code upfront |
| Scale | Better (no single bottleneck) | Coordinator can be bottleneck |

---

# Decision Framework

| Use Choreography | Use Orchestration |
|-----------------|-------------------|
| Simple, linear workflows | Complex, branching workflows |
| Many services involved | Few services |
| Low coupling priority | Traceability priority |
| Team autonomy valued | Central control valued |
| Event-driven architecture existing | Command-driven architecture existing |

---

# Choreography Risks

- Circular event chains: A emits event â†’ B emits event â†’ A reacts to B's event â†’ infinite loop
- Event tracking: hard to determine which service is behind in processing
- Debugging distributed flows: requires distributed tracing (OpenTelemetry)
- Implicit workflows: workflow logic spread across listener code

---

# Orchestration Risks

- Coordinator becomes god service: knows too much about every step
- Coordinator bottleneck: all workflow decisions through one service
- Coordinator state management: must persist and recover saga state
- Reduced autonomy: services defer to coordinator for "what to do next"

---

# Common Mistakes

- Choreography with circular event dependencies â†’ event storms
- Orchestration for simple 2-step flows â†’ unnecessary overhead
- No saga recovery in orchestration â†’ coordinator crash loses workflow state
- Mixing both inconsistently â†’ hard to understand coordination model
- Assuming choreography is "free" â†’ implicit workflows are hard to maintain

---

# Related Knowledge Units

**Prerequisites**: Event-driven architecture, Distributed systems | **Related**: Saga pattern (orchestration implementation), Event storming (design choreography), Distributed tracing | **Advanced**: Saga execution coordinators, Compensation strategies, Event choreography monitoring

---

# Core Concepts

choreography-vs-orchestration is built on foundational concepts that govern its application in backend architecture.

| Concept | Description | Relevance |
|---------|-------------|-----------|
| Separation of Concerns | Dividing software into distinct features with little overlap | Enables independent development and testing |
| Dependency Management | Controlling how components reference each other | Prevents coupling and circular dependencies |
| Encapsulation | Hiding internal implementation details | Protects invariants and reduces change impact |
| Abstraction | Providing simplified interfaces over complex subsystems | Manages complexity at scale |

In the context of event-driven-architecture, these concepts manifest through specific structural and behavioral rules that guide implementation decisions.

---

# Mental Models

Several mental models help reason about choreography-vs-orchestration effectively:

- **Layered Abstraction**: Think of choreography-vs-orchestration as onion-like layers where inner layers know nothing about outer layers. Each layer provides a level of indirection that simplifies reasoning about the system.
- **Business Capability Mapping**: choreography-vs-orchestration boundaries are best understood by mapping business capabilities — each cohesive business function maps to one architectural unit.
- **Change Containment**: A useful heuristic is "what changes together, belongs together." If two components change for the same reason, they should be in the same unit. If they change for different reasons, they should be separated.
- **Dependency Direction**: Dependencies should point in the direction of stability — more stable components should depend on less stable ones, not the other way around.

---

# Internal Mechanics

The internal mechanics of choreography-vs-orchestration involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other — whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified — through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate — synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to choreography-vs-orchestration:

| Pattern | Purpose | Application in event-driven-architecture |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust choreography-vs-orchestration solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying choreography-vs-orchestration:

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

Common failure modes when applying choreography-vs-orchestration:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for choreography-vs-orchestration concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave — state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for choreography-vs-orchestration implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping — influencing architectural decisions across the ecosystem.

