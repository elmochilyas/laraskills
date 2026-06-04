# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Strategy pattern in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Strategy defines a family of algorithms, encapsulates each one, and makes them interchangeable at runtime. In Laravel, the pattern appears in payment gateways (Stripe vs PayPal vs Square), shipping calculators (flat rate vs weight vs distance), notification channels (mail vs SMS vs Slack), and report generation (PDF vs CSV vs Excel). The pattern eliminates conditional logic (if/else, switch) by delegating algorithm selection to the caller.

---

# Core Concepts

- Context: uses a Strategy, maintains reference to current strategy
- Strategy: common interface for all supported algorithms
- ConcreteStrategy: implements the algorithm
- Runtime selection: context receives strategy via constructor, setter, or parameter
- Encapsulated variation: each algorithm lives in its own class

---

# Mental Models

- **GPS Navigation**: Different routing strategies (fastest, shortest, avoid highways) selected based on preference
- **Payment Terminal**: Customer chooses payment method (card, cash, mobile) — same checkout process
- **Chess AI**: Different difficulty levels implement same `move()` interface
- **Plugin Architecture**: Plug-in strategies for different rendering engines

---

# Internal Mechanics

Context class depends on Strategy interface. Concrete strategies implement the interface. Selection logic (which strategy to use) lives at the call site or in a factory. The container can inject strategies via tagged bindings or contextual binding. Route model binding, enum-backed strategies, and config-driven selection are common PHP patterns.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Interface Strategy | Classic OOP strategy | Type-safe, testable | Many classes for many strategies |
| Closure Strategy | Lightweight function-based | No class overhead | Cannot share complex state |
| Enum Strategy | PHP 8.1 enum-backed | Type-safe selection, minimal boilerplate | Not extensible from outside |
| Tagged Strategy | Container-resolved collection | Auto-registration via tags | Indirect resolution, harder to debug |

---

# Architectural Decisions

- Use when: algorithm varies by context (payment type, shipping method, file format)
- Use when: algorithm has multiple variants that may grow
- Use when: algorithms should be independently testable
- Use for: report generation formats, notification channels, payment providers
- Avoid for: algorithms that rarely change — inline conditional is clearer
- Avoid for: algorithms sharing most code — Template Method is better fit

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Eliminates conditional logic | More classes → more files | Navigation overhead for simple apps |
| Runtime algorithm switching | Selection logic complexity | Wrong strategy selection = wrong behavior |
| Independent testability | Strategy interface design imposes constraints | New strategies may not fit interface |
| OCP compliance (add without modifying) | Must register new strategy somewhere | Registration can be forgotten |

---

# Performance Considerations

- Strategy overhead: one method call delegation — negligible
- Strategy construction: per-request instantiation for stateful strategies
- Consider singleton strategy classes for stateless algorithms
- Closure strategies: avoid capturing large scope in memory-constrained environments

---

# Production Considerations

- Log which strategy was selected and why for debugging
- Monitor strategy distribution (how often is each strategy used)
- Test all strategies with same input to verify consistent interface contract
- Consider fallback strategy when primary strategy fails
- Document strategy selection criteria

---

# Common Mistakes

- Strategy interface too specific → new algorithms can't conform
- Strategy methods with side effects → same algorithm different results
- Strategy selection logic spread across codebase → hard to change selection criteria
- Strategies duplicating common logic → extract base class (but prefer composition)
- Not testing strategies in combination with context → strategy works alone but fails in context

---

# Failure Modes

- **Missing strategy**: requested strategy not registered → fallback to default silently
- **Incorrect strategy selected**: wrong selection criteria → wrong algorithm runs
- **Stateful strategy shared**: singleton strategy with mutable state → cross-operation contamination
- **Strategy swapping mid-operation**: setter-based strategy changed during execution → inconsistent behavior

---

# Ecosystem Usage

- **Laravel Payment**: config-driven `PaymentGatewayInterface` with implementations for each provider
- **Laravel Notification**: `via()` method on notification returns channel strategies
- **Laravel Cache/Queue/Mail**: Manager classes select driver strategies based on config
- **Spatie/MediaLibrary**: conversion strategies for image manipulation
- **Spatie/LaravelAnalytics**: provider strategy pattern for analytics services

---

# Related Knowledge Units

**Prerequisites**: Interface segregation, Polymorphism | **Related**: State (state-dependent behavior vs algorithm selection), Template Method (algorithm skeleton vs interchangeable parts), Factory (creates strategy objects) | **Advanced**: Strategy registry with tagged bindings, Enum-backed strategy dispatch, Strategy + Decorator combination

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

