# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Chain of Responsibility pattern in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Chain of Responsibility passes a request along a chain of handlers, where each handler decides to process the request or pass it to the next handler. This pattern is foundational to Laravel's middleware system and Pipeline component, which form the backbone of request processing in the framework. The pattern decouples request senders from receivers, enabling dynamic handler composition and flexible processing pipelines.

---

# Core Concepts

- Handler: defines interface for processing requests and passing to next
- ConcreteHandler: handles specific request types or adds specific processing
- Successor: next handler in the chain
- Chain composition: handlers linked in ordered sequence
- Two variants: pass-all (middleware) and first-match (routing)

---

# Mental Models

- **Assembly Line**: Each station performs its task, then passes product to next station
- **Airport Security**: Multiple checks (ID, baggage, body scan) in sequence
- **Water Filter**: Water passes through successive filter stages
- **Event Bubbling**: DOM events propagate through nested elements until handled

---

# Internal Mechanics

Laravel's Pipeline (`Illuminate\Pipeline\Pipeline`) uses an array of "pipes" (callables, classes with `handle()` method, or invokable classes). Each pipe receives the `$passable` and a `$next` closure. The pipeline builds a nested closures structure where each closure calls the next. Middleware registers globally and in groups via `$middleware` and `$routeMiddleware` properties.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Middleware Pipeline | HTTP request processing | Declarative ordering, reusable filters | Many middleware classes, ordering complexity |
| Event Listener Chain | Event propagation | Multiple handlers per event | Ordering undefined unless specified |
| Validation Rules | Sequential validation | Composable rule classes | Rule ordering dependencies |
| Query Pipeline | DB query modification | Composable scopes | Performance: each scope adds query overhead |

---

# Architectural Decisions

- Use for: request/response processing pipeline (standard in Laravel)
- Use for: validation chains (if this passes, try next)
- Use for: fallback/retry chains (try handler A, if fails try handler B)
- Use for: logging/audit pipelines (each handler logs one aspect)
- Avoid for: operations that must always run together — use Decorator
- Avoid for: simple conditional logic — if/else is clearer

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Decouples sender from receivers | Request flow becomes implicit | Hard to trace what handlers exist |
| Dynamic handler composition | Handler ordering is critical | Adding/removing handlers can break chain |
| Easy to add new handlers | No guarantee handler will be called | Handlers can skip next and break chain |
| Reusable handler classes | Often single-use per chain | Class overhead for simple logic |

---

# Performance Considerations

- Each handler adds function call overhead + potential I/O (DB, cache, HTTP)
- Pipeline: O(n) for n handlers
- Middleware in Laravel: 5-15 middleware per request typical cost
- Consider short-circuiting (response returned early) for performance optimization
- Measurement: each middleware adds ~0.1-2ms depending on logic

---

# Production Considerations

- Log middleware processing time per handler for debugging slow requests
- Order handlers wisely: put expensive, high-rejection handlers early to fail fast
- Test chain with all possible handler orderings that reach production
- Monitor chain completeness: ensure all requests pass all required middleware
- Consider pipeline termination (short-circuit middleware) for early return optimization

---

# Common Mistakes

- Handler modifying the passable object in unexpected ways → subsequent handlers see modified state
- Handler return type inconsistency → pipe returns response vs modified passable
- Forgetting to call `$next($passable)` → chain silently terminates
- Heavy logic in frequently-skipped handler → pay cost of early rejection anyway
- Handler depending on previous handler's side effects → implicit coupling

---

# Failure Modes

- **Broken chain**: handler doesn't call `$next` → remaining handlers never execute
- **Exception in handler**: unless caught, terminates chain and propagates
- **State mutation**: handler modifies passable in way subsequent handlers don't expect
- **Ordering dependency**: handler assumes previous handler ran, but chain was reconfigured
- **Infinite loop**: handler incorrectly calls previous handler instead of next

---

# Ecosystem Usage

- **Laravel Middleware**: `Illuminate\Routing\Router` uses Pipeline for HTTP middleware — request passes through `StartSession`, `Authenticate`, `TrimStrings`, etc.
- **Laravel Pipeline**: `Illuminate\Pipeline\Pipeline` — reusable pipeline building
- **Eloquent Global Scopes**: applied as a chain modifying query builder
- **Validation**: custom rule classes can form chain-like validation
- **Queue Middleware**: `Illuminate\Queue\MiddlewareRateLimited`, etc.

---

# Related Knowledge Units

**Prerequisites**: Callables, closures | **Related**: Decorator (adds behavior vs passes request), Command (encapsulates request vs chains handlers), Middleware pattern | **Advanced**: Pipeline implementation internals, Short-circuit middleware, Dynamic middleware registration

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

