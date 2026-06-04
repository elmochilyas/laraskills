# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: SOLID principles in PHP: ISP violations
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Interface Segregation Principle states that no client should be forced to depend on methods it does not use. Large, "fat" interfaces force implementors to create empty or throwing methods for irrelevant functionality. In Laravel, common violations include monolithic repository interfaces with find/save/delete/search/export methods, and controller interfaces that mix disparate responsibilities. The correction involves splitting interfaces by role/client-specific needs — "role interfaces" that serve one consumer.

---

# Core Concepts

- Client-specific interfaces: each interface serves one client's needs
- Role interfaces: interfaces named after client's role, not implementation
- No fat interfaces: don't create one interface for all operations
- Multiple inheritance of interfaces: classes can implement multiple role interfaces
- Interface granularity: interfaces should be as small as possible but no smaller

---

# Mental Models

- **All-in-One Remote**: Controls TV, AC, sound system, lights — you only need TV controls
- **Multi-tool**: You carry 20 tools but only use 2
- **Restaurant Menu**: All-day menu with breakfast, lunch, dinner items — you only eat one meal

---

# Common Laravel ISP Violations

- Mega Repository interface: `UserRepositoryInterface` with findAll, findById, findByEmail, save, delete, export, generateReport, calculateStats
- Monolithic service interface: `OrderServiceInterface` with create, cancel, refund, export, notify, sync, getHistory, getAnalytics
- Controller implementing multiple unrelated interfaces
- Event listener interface requiring methods for events listener doesn't handle
- Validation rule interface requiring methods for rules that don't need them
- Resource/transform interface with methods for multiple formats (toArray, toXML, toCSV, toPDF)

---

# Detection

- Interface method with empty body in implementation
- Interface method throwing `NotImplementedException`
- Interface method returning null/unused value
- Interface with "and" in its conceptual name
- Client injecting interface but only using 20% of its methods
- New implementations burdened by methods they don't need

---

# Correction Strategies

- Split by client role: `UserReader`, `UserWriter`, `UserExporter` instead of `UserRepository`
- Mini-interfaces: small, focused contracts
- Interface inheritance: larger interface extends smaller ones (clients depend on specific)
- Eliminate interface: if only one implementation and no swap planned, use concrete class
- Prefer callable/closure over single-method interfaces
- Use Delegate pattern for optional methods

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clients only see relevant methods | More interfaces to manage | Interface proliferation risk |
| Implementors don't create stub methods | More specific naming needed | What to call a 2-method interface? |
| Changes to one interface don't affect others | Classes implement more interfaces | More `implements` declarations |
| Better testability (mock only needed methods) | More test setup code | Each role interface mocked separately |

---

# Performance Considerations

- Interface method calls: no overhead vs concrete calls
- More interfaces: no runtime cost (PHP compiles interface definitions)
- Interface discovery: tooling improvement (PHPStan) — not a runtime concern

---

# Production Considerations

- Document which interface serves which client
- Review interface design as part of code review
- Prefer role interfaces over technical interfaces (naming is important)
- Don't split preemptively — extract interface methods when a second client needs them
- Interface proliferation is also a problem: find the balance

---

# Common Mistakes

- Interface explosion: one interface per method → navigation nightmare
- Role interfaces that mirror implementation structure → technology-named, not role-named
- Over-splitting then needing to inject 5 interfaces → constructor pollution
- Not using interface at all → ISP violation by default (client depends on concrete class)
- Interface copied from another language's conventions (Java-style Repository interface)

---

# Related Knowledge Units

**Prerequisites**: Interface basics in PHP | **Related**: SRP (classes → interfaces), LSP (interface hierarchy), Repository pattern (interface design) | **Advanced**: Role interfaces in practice, Interface vs abstract class tradeoffs, Adapter pattern for interface segregation

---

# Internal Mechanics

The internal mechanics of isp-violations involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other � whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified � through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate � synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to isp-violations:

| Pattern | Purpose | Application in design-patterns-principles |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust isp-violations solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying isp-violations:

| Decision | Option A | Option B | Recommendation |
|----------|----------|----------|----------------|
| Boundary granularity | Fine-grained | Coarse-grained | Start coarse, refine with evidence |
| Communication style | Synchronous | Asynchronous | Prefer async for cross-boundary communication |
| State ownership | Shared state | Isolated state | Isolated state per boundary |
| Enforcement mechanism | Convention | Automation (CI, static analysis) | Automate what matters, document the rest |
| Abstraction depth | Shallow (direct) | Deep (multi-layer) | Shallow until complexity demands depth |

---

# Failure Modes

Common failure modes when applying isp-violations:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for isp-violations concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave � state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for isp-violations implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

