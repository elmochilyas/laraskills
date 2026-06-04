# Entry Point Mechanics

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Request Lifecycle |
| Knowledge Unit | Entry Point Mechanics |
| Difficulty | Foundation |
| Lifecycle Phase | Entry |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Entry Point Mechanics covers the first microseconds of a Laravel request: how `public/index.php` bootstraps the framework, creates the Application instance, determines kernel type (HTTP vs Console), captures the incoming request via Symfony's `Request::capture()`, and dispatches to the appropriate handler. This KU establishes the foundation upon which every other lifecycle KU builds. The critical engineering decision is the dual-path dispatch (HTTP vs Console) determined not by URL parsing but by the running environment check `$app->runningInConsole()`. This topic is the single most important performance lever in Laravel: a properly cached bootstrap (config cache, route cache, events cache) can reduce request initiation from 80ms+ to under 5ms.

## Core Concepts
- **public/index.php** — The only file every HTTP request touches; requires Composer autoloader, creates Application via `bootstrap/app.php`, captures request, dispatches.
- **Application Instance Creation** — `bootstrap/app.php` calls `Application::configure()` which creates the Application and returns a configured instance via `ApplicationBuilder`.
- **HTTP vs Console Dispatch** — Laravel checks `$app->runningInConsole()` using `php_sapi_name()` and `$_SERVER['argv']` to detect CLI context.
- **Request Capture** — `Request::capture()` reads `$_GET`, `$_POST`, `$_COOKIE`, `$_FILES`, `$_SERVER` to build a Symfony `Request` object.
- **Maintenance Mode** — Before dispatch, checks `storage/framework/down`; returns maintenance mode response if present and IP not in bypass list.

## When To Use
- Debugging slow first-byte response times
- Understanding the bootstrap path for HTTP vs CLI requests
- Configuring Octane deployment where `public/index.php` runs once per worker
- Setting up custom exception handling or middleware at the entry point level

## When NOT To Use
- Adding application logic directly in `public/index.php` (runs on every request)
- Placing container resolution code in `bootstrap/app.php` before providers register
- Modifying the entry point for environment-specific behavior (use providers instead)

## Best Practices
- **Cache aggressively in production** — Always run `config:cache`, `route:cache`, `event:cache` in deployment. Without these, bootstrap overhead increases significantly.
- **Keep the entry point lean** — `public/index.php` and `bootstrap/app.php` should contain only framework initialization, not application logic.
- **Use ApplicationBuilder for configuration** — In Laravel 11+, configure routing, middleware, and exceptions through the fluent API in `bootstrap/app.php`.
- **Run `composer dump-autoload -o` in CI/CD** — Optimizes classmap resolution, reducing autoloader overhead from 5-15ms to <2ms.
- **Verify `bootstrap/app.php` syntax on deploy** — Add `php -l bootstrap/app.php` to deployment pipeline to prevent worker crashes.
- WHY: The entry point runs on every request (FPM) or once per worker (Octane). Any overhead here is multiplied by every request the application handles. Keeping it lean and cached is the highest-leverage performance optimization available.

## Architecture Guidelines
- The entry point should be the only place where Application is instantiated; never create `new Application()` in application code.
- Separate configuration (what happens in `bootstrap/app.php`) from initialization (what happens in providers).
- In Octane deployments, audit `bootstrap/app.php` for state initialization — closures capturing variables from `bootstrap/app.php` scope share that state across all requests.
- The entry point contract is: autoload → configure → capture request → dispatch → send response → terminate. Do not break this sequence.

## Performance Considerations
- Bootstrap time dominates cold requests: the 6 bootstrappers add 30-80ms without cache. With config cache, configuration merge drops from ~15ms to ~0.1ms.
- Octane eliminates bootstrap per-request; `public/index.php` runs once per worker.
- Composer autoloader adds 5-15ms for 200+ packages; `composer dump-autoload -o` reduces to <2ms.
- Maintenance mode check is a single filesystem stat (~0.1ms on SSD).

## Security Considerations
- Maintenance mode bypass IPs should be restricted to internal networks.
- `Request::capture()` reads from superglobals; ensure `trustedProxies` are configured to prevent IP spoofing.
- Never expose sensitive configuration in `bootstrap/app.php` — it is a PHP file accessible if directory listing is enabled.
- The `.env` file is loaded during `LoadEnvironmentVariables` bootstrapper; ensure file permissions restrict access.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Adding logic in `public/index.php` | Assumption it runs once per worker | Under FPM, runs on every request; unnecessary overhead | Place logic in service providers or middleware |
| Code in `bootstrap/app.php` before container is ready | Confusion about execution timing | Resolution failures during bootstrap | Use `ApplicationBuilder` fluent API; use provider `register()`/`boot()` for logic |
| Skipping `composer dump-autoload -o` in production | Unaware of filesystem fallback cost | Adds 10-30ms autoloader overhead per request | Always run optimized autoloader in deployment |

## Anti-Patterns
- **Direct Application instantiation** — Creating `new Application()` outside `bootstrap/app.php` bypasses configuration.
- **Global state in entry point** — Setting global variables or modifying superglobals in `public/index.php`.
- **Kernel resolution caching** — Storing the kernel instance in a static variable outside the container.
- **Conditional logic in entry point based on URL** — URL-based dispatch belongs in the router, not `public/index.php`.

## Examples

### Laravel 11+ Entry Point
```php
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    Request::capture()
)->send();
$kernel->terminate($request, $response);
```

### Octane Entry Point (runs once per worker)
```php
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
// Application stays in memory; subsequent requests
// do NOT re-enter public/index.php
```

## Related Topics
- **Prerequisites:** None (this is the root KU)
- **Closely Related:** HTTP Kernel Dispatch, Console Kernel Dispatch, Application Bootstrap
- **Advanced:** Octane Lifecycle Differences, Custom Kernel Implementations
- **Cross-Domain:** Server Configuration (FPM, Swoole, RoadRunner)

## AI Agent Notes
- When debugging "class not found" errors at bootstrap, check autoloader registration and `composer dump-autoload`.
- For "headers already sent" errors, look for whitespace or output before `$response->send()`.
- In Octane context, remember `public/index.php` runs once per worker — state initialized here persists across all requests.

## Verification
- [ ] Able to trace the exact sequence from `public/index.php` through `bootstrap/app.php` to kernel dispatch
- [ ] Understand why `runningInConsole()` is checked rather than URL
- [ ] Can identify which bootstrappers run and in what order
- [ ] Can explain how Octane changes the entry point lifecycle
- [ ] Can diagnose common entry point failures (missing `.env`, wrong kernel resolution)
