# Pipeline Architecture

## Metadata
- **ID:** ku-01-pipeline-architecture / ku-03-pipeline-passable / ku-04-pipe-array-iteration / ku-05-then-method-callback
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **Last Updated:** 2026-06-02

## Overview
The Pipeline pattern is a structural design pattern that processes an input through a sequence of stages, where each stage receives the output of the previous stage. In Laravel, `Illuminate\Pipeline\Pipeline` implements this pattern to route HTTP requests through a stack of middleware classes. Each middleware receives the request, performs an action, and either passes it forward via `$next($request)` or returns a response to short-circuit the pipeline. This pattern is the backbone of request filtering, authentication, logging, and cross-cutting concerns in the framework.

## Core Concepts
- **`send($passable)`**: Sets the input (the request) that travels through the pipeline.
- **`through($pipes)`**: Defines the array of pipes (middleware classes or callables).
- **`then($destination)` / `thenReturn()`**: Executes the pipeline — the destination is the final closure that receives the passable after all pipes.
- **`array_reduce` with reversed pipes**: `array_reduce(array_reverse($pipes), $this->carry(), $this->destination())` builds a nested closure structure. Each pipe wraps the next, creating left-to-right execution.
- **`carry()` method**: Returns a closure that resolves each pipe from the container, calls `handle($passable, $next)`, and passes the passable and next closure.
- **`$next($request)`**: Closure representing the rest of the pipeline. Calling it passes the request to the next pipe.
- **Short-circuit**: A pipe can return a response instead of calling `$next($request)`, halting the pipeline immediately.

## When To Use
- **HTTP middleware**: The primary use case — wrapping requests through authentication, logging, CORS, etc.
- **Job middleware**: Queue job middleware uses the same Pipeline class.
- **Mail sending middleware**: Mailables pass through middleware before sending.
- **Any sequential processing pipeline**: Data transformation pipelines, validation chains, multi-step processing flows.
- **Custom middleware stacks**: Building reusable middleware chains independent of HTTP context.

## When NOT To Use
- **Single-step processing**: A simple function call is sufficient — Pipeline adds unnecessary abstraction.
- **Parallel processing**: Pipes execute sequentially. For parallel processing, use different patterns.
- **Event-driven flows**: If pipes need to react to events asynchronously, use the event system instead.
- **Complex branching logic**: Pipeline is linear. For conditional branching, use strategy or chain-of-responsibility patterns directly.

## Best Practices (WHY)
- **Always return `$next($request)`**: The return value of `$next` is the response from downstream. Forgetting return breaks the response chain. *Why: Pipeline chains closures via return values — a missing return drops the entire downstream response.*
- **Keep pipes focused on a single concern**: Each middleware should do one thing (authenticate, log, compress). *Why: Multiple concerns in one pipe makes testing, composition, and reordering harder.*
- **Prefer class strings over closures in `through()`**: Closure-based pipes cannot be cached or resolved with container dependencies. *Why: Route caching serializes middleware definitions; closures are not serializable.*
- **Use `thenReturn()` when the destination is trivial**: When the pipeline's final destination is just returning the passable, `thenReturn()` is cleaner than a custom closure. *Why: Reduces boilerplate for the common "pass through all pipes and return" pattern.*

## Architecture Guidelines
- **Explicit Pipeline class**: Separated from the kernel for reusability across different contexts (HTTP, queue, mail).
- **`array_reduce` with reversed pipes**: Creates a clean, recursive closure structure without recursion depth limits.
- **Fluent API**: `send()`, `through()`, `then()` as distinct methods provides a readable, declarative interface.
- **Container resolution**: Pipes can be class strings resolved from the container, enabling dependency injection.

## Performance
- **Pipeline resolution**: Adds ~0.1-0.5ms per middleware for container resolution.
- **Nested closure structure**: Memory-efficient since closures capture variables by reference.
- **Route caching**: Serializes middleware definitions, eliminating runtime resolution overhead for class strings.
- **Short-circuit benefit**: Early-returning pipes (auth failure, rate limit) prevent downstream processing, saving resources.
- **20+ middleware stacks**: Profile with Laravel Telescope to identify bottlenecks.

## Security
- **Short-circuit risk**: A pipe returning a response prevents downstream pipes from executing. Security middleware (auth) placed after other middleware may be bypassed.
- **Container resolution failure**: Invalid middleware class string causes `BindingResolutionException` — unhandled, this returns a 500 error.
- **Missing `$next($request)`**: Pipeline stops silently — no downstream middleware or controller runs. This can bypass security checks.
- **Unhandled exception in pipe**: Halts the pipeline and returns 500 unless caught by exception handler middleware.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Forgetting to return `$next($request)` | Not understanding closure chain | Pipeline stops; no downstream execution | Always return from middleware handle() |
| Mixing pre and post code without clarity | No visual separation in code | Hard to trace what runs inbound vs outbound | Comment `// Pre` and `// Post` sections |
| Using closures for production middleware | Closures cannot be route-cached | Performance regression on uncached routes | Use class-based middleware |
| Expecting ordered execution without priority | Not understanding global → group → route order refers to merge order | Wrong execution order | Define middleware order explicitly in arrays |

## Anti-Patterns
- **Pipeline as catch-all service resolver**: Using the pipeline to resolve services that have nothing to do with sequential processing.
- **Over-nesting with custom pipelines**: Creating Pipeline instances within Pipeline instances. The built-in Pipeline handles one level of chaining.
- **Modifying the passable object unexpectedly**: Mutating the request/response in ways that surprise downstream pipes. Each pipe should document its modifications.
- **Global state in pipes**: Storing request data in static properties or globals within pipe logic.

## Examples

```php
use Illuminate\Pipeline\Pipeline;

// Basic pipeline
$result = app(Pipeline::class)
    ->send($request)
    ->through([
        TrimStrings::class,
        EncryptCookies::class,
        StartSession::class,
    ])
    ->then(function ($request) {
        return $router->dispatch($request);
    });

// Pipeline with closure pipe
$pipeline = app(Pipeline::class)
    ->send($data)
    ->through([
        function ($data, $next) {
            $data['timestamp'] = now();
            return $next($data);
        },
        ValidateInput::class,
    ])
    ->thenReturn();

// Custom pipe class
class LogRequest
{
    public function handle($request, $next)
    {
        Log::info('Request: ' . $request->method() . ' ' . $request->path());
        return $next($request);
    }
}
```

## Related Topics
- **Global Middleware Stack**: Outermost pipeline wrapping all requests.
- **Middleware Groups**: Composite middleware collections applied to route groups.
- **Route Middleware**: Per-route middleware assignment.
- **Pre-and-Post-Middleware Code**: Inbound vs outbound code within a single pipe.
- **Terminable Middleware**: Post-response deferred execution.

## AI Agent Notes
- `Illuminate\Pipeline\Pipeline` is ~200 lines with clear separation of concerns. The `carry()` method is the linchpin.
- The Pipeline class is framework-agnostic; it only depends on the container. This enables reuse across Laravel sub-components.
- Laravel 11 introduced `then()` returning `thenReturn()` simplification. Base mechanics have remained stable since Laravel 5.x.
- The `parsePipeString()` method handles parameterized pipes (colon-delimited parameters). This runs in the Pipeline, not the router.

## Verification
- [ ] Read `Illuminate\Pipeline\Pipeline::carry()` source — understand the closure wrapping mechanism
- [ ] Trace `then()` execution: `array_reduce` → reversed pipes → nested closures
- [ ] Create a custom pipeline with three pipes — verify execution order
- [ ] Test short-circuit: return response from middle pipe — verify downstream pipes don't execute
- [ ] Understand how `$next($request)` return value becomes the response
- [ ] Use Pipeline independently of HTTP — process data through transformation pipes
