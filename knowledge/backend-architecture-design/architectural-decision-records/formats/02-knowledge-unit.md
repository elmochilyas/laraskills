# Metadata

Domain: Backend Architecture & Design
Subdomain: Architectural Governance
Knowledge Unit: ADR formats (Nygard, MADR, Y-Statement)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Architecture Decision Records (ADRs) capture architectural decisions with context, options, rationale, and consequences. Multiple formats exist for different needs: Nygard (general purpose), MADR (structured, detailed), Y-Statement (lightweight, quick). The key insight from practitioners is that ADR discipline matters more than format choice â€” regular review, supersession management, and team adoption are harder than template selection.

---

# Formats

| Format | Structure | Best For |
|--------|-----------|----------|
| Nygard | Title, Status, Context, Decision, Consequences | General purpose, most widely adopted |
| MADR | YAML front matter + structured sections | Larger projects, requires more detail |
| Y-Statement | "In context of X, facing Y, we decided Z to achieve W, accepting V" | Quick decisions, lightweight |
| Outcome-First | Outcome, Decision, Tradeoffs, Reasoning Chain | Async teams, busy stakeholders |
| Tyree-Akerman | Issue, Decision Group, Assumptions, Constraints, Positions, Argument | Formal/complex decisions, regulated environments |

---

# ADR Lifecycle

1. **Proposed**: decision suggested, not yet accepted
2. **Accepted**: decision adopted
3. **Superseded**: replaced by newer ADR (link to superseding ADR)
4. **Deprecated**: no longer relevant (use before linking)
5. **Amended**: modified, not fully replaced

---

# Common Mistakes

- Creating ADRs as afterthought â†’ decisions alrady made, ADR is post-hoc rationalization
- No supersession management â†’ old ADRs linger as active, confusion about current decisions
- Too many ADRs for trivial decisions â†’ ADR fatigue, team stops using them
- Too few ADRs for significant decisions â†’ decisions undocumented, rationale lost
- ADRs not reviewed â†’ stale decisions no longer apply
- ADRs in separate system â†’ hidden from developers during coding
- No ADR template â†’ inconsistent quality, missing sections

---

# Production Considerations

- Store ADRs in version control alongside code (not wiki)
- Link ADRs to code: ADR numbers in comments, commit messages reference ADR
- Review ADRs as part of architecture review process
- Regular ADR audit: mark superseded/deprecated ADRs
- Start with Y-Statement, migrate to MADR for complex decisions

---

# Related Knowledge Units

**Prerequisites**: Architecture documentation | **Related**: Architecture fitness functions (complement ADRs with automated checks), C4 modeling, Architectural reviews | **Advanced**: ADR tooling (log4brains, adr-tools), ADR template customization, Large-scale ADR management

---

# Core Concepts

adr-formats is built on foundational concepts that govern its application in backend architecture.

| Concept | Description | Relevance |
|---------|-------------|-----------|
| Separation of Concerns | Dividing software into distinct features with little overlap | Enables independent development and testing |
| Dependency Management | Controlling how components reference each other | Prevents coupling and circular dependencies |
| Encapsulation | Hiding internal implementation details | Protects invariants and reduces change impact |
| Abstraction | Providing simplified interfaces over complex subsystems | Manages complexity at scale |

In the context of architectural-governance, these concepts manifest through specific structural and behavioral rules that guide implementation decisions.

---

# Mental Models

Several mental models help reason about adr-formats effectively:

- **Layered Abstraction**: Think of adr-formats as onion-like layers where inner layers know nothing about outer layers. Each layer provides a level of indirection that simplifies reasoning about the system.
- **Business Capability Mapping**: adr-formats boundaries are best understood by mapping business capabilities — each cohesive business function maps to one architectural unit.
- **Change Containment**: A useful heuristic is "what changes together, belongs together." If two components change for the same reason, they should be in the same unit. If they change for different reasons, they should be separated.
- **Dependency Direction**: Dependencies should point in the direction of stability — more stable components should depend on less stable ones, not the other way around.

---

# Internal Mechanics

The internal mechanics of adr-formats involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other — whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified — through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate — synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to adr-formats:

| Pattern | Purpose | Application in architectural-governance |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust adr-formats solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying adr-formats:

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

Common failure modes when applying adr-formats:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for adr-formats concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave — state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for adr-formats implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping — influencing architectural decisions across the ecosystem.

