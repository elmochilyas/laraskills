# HTTP Kernel Structure & Handle Flow

## Metadata
- **ID:** ku-01-http-kernel-structure / ku-03-http-kernel-handle-flow
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Kernel Architecture
- **Last Updated:** 2026-06-02

## Overview
The HTTP Kernel (`Illuminate\Foundation\Http\Kernel`) is the central orchestrator that transforms an incoming server request into a response. It manages the middleware pipeline, bootstraps framework services via six bootstrappers, delegates to the router, and coordinates the termination lifecycle. Every HTTP request served by Laravel passes through this class — it is the single most critical entry point in the framework's execution flow.

## Core Concepts
- **Kernel Contract**: Implements `Illuminate\Contracts\Http\Kernel` with `handle(Request): Response` and `terminate(Request, Response): void`.
- **Middleware Pipeline**: Wraps the request in a stack of global, group, and route-specific middleware executing before and after the core application logic.
- **Bootstrappers Array**: Six fixed bootstrapper classes run once per request: LoadEnvironmentVariables, LoadConfiguration, HandleExceptions, RegisterFacades, RegisterProviders, BootProviders.
- **sendRequestThroughRouter()**: Core orchestration method that builds the pipeline via `Illuminate\Pipeline\Pipeline` with `send($request)`, `through($this->middleware)`, and `then($this->dispatchToRouter())`.
- **dispatchToRouter()**: Bridge method that calls `$router->dispatch($request)`, entering the routing layer.
- **Termination Lifecycle**: After `handle()` returns and the response is sent, `terminate()` runs terminable middleware in LIFO order and evaluates request duration lifecycle handlers.
- **$middlewarePriority**: Global array controlling execution order when middleware originates from different sources (global, group, route).

## When To Use
- **Every HTTP request**: The HTTP Kernel processes all incoming HTTP requests automatically.
- **Custom sub-requests**: When dispatching internal requests within the same process (used by some packages for testing or embedding).
- **Custom kernels**: When implementing a completely different request handling strategy (e.g., ReactPHP async), implement the `Http\Kernel` contract.

## When NOT To Use
- **CLI commands**: Use the Console Kernel for Artisan commands.
- **Queue jobs**: Queue workers use a separate lifecycle; the HTTP Kernel is not involved.
- **Direct service resolution**: For resolving services without HTTP context, use the container directly.

## Best Practices (WHY)
- **Keep global middleware minimal**: Each global middleware runs on every request. Adding unnecessary middleware to the global stack affects 100% of traffic. Add middleware to groups or routes when possible. *Why: Performance — middleware adds pipeline resolution overhead and execution time per layer.*
- **Understand execution order**: Global → group → route middleware. Priority reorders across these boundaries. Verify with `php artisan route:list -v`. *Why: Order-dependent bugs (e.g., middleware expecting route bindings before SubstituteBindings runs) are silent and hard to debug.*
- **Return `$next($request)` always**: Forgetting the return statement breaks the pipeline. The return value of `$next` is the downstream response. *Why: The pipeline chains closures via return values; a missing return drops the response chain.*
- **Keep terminate() lightweight**: Post-response terminate handlers still block the PHP process. Heavy work belongs in queues. *Why: In PHP-FPM, the worker is occupied during terminate; in Octane, it delays the next request.*
- **Prefer explicit middleware over $middlewarePriority**: Priority is global — affects all routes. Overusing it creates hidden ordering dependencies. *Why: Priority is a global override that affects every route; most ordering needs can be solved by correctly ordering entries in group arrays.*

## Architecture Guidelines
- **Pipeline over nesting**: Using a pipeline instead of nested closures allows clean addition/removal of middleware and supports terminable middleware via reverse iteration.
- **Single-pass bootstrapping**: Bootstrappers run once per kernel lifecycle, not per-middleware or per-route. This ensures configuration, providers, and facades are available everywhere without repeated overhead.
- **Bootstrapper order is rigid**: The six bootstrappers execute in a fixed sequence. Custom bootstrappers run before or after the entire sequence, not between individual bootstrappers.
- **Guarded initialization**: `$this->hasBeenBootstrapped` flag ensures bootstrappers run exactly once per kernel instance, preventing redundant initialization on sub-requests.
- **Middleware groups vs global**: Distinguishing global, group, and route middleware allows granular control — common middleware applies everywhere while specific middleware scopes to route groups.

## Performance
- **Bootstrapper cost**: RegisterProviders and BootProviders are the most expensive — they instantiate and boot all registered service providers. Config caching drastically reduces LoadConfiguration overhead.
- **Middleware overhead**: Each global middleware adds at least two method calls. With 10+ global middleware, this adds 1-3ms per request in framework overhead.
- **Pipeline construction**: `sendRequestThroughRouter()` builds the pipeline array every request. The middleware list is fixed via `$middleware` property to reduce allocation cost.
- **Terminate() cost**: Post-response middleware consumes CPU time. Heavy terminate operations block the next request in single-process models.
- **Route caching**: With kernel middleware groups frozen at bootstrap, route caching works because middleware resolution doesn't require per-request computation.

## Security
- **Middleware short-circuit risk**: Middleware returning a redirect (e.g., `RedirectIfAuthenticated`) prevents downstream middleware from executing. Logging middleware after it won't record the request.
- **Terminate exception handling**: An uncaught exception in terminable middleware is silently ignored in some configurations (response already sent) — leading to silent data loss.
- **Trusted proxy configuration**: Missing `TrustProxies` behind a load balancer causes all IPs to resolve to the proxy IP, breaking rate limiting, logging, and authentication.
- **Middleware order security**: Auth middleware must run before any middleware that accesses authenticated user data. The priority system enforces this but custom middleware can bypass it.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Forgetting terminable middleware registration | Implementing `TerminableMiddleware` without registering in kernel | Terminable only works on middleware listed in `$middleware` or `$middlewareGroups`, not route middleware | Ensure terminable middleware is in global stack or a group |
| Assuming middleware runs in route order | Not understanding global → group → route execution | Route middleware runs after global and group, inside the pipeline | Trace: global first, then groups, then route-specific |
| Returning vs passing incorrectly | Forgetting to return `$next($request)` | Breaks the pipeline; downstream middleware never executes | Always `return $next($request)` |
| Heavy logic in terminate() | Placing expensive operations in terminate() | Terminate runs after response sent but PHP process is still occupied | Use queues for heavy post-response work |

## Anti-Patterns
- **Global middleware as catch-all**: Adding every middleware to the global stack "just in case." This slows every request. Add middleware at the most specific level possible (route > group > global).
- **Modifying $middlewarePriority excessively**: Using priority to fix ordering issues that should be resolved by correctly ordering middleware in group arrays. Priority is global and affects all routes.
- **Extending Kernel handle()**: Overriding `handle()` instead of using middleware or bootstrappers. The kernel's `handle()` is a template method; extend it only when implementing a completely custom request lifecycle.
- **Kernel as service locator**: Accessing the kernel instance to push middleware from service providers instead of using `bootstrap/app.php` configuration.

## Examples

```php
// Custom middleware that runs on every request
class LogRequests
{
    public function handle($request, $next)
    {
        Log::info('Request started: ' . $request->path());
        $response = $next($request);
        Log::info('Response sent: ' . $response->status());
        return $response;
    }
}

// Registration in bootstrap/app.php (Laravel 11+)
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(LogRequests::class);
})

// Registration in Kernel (Laravel 10)
protected $middleware = [
    \App\Http\Middleware\LogRequests::class,
];
```

## Related Topics
- **Console Kernel Internals**: CLI counterpart with shared bootstrapping but different pipeline.
- **Kernel Bootstrappers**: The six initialization steps running before middleware execution.
- **Middleware Pipeline**: The Pipeline class and its internal mechanics.
- **Request Duration Lifecycle Handlers**: Threshold-based callbacks firing in the terminate phase.
- **Routing Internals**: How `dispatchToRouter()` delegates to the matched route's handler.

## AI Agent Notes
- The HTTP Kernel source at `Illuminate\Foundation\Http\Kernel.php` is ~120 lines — compact, primarily delegating to Pipeline and Router.
- `sendRequestThroughRouter()` is the core orchestration point; read this method first when analyzing kernel behavior.
- In Laravel 11+, `App\Http\Kernel` (userland) was removed — middleware is configured via `bootstrap/app.php` with `->withMiddleware()`. The framework kernel remains unchanged.
- The `$middlewarePriority` property is often overlooked but critical for understanding exact execution sequence.

## Verification
- [ ] Read `Illuminate\Foundation\Http\Kernel::handle()` source
- [ ] Trace the full flow: handle() → bootstrap() → sendRequestThroughRouter() → Pipeline → dispatchToRouter()
- [ ] Verify understanding of middleware execution order: global → group → route, with priority reordering
- [ ] Identify the six bootstrappers and their order
- [ ] Test with `php artisan route:list -v` to see resolved middleware per route
- [ ] Confirm terminate behavior: write a terminable middleware, verify it runs after response sent
