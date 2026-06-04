# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: SOLID principles in PHP: OCP violations
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Open-Closed Principle states classes should be open for extension but closed for modification â€” you should add new behavior by writing new code, not by changing existing code. In Laravel, common violations include switch/if-else chains on type fields, hardcoded driver selections, and conditionals that grow with each new variant. The principle is achieved through polymorphism, strategy pattern, pipeline composition, and service container tag resolution.

---

# Core Concepts

- Open for extension: new behavior can be added via new classes
- Closed for modification: existing code doesn't change when adding behavior
- Abstraction: depend on interfaces, not concrete implementations
- Strategy: encapsulate variant behavior in separate classes
- Extension points: design where new variants plug in without modification

---

# Mental Models

- **USB Port**: New devices plug in without changing the port
- **Plugin Architecture**: Add plugins without changing core application
- **Browser Extensions**: Extend browser functionality without modifying browser

---

# Common Laravel OCP Violations

- Switch on order type: `switch($order->type) { case 'digital': ... case 'physical': ... }`
- If-else chain on payment method: `if ($gateway == 'stripe')` else...
- Hardcoded notification channel selection in controller
- Enum-based logic scattered across codebase (unlike encapsulated strategy)
- `instanceof` checks for different behavior
- Global scope all/none â€” adding new scope requires modifying existing

---

# Detection

- Switch/if-else that needs new branch for each new variant
- Class clearly designed for current variants only (adding 4th variant requires changes)
- Method parameters that control behavior branching (control coupling anti-pattern)
- "Add if" comments in code: `// Add new payment method here`
- Open/closed assessment: ask "how many files would I change to add one new variant?"

---

# Correction Strategies

- Strategy pattern: encapsulate each variant in its own class
- Pipeline pattern: composable operations
- Service container tags: register variants via tagged bindings
- Event-driven extension: events allow listeners to add behavior
- Macroable trait: Laravel's `Macroable` for runtime extension
- Static factory via config: `config('gateways')` returns class list

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Adding variants doesn't modify existing code | More classes, more interfaces | Higher up-front design cost |
| New behavior isolated in new class | May need factory to select variant | Factory becomes switch statement (one place) |
| Reduced regression risk from changes | Design must anticipate variation axis | Under-engineered: can't extend; Over-engineered: extends but never needed |

---

# Performance Considerations

- Strategy pattern: method call overhead â€” negligible
- Service container tag resolution: array iteration over tagged services
- Pipeline: additional method calls per pipe
- No significant performance difference from OCP-compliant code

---

# Production Considerations

- Don't apply OCP preemptively â€” wait until you see the second variant
- Design extension points when you know variation exists (not for hypotheticals)
- Document how to add new variants (readme, ADR)
- Consider YAGNI: OCP violations for single-variant code are acceptable

---

# Common Mistakes

- Premature OCP: creating strategy interfaces for single implementation â†’ YAGNI
- Over-engineering: interface per class + factory + registry for what could be enum match
- Open but not closed: strategy interface changes when new variant added â†’ violates OCP
- Leaky strategy selection: selection logic duplicates across codebase

---

# Related Knowledge Units

**Prerequisites**: Polymorphism, Strategy pattern | **Related**: SRP (OCP enabled by SRP), Strategy pattern (primary OCP tool), Pipeline pattern, Events for extension | **Advanced**: Dependency injection for variant selection, Macroable trait pattern, Plugin architectures

---

# Internal Mechanics

The internal mechanics of ocp-violations involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other — whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified — through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate — synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to ocp-violations:

| Pattern | Purpose | Application in design-patterns-principles |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust ocp-violations solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying ocp-violations:

| Decision | Option A | Option B | Recommendation |
|----------|----------|----------|----------------|
| Boundary granularity | Fine-grained | Coarse-grained | Start coarse, refine with evidence |
| Communication style | Synchronous | Asynchronous | Prefer async for cross-boundary communication |
| State ownership | Shared state | Isolated state | Isolated state per boundary |
| Enforcement mechanism | Convention | Automation (CI, static analysis) | Automate what matters, document the rest |
| Abstraction depth | Shallow (direct) | Deep (multi-layer) | Shallow until complexity demands depth |

---

# Failure Modes

Common failure modes when applying ocp-violations:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for ocp-violations concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave — state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for ocp-violations implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping — influencing architectural decisions across the ecosystem.

