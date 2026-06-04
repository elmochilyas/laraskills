# Metadata

Domain: Backend Architecture & Design
Subdomain: Event-Driven Architecture
Knowledge Unit: Dead letter handling for failed projections
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Dead letter queue (DLQ) stores events that consumers/projections failed to process, preventing message loss while allowing investigation and retry. In event sourcing, failed projections can cause read models to diverge from event history. Dead letter handling provides: retry policies, manual intervention workflows, monitoring/alerting, and projection rebuild capability. Without DLQ, failed events are silently lost, corrupting read model integrity.

---

# Core Concepts

- Dead letter: event that repeatedly fails processing
- Retry policy: immediate retry, exponential backoff, max retries
- Manual intervention: inspect, fix cause, replay event
- DLQ monitoring: alert on dead letter growth
- Projection rebuild: re-run projection from event stream start
- Divergence detection: compare projection state with event replay

---

# Retry Strategies

| Strategy | Behavior | Best For |
|----------|----------|----------|
| Immediate retry | Retry 3x immediately | Transient failures (network, deadlock) |
| Exponential backoff | Increasing wait between retries | Rate limits, resource contention |
| Circuit breaker | Stop retrying after threshold | Persistent failures (schema mismatch) |
| Manual retry | Move to DLQ for human inspection | Business logic errors, validation failures |

---

# Common Mistakes

- No retry limit â†’ infinite retries on permanent failure â†’ resource exhaustion
- No DLQ â†’ failed events silently dropped â†’ projection gets out of sync
- No alerting on DLQ growth â†’ projection divergence undetected
- Replaying events without idempotency â†’ duplicate side effects
- Same retry strategy for all failure types â†’ transient vs permanent handled identically
- Deleting dead letters instead of investigating â†’ root cause never fixed

---

# Production Considerations

- Monitor DLQ size and growth rate with alerts
- Log failed event payload + exception for debugging
- Provide admin UI for manual replay of dead letters
- Schedule automatic DLQ cleanup for poison events (can't be processed)
- Test projection rebuild from scratch: can you rebuild from event stream?
- Maintain event stream for full projection rebuild capacity

---

# Related Knowledge Units

**Prerequisites**: Event sourcing projections, Message queuing | **Related**: Outbox pattern, Retry strategies, Idempotent consumers, Projection rebuild | **Advanced**: Poison message handling, Circuit breaker patterns, DLQ architectures

---

# Mental Models

Several mental models help reason about dead-letter-handling effectively:

- **Layered Abstraction**: Think of dead-letter-handling as onion-like layers where inner layers know nothing about outer layers. Each layer provides a level of indirection that simplifies reasoning about the system.
- **Business Capability Mapping**: dead-letter-handling boundaries are best understood by mapping business capabilities — each cohesive business function maps to one architectural unit.
- **Change Containment**: A useful heuristic is "what changes together, belongs together." If two components change for the same reason, they should be in the same unit. If they change for different reasons, they should be separated.
- **Dependency Direction**: Dependencies should point in the direction of stability — more stable components should depend on less stable ones, not the other way around.

---

# Internal Mechanics

The internal mechanics of dead-letter-handling involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other — whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified — through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate — synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to dead-letter-handling:

| Pattern | Purpose | Application in event-driven-architecture |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust dead-letter-handling solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying dead-letter-handling:

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

# Failure Modes

Common failure modes when applying dead-letter-handling:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for dead-letter-handling concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave — state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for dead-letter-handling implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping — influencing architectural decisions across the ecosystem.

