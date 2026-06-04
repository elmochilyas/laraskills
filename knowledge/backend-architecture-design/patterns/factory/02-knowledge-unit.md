# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Factory pattern in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Factory encapsulates object creation logic, decoupling callers from concrete instantiation details. In Laravel, the service container's auto-resolution already handles most factory needs — when a class has dependencies, the container builds them. Explicit Factory classes are needed when creation requires runtime configuration, conditional logic, or when the container cannot determine the correct concrete type. The pattern provides a seam for testing and a single point of change when construction logic evolves.

---

# Core Concepts

- Factory Method: a single method that returns a specific interface/abstract type
- Static Factory: `Foo::create($args)` — simple but limits testability
- Factory class: dedicated class with `make()` or `create()` methods
- Parameterized creation: factory accepts runtime arguments that influence which object is built
- Creation responsibility separation: caller does not know concrete class, only the interface

---

# Mental Models

- **Just-in-time wiring**: Factory as a mini-container for objects with runtime parameters
- **Test seam**: Factory allows replacing produced objects in tests without touching callers
- **Creation encapsulation**: "Don't chase new through constructor chains" — factory hides construction complexity

---

# Internal Mechanics

PHP Factory method resolves type hints and builds dependency chain. Unlike the container which uses reflection, explicit Factory classes typically hard-code construction logic. The creation method runs each time, producing new instances. For objects with runtime state (e.g., a DTO populated from request data), Factory is the appropriate abstraction.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Factory Method | Single product creation | Simple, overridable in subclass | Each product needs subclass |
| Static Factory | Convenient creation | No instantiation needed | Not extensible, testability limited |
| Parameterized Factory | Runtime-dependent creation | Flexible, config-driven | More complex, more tests |

---

# Architectural Decisions

- Prefer container auto-resolution over explicit Factory for most cases
- Use Factory when: creation requires runtime config, license key, API token from config
- Use Factory when: same interface needs different implementations based on runtime context
- Avoid Factory when: it just wraps `new SomeClass()` with no additional logic

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Decouples caller from concrete class | Extra indirection layer | More files to navigate |
| Centralizes creation logic | Factory becomes single point of failure | All creation paths through one class |
| Enables testing via substitution | Additional test doubles | Higher test maintenance |
| Parameterized creation flexibility | Runtime type safety concerns | Wrong parameters at runtime produce wrong type |

---

# Performance Considerations

- Factory construction overhead negligible compared to I/O
- Reflection-based factory (container auto-resolve) has ~0.1-1ms first-call cost
- Explicit Factory (hard-coded `new`) has zero reflection overhead
- For hot-path creation (1000+ requests/second), prefer explicit Factory over reflection

---

# Production Considerations

- Log Factory creation failures with context (request ID, parameters) for debugging
- Monitor Factory-created objects for memory leaks if they hold references
- Consider Factory as an extension point for feature flags/A/B testing
- Document what runtime parameters the Factory expects and what it produces

---

# Common Mistakes

- Factory that just calls `new` on a concrete class with no args → unnecessary indirection
- Factory that does too much (validates input, logs, sends notifications) → SRP violation
- Factory that depends on request state → hidden coupling to HTTP context
- Not testing the Factory → broken when dependencies change

---

# Failure Modes

- **Runtime parameter mismatch**: Factory receives wrong config key → wrong product type created
- **Circular creation**: Factory A calls Factory B which calls Factory A → stack overflow
- **Expensive construction in Factory**: Factory hits DB/API during creation → slow request even without using the object

---

# Ecosystem Usage

- **Laravel Framework**: `CacheManager`, `QueueManager`, `MailManager` — factory methods that build driver instances
- **Spatie/LaravelData**: `Data::from()` — static factory creating DTOs from various sources
- **Laravel Horizon**: `JobFactory` for creating job instances from queue payloads

---

# Related Knowledge Units

**Prerequisites**: Dependency Injection, Interface segregation | **Related**: Abstract Factory, Builder (complex construction), Service Container auto-resolution | **Advanced**: Factory as extension point for OCP, Test double factories

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

