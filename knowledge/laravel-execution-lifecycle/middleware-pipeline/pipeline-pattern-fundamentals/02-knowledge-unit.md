# Pipeline Pattern Fundamentals
## Metadata (Domain: Laravel Execution Lifecycle & Framework Internals, Subdomain: Middleware Pipeline, Last Updated: 2026-06-02)
## Executive Summary
The Pipeline pattern is a structural design pattern that processes an input through a sequence of stages, where each stage receives the output of the previous stage. In Laravel, `Illuminate\Pipeline\Pipeline` implements this pattern to route HTTP requests through a stack of middleware classes. Each middleware receives the request, performs an action, and either passes it forward via `$next($request)` or returns a response to short-circuit the pipeline. This pattern is the backbone of request filtering, authentication, logging, and cross-cutting concerns in the framework.

## Core Concepts
The Pipeline class operates on three fundamental methods: `send()` sets the input (the request), `through()` defines the array of pipes (middleware classes), and `then()` (or `thenReturn()`) executes the pipeline by invoking each pipe in sequence. Each pipe is a closure or invokable class that receives `$request` and a `$next` closure. Calling `$next($request)` passes the request to the next pipe; returning a response halts the chain. The pipeline uses `array_reduce` in reverse to build a nested structure of closures, executing from left to right through the pipe array.

## Mental Models
**Onion Model:** Each middleware layer wraps around the core application. The request travels inward through middleware layers, hits the application kernel, and the response travels outward through the same layers in reverse. Code before `$next($request)` runs on the inbound journey; code after runs on the outbound journey.

**Assembly Line:** The request is a workpiece moving down a conveyor belt. Each station (middleware) inspects, modifies, or rejects the workpiece before passing it to the next station. The belt ends at the application controller (the core), then the response travels back.

## Internal Mechanics
`Illuminate\Pipeline\Pipeline` uses Laravel's container to resolve middleware instances from class strings. The core method is `then()` which calls `array_reduce(array_reverse($pipes), $this->carry(), $this->destination())` to build a single callable that chains all pipes. The `carry()` method returns a closure that wraps each pipe: it resolves the pipe from the container, calls `pipe()` or `handle()` on the resolved object, and passes `$request` and `$next`. The `$next` parameter is always a Closure that represents the rest of the pipeline. The destination is the final closure that dispatches to the router.

```php
// Illuminate\Pipeline\Pipeline
protected function carry()
{
    return function ($stack, $pipe) {
        return function ($passable) use ($stack, $pipe) {
            if (is_callable($pipe)) {
                return $pipe($passable, $stack);
            }
            $parameters = [$passable, $stack];
            return $this->container->make($pipe)->handle(...$parameters);
        };
    };
}
```

## Patterns
- **Chain of Responsibility:** Each pipe decides whether to pass the request forward or short-circuit.
- **Decorator:** Each pipe can modify the request/response before passing along.
- **Strategy:** Pipes can be swapped at runtime via the `through()` method, enabling different middleware stacks for different route groups.

## Architectural Decisions
Laravel chose an explicit Pipeline class rather than relying solely on a middleware array in the HTTP kernel to allow reusability of the pipeline mechanism across different contexts (e.g., queued job middleware, mail sending middleware). The decision to use `array_reduce` with reversed pipes creates a clean, recursive closure structure without recursion depth limits. Separating `send()`, `through()`, and `then()` into distinct methods provides a fluent, readable API.

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Simple, declarative API for middleware | Each middleware must be resolved from container per-request | Minimal overhead but adds up with many middleware |
| Flexible — pipes can be closures or classes | Container resolution obscures constructor injection for middleware | Middleware dependencies must be resolvable by container |
| Reusable across HTTP, queue, mail | Same interface means queue middleware must conform to same signature | Consistent patterns but some middleware are context-specific |

## Performance Considerations
Pipeline resolution adds ~0.1–0.5ms per middleware for container resolution. Cached middleware (pre-resolved) can reduce this. The nested closure structure is memory-efficient since closures capture variables by reference. For applications with 20+ middleware, profile with Laravel Telescope to identify bottlenecks.

## Production Considerations
Monitor middleware execution time via Laravel's event system or profiling tools. Pipeline exceptions can be caught using error-handling middleware placed early in the stack. Ensure middleware order does not change between deployments without testing — a reordered stack can introduce security holes.

## Common Mistakes
**Why it happens:** Developers assume middleware runs in the order listed. **Why it's harmful:** Without understanding the `array_reduce`/`array_reverse` mechanics, debugging order-dependent issues becomes confusing. **Better approach:** Mentally trace: the first pipe in `through()` receives the request first. Code before `$next()` runs on the way in; after `$next()` runs on the way out.

## Failure Modes
- **Unhandled exception in middleware:** Halts the pipeline and returns 500 unless caught by exception handler.
- **Missing `$next($request)`:** The pipeline stops; no downstream middleware or controller runs.
- **Container resolution failure:** Invalid middleware class string causes `BindingResolutionException`.

## Ecosystem Usage
- **Laravel Horizon:** Uses Pipeline for job middleware.
- **Laravel Mail:** Pipeline processes mailables through sending middleware.
- **Laravel Queue:** Job middleware (rate-limited, throttled) use the same Pipeline class.
- **Third-party packages:** Spatie's `laravel-permission` uses the middleware pipeline for role checks.

## Related Knowledge Units
### Prerequisites
- Service Container (binding resolution mechanics)
- Closures in PHP (anonymous function fundamentals)
- Application Bootstrap (framework initialization sequence)

### Related Topics
- Chain of Responsibility Pattern
- Decorator Pattern
- Service Container (dependency resolution in Pipeline::carry())

### Advanced Follow-up Topics
- Global Middleware Stack (outermost pipeline wrapping)
- Middleware Groups (composite middleware collections)
- Route Middleware (per-route middleware assignment)
- Middleware Parameters (parameterized pipe execution)

## Research Notes
**Source Analysis:** `Illuminate\Pipeline\Pipeline` (vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php) — ~200 lines with clear separation of concerns. The `carry()` method is the linchpin.
**Key Insight:** The Pipeline class is framework-agnostic; it only depends on the container. This design enables reuse across Laravel sub-components.
**Version-Specific Notes:** Laravel 11 introduced `then()` returning `thenReturn()` simplification. The base mechanics have remained stable since Laravel 5.x.
