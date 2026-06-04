# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Bridge pattern in PHP/Laravel context
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Bridge decouples an abstraction from its implementation so the two can vary independently. While less common than Adapter in PHP, Bridge appears in middleware versioning, API response formatting, and multi-channel notification systems. The pattern prevents class explosion — instead of N×M classes for N abstractions with M implementations, Bridge requires N+M classes.

---

# Core Concepts

- Abstraction: defines the high-level control interface
- Refined Abstraction: extends the abstraction
- Implementor: defines the low-level implementation interface
- Concrete Implementor: implements the implementor interface
- Decoupling: abstraction holds reference to implementor, not vice versa

---

# Mental Models

- **Class Explosion Prevention**: Bridge avoids Cartesian product of abstractions × implementations
- **Platform/Device Pattern**: Different notification types (alert, digest, push) × different channels (email, SMS, push notification)
- **API Version Bridge**: Same API contract (v1 vs v2) with different internal implementations

---

# Internal Mechanics

Abstraction class receives Implementor via constructor injection. Each method on Abstraction delegates to the Implementor. Refined Abstractions extend the base abstraction adding higher-level operations. The implementor interface stays stable while both sides evolve independently.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Notification Bridge | Different messages × different channels | N notifications + M channels, not N×M | Must design stable implementor interface |
| API Version Bridge | Same API, different internal implementation | Versioning without code duplication | Abstraction must anticipate variation |
| Renderer Bridge | Data × format combinations (HTML, JSON, XML) | Format independence from data | Extra indirection for simple outputs |

---

# Architectural Decisions

- Use when: you foresee independent variation in both abstraction and implementation
- Use when: you have N×M class explosion (N abstractions, M implementations)
- Use for: notification systems, output formatting, multi-platform support
- Avoid for: single-abstraction, single-implementation — Adapter is simpler
- Avoid for: abstractions and implementations that always change together — merge them

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Independent variation of abstraction/implementation | More complex initial design | Overengineering for simple hierarchies |
| Runtime implementation switching | Abstraction must accept implementor | Construction becomes more involved |
| Reduces class count from N×M to N+M | Both hierarchies must be designed upfront | Changes ripple through both interfaces |

---

# Performance Considerations

- Bridge adds one level of indirection per method call
- Cost negligible for I/O-bound operations
- Bridge + Strategy combination can add two indirections
- PHP object allocation for bridge instances is cheap

---

# Production Considerations

- Test abstraction with each implementation variant
- Document the variation axes that motivated the bridge
- Monitor implementation selection logic for correctness
- Consider dependency injection container for wiring abstraction to implementor

---

# Common Mistakes

- Bridge used where Adapter suffices (single abstraction, single implementation to translate)
- Abstraction interface leaking implementor concepts → abstraction depends on implementation details
- Implementor interface too specific → new implementations can't conform
- Over-bridging: every class gets an abstraction layer → premature abstraction

---

# Failure Modes

- **Interface drift**: abstraction changes faster than implementor can adapt → broken abstractions
- **Leaky abstraction**: implementor methods exposed through abstraction → clients depend on implementation details
- **Missing implementation method**: new abstraction method has no corresponding implementor method → runtime error

---

# Ecosystem Usage

- **Laravel Notification Channels**: Notifications support mail, database, broadcast, Vonage, Slack — different notification data structures × different channel implementations
- **Laravel Cache & Lock**: Cache driver (Redis, File, Memcached) × Lock implementations pair as bridge-like design
- **Middleware Pipelines**: Middleware abstractions can be bridged to different runtime implementations (HTTP, queue, broadcast)

---

# Related Knowledge Units

**Prerequisites**: Adapter pattern, Interface Segregation | **Related**: Strategy (algorithm variation vs implementation variation), Abstract Factory (creates bridge components) | **Advanced**: Bridge + DI container for runtime wiring, Compile-time vs runtime variation decisions

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

