# Metadata

Domain: Backend Architecture & Design
Subdomain: Architectural Governance
Knowledge Unit: Dependency analysis and modularity metrics
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Dependency analysis measures the relationships between code modules to assess coupling, cohesion, and modularity health. Key metrics include Afferent Coupling (Ce â€” incoming dependencies), Efferent Coupling (Ca â€” outgoing dependencies), Instability (I = Ce / (Ce + Ca)), Abstractness (A = abstract classes / total classes), and the Distance from Main Sequence (D = |A + I - 1|). These metrics enable objective assessment of module quality and early detection of architectural decay. In PHP, tools like Deptrac, PhpMetrics, and PHP Depend provide these measurements.

---

# Key Metrics

| Metric | Formula | What It Measures | Good Range |
|--------|---------|-----------------|------------|
| Afferent Coupling (Ca) | Count of incoming deps | How many modules depend on this module | Low for stable, high for core |
| Efferent Coupling (Ce) | Count of outgoing deps | How many modules this module depends on | Low |
| Instability (I) | Ce / (Ce + Ca) | How likely module is to change | 0 (stable) to 1 (unstable) |
| Abstractness (A) | Abstract / Total | How abstract module is | 0 (concrete) to 1 (abstract) |
| Distance (D) | \|A + I - 1\| | Distance from main sequence | Close to 0 |
| Package Dependency Cycles | N/A | Circular dependencies | None |

---

# Common Violations

- **Instability + Abstraction mismatch**: stable module (I=0) is concrete (A=0) â†’ changes break many dependents
- **Stable dependencies**: instable module depends on unstable module â†’ cascading changes
- **Dependency cycles**: module A â†’ B â†’ A â†’ architectural decay signal
- **Hub-like modules**: one module with very high Ce + Ca â†’ god module

---

# Tooling

| Tool | Function | Usage |
|------|----------|-------|
| Deptrac | Layer enforcement, cycle detection | CI pipeline check |
| PhpMetrics | Full metrics suite, visualization | Team dashboards |
| PHP Depend | Classical metrics (CK metrics) | Historical trend analysis |
| PHPStan | Custom rule enforcement | Per-commit checking |

---

# Common Mistakes

- Measuring metrics without acting on them â†’ "we know our code is bad" without fixing
- Focusing on class-level metrics only â†’ missing module/package level structure
- Ignoring dependency cycles until they're entrenched â†’ hard to break later
- Not setting thresholds â†’ no definition of "good enough"
- Metrics as gate without context â†’ metrics gamed, not improved

---

# Related Knowledge Units

**Prerequisites**: Coupling types, Cohesion types | **Related**: Architecture fitness functions (automate metrics), Coupling measurement techniques, Cohesion measurement techniques | **Advanced**: Dependency structure matrix (DSM), Package principles (REP, CCP, CRP), Modularity assessment frameworks

---

# Core Concepts

dependency-analysis-modularity is built on foundational concepts that govern its application in backend architecture.

| Concept | Description | Relevance |
|---------|-------------|-----------|
| Separation of Concerns | Dividing software into distinct features with little overlap | Enables independent development and testing |
| Dependency Management | Controlling how components reference each other | Prevents coupling and circular dependencies |
| Encapsulation | Hiding internal implementation details | Protects invariants and reduces change impact |
| Abstraction | Providing simplified interfaces over complex subsystems | Manages complexity at scale |

In the context of architectural-governance, these concepts manifest through specific structural and behavioral rules that guide implementation decisions.

---

# Mental Models

Several mental models help reason about dependency-analysis-modularity effectively:

- **Layered Abstraction**: Think of dependency-analysis-modularity as onion-like layers where inner layers know nothing about outer layers. Each layer provides a level of indirection that simplifies reasoning about the system.
- **Business Capability Mapping**: dependency-analysis-modularity boundaries are best understood by mapping business capabilities — each cohesive business function maps to one architectural unit.
- **Change Containment**: A useful heuristic is "what changes together, belongs together." If two components change for the same reason, they should be in the same unit. If they change for different reasons, they should be separated.
- **Dependency Direction**: Dependencies should point in the direction of stability — more stable components should depend on less stable ones, not the other way around.

---

# Internal Mechanics

The internal mechanics of dependency-analysis-modularity involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other — whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified — through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate — synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to dependency-analysis-modularity:

| Pattern | Purpose | Application in architectural-governance |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust dependency-analysis-modularity solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying dependency-analysis-modularity:

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

Common failure modes when applying dependency-analysis-modularity:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for dependency-analysis-modularity concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave — state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for dependency-analysis-modularity implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping — influencing architectural decisions across the ecosystem.

