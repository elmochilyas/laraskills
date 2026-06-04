# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Facade pattern in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Facade provides a unified, simplified interface to a complex subsystem, reducing coupling between client code and subsystem components. Laravel's Facade system (not the GoF pattern, but related) provides static-like access to container-resolved services. The real architectural value is the GoF Facade — a service class that coordinates complex subsystem operations while hiding internal complexity. The pattern is essential for controlling coupling at subsystem boundaries.

---

# Core Concepts

- Simplified interface: a single class exposing high-level operations
- Subsystem encapsulation: hides internal classes, their interactions, and ordering
- Client isolation: clients depend only on Facade, not subsystem internals
- Laravel Facades: static proxies to container services (architecturally different from GoF Facade)

---

# Mental Models

- **Service Desk**: One counter handles all requests — no need to know which department does what
- **Remote Control**: Unified interface over complex internal electronics
- **API Gateway**: Single entry point that routes to multiple internal services

---

# Internal Mechanics

GoF Facade composes with subsystem classes (via container or direct instantiation). Each Facade method coordinates multiple subsystem calls, handling ordering, error recovery, and result composition. Laravel Facades use `__callStatic()` to resolve from container and delegate — they're syntactic sugar for `app()->make()`, not GoF Facades.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| GoF Facade | Simplify subsystem access | Reduces coupling, improves readability | Subsystem changes may ripple to facade |
| Laravel Facade | Static-like container access | Concise syntax, IDE friendly | Magical static calls, confusing origin |
| Session Facade | Request-specific subsystem coordination | Shared context without passing through all layers | Hidden dependency on request lifecycle |

---

# Architectural Decisions

- Use GoF Facade for: complex subsystem with multiple interacting components
- Use GoF Facade for: public API surface of a module/package
- Use Laravel Facades for: framework service access in views/controllers (convention)
- Avoid Facade when: clients can interact directly with a simple subsystem
- Avoid Laravel Facades in: domain/business logic — use dependency injection instead
- Distinguish between: GoF Facade (design pattern) and Laravel Facades (static proxy pattern)

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Simplified client API | Facade may expose too much of subsystem | Leaky abstraction problem |
| Reduces coupling to subsystem | Subsystem evolution constrained by facade interface | Breaking changes require facade update |
| Centralizes subsystem access patterns | Facade becomes bottleneck for new functionality | All new features flow through facade |
| Testable via facade mocking | Tests pass but subsystem integration fails | Must integration-test subsystem separately |

---

# Performance Considerations

- Single facade call vs N direct subsystem calls: negligible difference
- Laravel Facade: resolves service from container each call (unless singleton)
- Use `Facade::shouldReceive()` in tests — this swaps underlying service
- No performance penalty for GoF Facade over direct subsystem calls

---

# Production Considerations

- Document facade method preconditions and side effects
- Log facade entry/exit in debug mode for tracing
- Monitor facade method usage — identify which subsystem flows are hot paths
- Consider caching facade results for read-only subsystems

---

# Common Mistakes

- Confusing Laravel Facades with GoF Facade — they solve different problems
- Facade that exposes all subsystem methods → no simplification, just delegation
- Multiple facades for same subsystem → inconsistent access patterns
- Facade with mutable state → side effect unpredictability
- Over-facading: facade for every class → unnecessary indirection

---

# Failure Modes

- **Leaky abstraction**: facade exposes subsystem types in its API → clients couple to subsystem
- **Facade as god object**: one facade handles too many subsystem interactions → SRP violation
- **Inconsistent facade**: some methods delegate to subsystem, others implement logic → responsibility confusion
- **Hidden complexity**: facade hides performance characteristics → clients call facade in loops causing N+1

---

# Ecosystem Usage

- **Laravel Facades**: `\Illuminate\Support\Facades\Cache`, `\Illuminate\Support\Facades\DB`, etc. — static proxies to container services
- **GoF Facade pattern in Laravel**: Service classes (OrderService, CheckoutService) that orchestrate multiple subsystem calls (repository, mailer, logger, queue)
- **Spatie packages**: many provide a Facade for convenient access to package services

---

# Related Knowledge Units

**Prerequisites**: Dependency injection, Service layer | **Related**: Adapter (makes interface compatible vs simpler), Mediator (coordinates communication vs simplifies access), Service Layer (application boundary facade) | **Advanced**: Laravel Facades internals, When to use Facade vs DI, Facade vs Proxy

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

