# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Decorator pattern in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Decorator attaches additional responsibilities to an object dynamically, providing a flexible alternative to subclassing for extending functionality. In Laravel, this pattern is fundamental: middleware layers decorate HTTP requests/responses, pipeline stages wrap each other, and the container's `extend()` method provides decorator-like wrapping of bound services. The pattern excels when you need to compose behaviors at runtime without class explosion.

---

# Core Concepts

- Component: defines the interface for objects that can have responsibilities added
- Concrete Component: the base object to which responsibilities are added
- Decorator: maintains reference to Component and implements same interface
- Concrete Decorator: adds specific behavior before/after delegating to wrapped component
- Composition over inheritance: decorators wrap, not extend

---

# Mental Models

- **Onion Layers**: Each decorator wraps the previous one like layers of an onion
- **Middleware Stack**: HTTP request enters outermost middleware, passes through each, gets response back
- **Gift Wrapping**: Each layer adds its own wrapping, the original object is at the center
- **Stackable Behaviors**: Logging, caching, rate-limiting as independently stackable behaviors

---

# Internal Mechanics

Decorator receives wrapped component via constructor (usually interface type-hinted). Each decorator method calls the wrapped component's method and adds behavior before/after. PHP's `extend()` on container registers a decorator closure that wraps the resolved instance. Pipeline pattern (Laravel's `Illuminate\Pipeline\Pipeline`) uses array of callables as decorators around a core closure.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Classic Decorator | Compile-time wrapping | Type-safe, explicit | Many small classes |
| Pipeline Decorator | Runtime composition via array | Flexible ordering configuration | Type-erased at runtime |
| Container extend() | Transparent wrapping of services | No client code changes | Only for container-resolved services |

---

# Architectural Decisions

- Use Decorator over subclassing when: behaviors are independent and combinable
- Use for: cross-cutting concerns (logging, caching, rate limiting, validation)
- Use for: HTTP middleware stack in Laravel
- Use for: query middleware (caching queries, filtering results)
- Avoid for: behaviors that change the interface — use Adapter instead
- Avoid for: behaviors that are always applied together — subclassing is simpler

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Runtime composition of behaviors | Many small decorator classes | Navigation overhead |
| No class explosion (N behaviors = N decorators) vs N×M subclasses | Debugging stacked decorators | Stack traces become deep |
| Behaviors independently testable | Ordering dependencies between decorators | Removal/insertion breaks stack |
| Transparent to client (same interface) | Cannot access decorator-specific methods from client | Type narrowing required |

---

# Performance Considerations

- Each decorator adds one method call + one delegation — O(n) for n decorators
- Deep decoration stacks (10+ decorators) measurable in hot paths
- Pipeline uses callable arrays — avoids class overhead but less IDE support
- Decorator allocation: N decorators = N objects for each wrapped instance

---

# Production Considerations

- Document decorator ordering requirements (cache before logging? rate-limit before caching?)
- Test decorator stack as a whole integration, not just each decorator in isolation
- Monitor decorator performance — identify which layers add latency
- Consider lazy initialization for expensive decorator dependencies
- Log decorator chain composition for debugging

---

# Common Mistakes

- Decorator modifying wrapped component's state → unpredictable behavior with shared instances
- Decorator ordering assumptions → logging after caching misses cache hits
- Throwing exceptions from decorator without cleanup → partially executed stack leaks state
- Decorator wrapping decorator with incompatible lifetime → memory leaks in long-running processes
- Not delegating to parent → decorator silently swallows behavior

---

# Failure Modes

- **Double decoration**: same decorator applied twice → double logging, double counting
- **Missing delegation**: decorator forgets to call parent → behavior chain broken
- **Order-dependent failure**: changing decorator order breaks correct behavior
- **Singleton decorator wrapping request-scoped service**: in Octane, state leaks across requests
- **Decorator stack too deep**: 20+ decorators adds measurable latency

---

# Ecosystem Usage

- **Laravel Middleware**: `Illuminate\Routing\Router` pipes request through middleware stack — classic decorator
- **Laravel Pipeline**: `Illuminate\Pipeline\Pipeline` — passes value through array of pipeables
- **Laravel Container `extend()`**: wraps resolved services with decorator logic transparently
- **Eloquent Scopes**: global scopes act as decorator-like query modifications
- **Cache Decorator Pattern**: cache decorated repository wraps DB repository with caching logic

---

# Related Knowledge Units

**Prerequisites**: Composition vs Inheritance, Interface Segregation | **Related**: Chain of Responsibility (passes request vs adds behavior), Proxy (controls access vs adds behavior), Strategy (swaps algorithm vs wraps behavior) | **Advanced**: `extend()` method decorator pattern, Pipeline vs Decorator differences

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

