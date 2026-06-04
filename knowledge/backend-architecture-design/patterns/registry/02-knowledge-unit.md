# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Registry pattern (Service Container)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Registry provides a well-known object that other objects can use to find common objects and services. In Laravel, the Service Container (`Illuminate\Container\Container`) is the Registry pattern implementation — it stores and provides access to application services. Other registry-like patterns in Laravel include the configuration repository (`config()`), the application instance (`app()`), and service locators. While registry is convenient, Martin Fowler warns it becomes a service locator anti-pattern when overused for dependency hiding.

---

# Core Concepts

- Single access point: well-known object for retrieving services
- Registry scope: typically application-level or request-level
- Registration: services are registered, then retrieved by key/type
- Service Locator: registry pattern that becomes anti-pattern when it hides dependencies
- Container vs Registry: container manages lifecycle; registry provides access

---

# Mental Models

- **Phone Directory**: Look up services by name (like phone book)
- **Hotel Concierge**: You ask "I need X" and concierge provides it
- **Shared Whiteboard**: Well-known place where everyone knows to look

---

# Internal Mechanics

Laravel's Container stores bindings in `$bindings` array and resolved instances in `$instances` array. Services retrieved by interface/class name string. PSR-11 `ContainerInterface` standardizes retrieval. The registry returns the same or new instance based on binding type. Configuration uses dot-notation keys (`config('app.debug')`).

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Service Container | Dependency registry + DI | Centralized service management | Can become service locator |
| Service Locator | Explicit service retrieval | Clear where services come from | Hidden dependencies |
| Configuration Registry | Key/value config store | Application-wide config access | Global mutable state |
| Instance Registry | Object instance registry | Global access to specific objects | Testability issues |

---

# Architectural Decisions

- Prefer: dependency injection over direct registry access
- Use container directly (make/get) in: service providers, factories, legacy code
- Avoid container access in: domain objects, services, controllers (use constructor injection)
- Use config() in: services, controllers (configuration is a legitimate cross-cutting concern)
- Use registry for: framework infrastructure, not domain logic

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized service access | Hidden dependencies | Constructor doesn't reveal all dependencies |
| Flexible service resolution | Magic strings for service names | Type safety lost without constants |
| Testable via container swap | Container access couples to framework | Hard to extract non-Laravel code |
| Application-wide configuration | Global mutable state | Config changes affect all code paths |

---

# Performance Considerations

- Container access: array lookup + optional construction
- Cached instances (singleton): array lookup only
- Config access: array lookup (cached after first access)
- Reflection-based resolution: first-call cost for unregistered classes

---

# Production Considerations

- Use `app()->make()` sparingly outside service providers
- Register explicit bindings for interfaces; avoid relying on auto-resolution for hot paths
- Cache configuration in production (php artisan config:cache)
- Monitor service resolution errors in logs

---

# Common Mistakes

- App() calls scattered through business logic → hidden dependencies, hard to test
- Config() used for runtime state → config is for static configuration, not session data
- Storing mutable objects in registry → unexpected side effects in long-running processes
- Using registry as service locator → every class resolves its own dependencies
- Overriding registered services without understanding lifecycle → stale instances

---

# Failure Modes

- **Service not bound**: accessing unregistered service → runtime exception
- **Incorrect service returned**: wrong binding for interface → wrong implementation used
- **Stale cached config**: config cached then changed → config not updated
- **Service locator dependency hiding**: class works because container provides service, but constructor doesn't reveal it → unexpected failures when container changes

---

# Ecosystem Usage

- **Laravel App**: `Illuminate\Foundation\Application` — primary registry + container
- **Config Repository**: `Illuminate\Config\Repository` — key/value config registry
- **Service Providers**: register services into container (the registry)
- **Facades**: static proxies to container-resolved services
- **Feature Flags**: custom registry for feature toggles

---

# Related Knowledge Units

**Prerequisites**: Service Container, Dependency Injection | **Related**: Singleton (registry vs singleton pattern), Service Locator (registry anti-pattern), Dependency Injection Container | **Advanced**: PSR-11 container interface, Multi-container patterns, Registry scope and lifecycle management

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

