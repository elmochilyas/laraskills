# Complete Boot Sequence

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Boot Order & Timing |
| Knowledge Unit | Complete Boot Sequence |
| Difficulty | Foundation |
| Lifecycle Phase | Application Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
The Laravel boot sequence is a deterministic 16-step pipeline that transforms a raw HTTP request into a fully-initialized application response. Every framework request — HTTP, console, queue job — traverses this exact sequence from Composer autoloader registration through response dispatch. Understanding the precise ordering and interdependencies of these steps is essential for debugging bootstrap issues, writing correct service providers, and optimizing application startup time.

## Core Concepts
- **16-step pipeline**: From `public/index.php` entry to `$response->send()`. Each step depends on the previous.
- **6 kernel bootstrappers**: LoadEnvironmentVariables, LoadConfiguration, HandleExceptions, RegisterFacades, RegisterProviders, BootProviders — executed in fixed order.
- **Two-phase provider initialization**: All providers `register()` then all providers `boot()`. This separation prevents circular dependencies.
- **Middleware pipeline**: Global → group → route middleware wraps the core controller dispatch.
- **Termination**: Terminable middleware executes after the response is sent, for cleanup tasks.
- **Booted flag**: `Application::$booted` prevents double-booting across sub-requests or Octane workers.

## When To Use
- Debugging bootstrap failures (missing config, provider resolution errors).
- Understanding the execution context when writing service providers or bootstrappers.
- Optimizing application startup time by identifying expensive boot steps.
- Onboarding new Laravel developers to the framework's internal architecture.

## When NOT To Use
- Individual bootstrapper internals belong in their respective KUs (Bootstrapper Sequence).
- Provider-specific register/boot details belong in Register Phase Order and Boot Phase Order.
- Octane-specific variations belong in Octane Boot Timing.
- Console vs HTTP differences belong in Console vs HTTP Boot Differences.

## Best Practices (WHY)
- **Keep register() pure**: Only add bindings — never resolve. *Why: Resolution in register() may fail if dependent providers haven't registered yet.*
- **Use boot() for initialization**: Register routes, events, listeners in boot(). *Why: All providers are available; all bindings are registered.*
- **Cache aggressively**: Run config:cache, route:cache, event:cache. *Why: Reduces bootstrap time by 30-100ms by eliminating file parsing.*
- **Defer what you can**: Providers that only bind should be deferred. *Why: Skips both register() and boot() unless the service is actually used.*
- **Monitor boot time**: Use Telescope or custom middleware to track LARAVEL_START → first middleware. *Why: Bootstrap overhead is additive — every provider and bootstrapper adds cost.*

## Architecture Guidelines
- The boot sequence is controlled by the kernel, not the application. The kernel calls `$this->bootstrap()` which runs bootstrappers in order.
- Bootstrappers cannot be reordered or removed by user code — they are defined in the kernel class.
- After bootstrapping, the middleware pipeline runs — this is the application's extension point for request processing.
- Octane and queue workers boot once — thesequence runs once per worker start, not per request.
- The `bootstrapWith()` method on Application allows running a custom set of bootstrappers programmatically.

## Performance
- Bootstrap time breakdown: Composer autoloader (1-3ms), config loading (10-40ms), provider registration (5-20ms), provider boot (10-30ms), middleware pipeline (1-5ms).
- Config caching reduces config loading to <1ms.
- Deferred providers reduce provider registration/boot overhead proportionally to unused providers.
- Octane amortizes bootstrap cost over thousands of requests — effectively zero per request.
- Without cache, bootstrap takes 30-80ms on typical hardware; with cache, 5-15ms.

## Security
- The `HandleExceptions` bootstrapper registers error/exception handlers before any application code runs — critical for secure error handling.
- Configuration loading (`LoadConfiguration`) must complete before providers register — ensures consistent config for all services.
- The `RegisterFacades` bootstrapper sets up facades which provide global access to services — ensure facades are not abused to bypass access controls.
- Octane's one-time boot means security services (auth, gate) are initialized once — they must be stateless or scoped.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Calling app()->make() in register() | Not understanding two-phase register/boot | BindingResolutionException if dependent provider not yet registered | Move resolution to boot() |
| Assuming boot order of providers | Relying on provider order for cross-provider dependencies | Fragile — package providers append after app providers | Use contextual binding or document expectations |
| Not running config:cache | Developing without cache, deploying without it | 30-80ms unnecessary bootstrap overhead per request | Always run config:cache in production |
| Double boot from manual call | Calling $app->boot() in middleware | Services initialized twice — subtle bugs | Let the framework manage boot() |
| Octane state leaks | Using singleton() for request-scoped state | User data leaks between requests | Use scoped() for per-request services |

## Anti-Patterns
- **Fat providers**: Dumping all initialization logic in a single provider — violates SRP and makes boot sequence hard to trace.
- **Booting the app manually**: Calling `$app->boot()` from middleware or controllers — the framework manages booting.
- **Skipping bootstrappers**: Trying to override individual bootstrappers via event listeners — use proper extension points.
- **Forgetting cache**: Running Laravel in production without config/route/event caching — measurable performance regression.

## Examples
```php
// public/index.php — the entry point and first step
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
)->send();
$kernel->terminate($request, $response);
```

## Related Topics
- **Prerequisites:** None — this is the root KU for the subdomain.
- **Closely Related:** Bootstrapper Sequence, Register Phase Order, Boot Phase Order.
- **Advanced:** Octane Boot Timing, Deferred Provider Loading Timing.
- **Cross-Domain:** HTTP Kernel Internals, Console Kernel Internals.

## AI Agent Notes
- The 16-step sequence was confirmed by tracing `public/index.php` through `Kernel::handle()`, `bootstrap()`, and each bootstrapper in Laravel 10.x and 11.x source code.
- The exact number of steps varies by source — the 16-step breakdown includes both kernel-managed bootstrappers and HTTP dispatch/sub-kernel lifecycle.
- Future Laravel versions may reduce bootstrapper count as more functionality moves to lazy-loading.
- Under Octane, steps 1-15 happen once per worker; only the middleware → router → controller → response cycle repeats per request.

## Verification
- [ ] Can describe the 16-step boot sequence in order
- [ ] Understand which bootstrappers run and in what order
- [ ] Know the difference between register() and boot() phases
- [ ] Can trace a request from public/index.php through middleware to response
- [ ] Production bootstrap caching is configured and verified
