# HTTP Kernel Dispatch

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Request Lifecycle |
| Knowledge Unit | HTTP Kernel Dispatch |
| Difficulty | Advanced |
| Lifecycle Phase | Kernel Orchestration |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
HTTP Kernel Dispatch is the central orchestration layer between the entry point and the middleware pipeline. The `Illuminate\Foundation\Http\Kernel` class coordinates bootstrapper execution, request routing through global middleware, route dispatch, and response delivery. It implements the Template Method pattern — `handle()` defines the skeleton, while `sendRequestThroughRouter()`, `bootstrap()`, and `dispatchToRouter()` fill in the steps. The critical engineering decision is the two-phase pipeline architecture: bootstrappers run first to establish application state, then the middleware pipeline wraps route dispatch in an onion of pre/post processing. Every HTTP request that reaches a Laravel application passes through this kernel.

## Core Concepts
- **`handle()` Method** — Public entry point wrapping kernel logic in try/catch for exception handling; dispatches `RequestHandled` event before returning.
- **`sendRequestThroughRouter()`** — Core orchestration: bootstrap → pipeline → dispatch. Calls `$this->bootstrap()`, then sends request through global middleware via Pipeline, then invokes `dispatchToRouter()` closure.
- **`bootstrap()` Guard** — Calls `$app->bootstrapWith($this->bootstrappers())` only once per Application instance via `hasBeenBootstrapped()` check.
- **`dispatchToRouter()` Closure** — Final pipeline destination; sets request instance and calls `$this->router->dispatch($request)`.
- **6 Core Bootstrappers** — LoadEnvironmentVariables, LoadConfiguration, HandleExceptions, RegisterFacades, RegisterProviders, BootProviders.

## When To Use
- Understanding how requests flow through the framework
- Debugging bootstrap-phase issues or middleware ordering problems
- Implementing custom kernel behavior or kernel decorators
- Performance profiling to identify bootstrap vs route dispatch overhead

## When NOT To Use
- Modifying the kernel class directly (extend or decorate instead)
- Adding custom bootstrappers to the kernel's bootstrapper array (use providers)
- Bypassing the kernel's pipeline for request processing

## Best Practices
- **Never call `$this->bootstrap()` manually** in service providers or middleware — if `hasBeenBootstrapped()` returns false, it re-runs all bootstrappers, resetting configuration.
- **Monitor bootstrap time separately from route time** — If bootstrap exceeds 50ms, enable config cache and audit provider count.
- **Use `php artisan optimize` in CI/CD** — Config cache eliminates `LoadConfiguration` overhead; route cache eliminates route file parsing.
- **Audit middleware order** — `$middlewarePriority` ensures middleware like `SubstituteBindings` runs after `StartSession` and `Authenticate`.
- WHY: The kernel is the single bottleneck through which every request passes. Optimizing bootstrap and middleware order directly impacts every response time.

## Architecture Guidelines
- The kernel implements the Template Method pattern; `handle()`, `sendRequestThroughRouter()`, `bootstrap()`, and `dispatchToRouter()` are the overridable steps.
- The `bootstrap()` guard ensures one-time boot in both FPM and Octane — under Octane, the Application persists across requests.
- `dispatchToRouter()` is a closure rather than a direct call to decouple kernel from Pipeline internals.
- Middleware configuration moved from user-land `App\Http\Kernel` (Laravel 10) to `bootstrap/app.php` (Laravel 11+) via `ApplicationBuilder`.

## Performance Considerations
- Bootstrap is the dominant cost: `RegisterProviders` and `BootProviders` scale with provider count (5-15ms with 60 providers).
- Pipeline carrier overhead: each middleware adds ~0.15ms for closure construction via `array_reduce`.
- With 15 global + 5 route middleware, pipeline overhead is ~3ms.
- `$request->enableHttpMethodParameterOverride()` is ~0.01ms (no-op unless `_method` is present).
- Request Duration handlers run after response send, outside request time budget.

## Security Considerations
- The kernel's exception handling in `handle()` catches all `Throwable` — some errors should propagate (e.g., fatal errors). Use `HandleExceptions` bootstrapper for visibility.
- Middleware bypass via `shouldSkipMiddleware()` should be audited to ensure security middleware isn't accidentally skipped.
- The `enableHttpMethodParameterOverride()` allows `_method` POST parameter to override HTTP method; ensure this is desired behavior for your API.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Calling `bootstrap()` manually | Need for bootstrap-time logic mid-request | Re-runs all bootstrappers, resetting config | Implement a custom bootstrapper |
| Adding global middleware that should be route-specific | Confusion between global and route middleware | Every URL requires auth, including assets | Use middleware groups in `bootstrap/app.php` |
| Assuming middleware runs before provider boot | Misunderstanding kernel ordering | Dependencies missing in provider boot | Trust kernel order: bootstrappers → middleware → router |

## Anti-Patterns
- **Kernel subclassing for logic changes** — Extend the kernel for structural changes only; use middleware and providers for logic.
- **Bypassing Pipeline** — Sending requests directly to router without going through middleware.
- **Mutating `$middleware` at runtime** — The middleware array is populated at construction; runtime changes are not reflected.

## Examples

### Kernel handle flow
```php
public function handle($request)
{
    try {
        $request->enableHttpMethodParameterOverride();
        $response = $this->sendRequestThroughRouter($request);
    } catch (Throwable $e) {
        $this->reportException($e);
        $response = $this->renderException($request, $e);
    }
    $this->app['events']->dispatch(new RequestHandled($request, $response));
    return $response;
}
```

### sendRequestThroughRouter orchestration
```php
protected function sendRequestThroughRouter($request)
{
    $this->bootstrap();
    return (new Pipeline($this->app))
        ->send($request)
        ->through($this->app->shouldSkipMiddleware() ? [] : $this->middleware)
        ->then($this->dispatchToRouter());
}
```

## Related Topics
- **Prerequisites:** Entry Point Mechanics, Application Bootstrap, Service Container
- **Closely Related:** Middleware Pipeline, Console Kernel Dispatch, Boot Order & Timing
- **Advanced:** Custom Kernel Implementations, Octane Lifecycle Differences
- **Cross-Domain:** Router Architecture, Exception Handling

## AI Agent Notes
- When debugging "Target is not instantiable" errors during kernel constructor, check `->withRouting()` is called in `bootstrap/app.php`.
- For Octane-specific bugs, remember the bootstrap guard prevents re-initialization — middleware instances persist.
- Pipeline performance issues should be diagnosed by measuring middleware execution time, not count.

## Verification
- [ ] Can trace the full flow from `handle()` through `sendRequestThroughRouter()` to `dispatchToRouter()`
- [ ] Understand why `bootstrap()` is guarded by `hasBeenBootstrapped()`
- [ ] Know the 6 core bootstrappers and their execution order
- [ ] Can explain why `dispatchToRouter()` is a closure
- [ ] Can identify the difference between global and route middleware in kernel context
