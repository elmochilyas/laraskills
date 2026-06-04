# Bootstrap App PHP File

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Application Bootstrap |
| Knowledge Unit | Bootstrap App PHP File |
| Difficulty | Foundation |
| Lifecycle Phase | Entry |
| Framework Version | Laravel 11+ |
| Last Updated | 2026-06-02 |

## Overview
`bootstrap/app.php` is the single entry point for the entire Laravel application. It is invoked by all three kernel entry points (`public/index.php`, `artisan`, `octane`) and is responsible for creating the configured `Application` instance via the `Application::configure()->...->create()` static factory chain. The file returns the fully configured (but not yet bootstrapped) `Application` back to the caller. Understanding its structure is critical because it is the only file that must be correct for the application to function across all execution contexts. Prior to Laravel 11, this file contained direct kernel binding overwrites; the modern version uses the fluent ApplicationBuilder API.

## Core Concepts
- **Application::configure() static factory** — Creates an `ApplicationBuilder` wrapping a fresh `Illuminate\Foundation\Application`. Detects base path automatically from `__DIR__.'/../'`.
- **Builder chain** — A sequence of `->with*()` calls configuring the application, terminated by `->create()` which returns the configured Application instance.
- **Return value convention** — Uses `return $app;` (not global `$app`). The caller receives the Application and passes it to the appropriate kernel.
- **Cross-context compatibility** — The same file must work for HTTP, Artisan, queue workers, and Octane. Conditional logic via `$app->runningInConsole()` enables context-specific configuration.
- **File execution timing** — Executes once per application lifecycle (once per request in FPM, once per worker start in Octane).

## When To Use
- Setting up a new Laravel application — this is the default bootstrap file created by `laravel new`
- Configuring routing, middleware, and exception handling for all execution contexts
- Registering application-wide singletons and bindings at the bootstrap level
- Adding lifecycle hooks that must execute before any request is handled

## When NOT To Use
- Placing business logic or heavy computation in the file — it runs on every request in FPM
- Calling `$app->make()` before bootstrappers have run — container is empty except base bindings
- Moving the file without updating relative path references — base path detection depends on file location
- Configuring services that depend on environment variables — `.env` is not yet loaded

## Best Practices
- **Keep the builder chain minimal** — Only call `with*()` methods for subsystems your application actually uses.
- **Use environment-specific branches** with `$app->environment('production')` inside the file rather than maintaining separate bootstrap files.
- **Test changes with `php artisan about`** before deploying — a syntax error in `bootstrap/app.php` crashes every entry point.
- **Verify file readability in production** — `bootstrap/app.php` must be readable by the web server user and tracked in version control.
- WHY: The file is the single point of configuration for all entry points. A mistake here takes down the entire application.

## Architecture Guidelines
- The return statement eliminates global state: each caller receives its own Application instance, improving testability and predictability.
- `configure()` enforces ApplicationBuilder usage, preventing direct container manipulation before configuration completes.
- The file is not cached (unlike config/events/routes) because it must execute on every request in FPM to produce a fresh container.
- The base path detection (`realpath(__DIR__.'/../')`) assumes standard directory structure; override explicitly for non-standard layouts.

## Performance Considerations
- File inclusion overhead: ~0.1ms with OPcache enabled — negligible.
- Builder chain overhead: A typical chain of 5 methods adds ~0.3ms.
- OPcache implications: The file is OPcached like all PHP files. The `require` cost is minimal; the real cost is code execution inside the file.
- In Octane, the file runs once per worker startup; performance impact is amortized across thousands of requests.
- No caching mechanism exists for bootstrap execution because each call must produce a new Application instance in FPM.

## Security Considerations
- The `.env` file is NOT loaded when `bootstrap/app.php` executes — any secrets stored in environment variables are not accessible during configuration.
- Do not hardcode secrets (API keys, database passwords) inside `bootstrap/app.php` — they would be readable in source control and OPcache dumps.
- The file path detection uses `realpath()` which resolves symlinks; ensure the resolved path does not expose unintended directories.
- In serverless deployments (Vapor), the file must work on read-only filesystems — verify no write operations inside the file.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Using `dd()`, `var_dump()` inside bootstrap | Debugging left in production | Headers already sent — HTTP response corruption | Use logging instead of dump functions |
| Calling `$app->make()` before bootstrappers | Assuming container is fully ready | `BindingResolutionException` for unregistered services | Wait for service provider `boot()` phase |
| Moving `require bootstrap/app.php` without adjusting path | Refactoring entry point files | Base path points to wrong directory | Pass explicit basePath to `Application::configure()` |
| Forgetting `->create()` at chain end | Copying incomplete example | Returns `ApplicationBuilder` instead of `Application` | Always end builder chain with `->create()` |
| Using `$app->environment()` before config loaded | Accessing environment too early | Reads `$_ENV['APP_ENV']` directly — not `config/app.php` | Use `$_ENV['APP_ENV']` directly if needed before config loads |

## Anti-Patterns
- **Global variable pollution** — Setting `$GLOBALS['app']` or similar inside `bootstrap/app.php` defeats the return-value encapsulation.
- **Entry point conditionals per environment** — Creating separate `bootstrap/app.production.php` and `bootstrap/app.local.php` files instead of using environment branching.
- **Hardcoded paths** — Using absolute paths like `/var/www/app/storage` instead of path helpers or relative detection.
- **Service resolution in bootstrap** — Calling `$app->make()` or `resolve()` inside the file before the container is fully populated.

## Examples

### Standard bootstrap/app.php (Laravel 11+)
```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->report(function (\App\Exceptions\CustomException $e) {
            // ...
        });
    })
    ->create();
```

### How Entry Points Consume It
```php
// public/index.php
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
)->send();
$kernel->terminate($request, $response);

// artisan (simplified)
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$status = $kernel->handle(
    $input = Symfony\Component\Console\Input\ArgvInput,
    new Symfony\Component\Console\Output\ConsoleOutput
);
```

## Related Topics
- **Prerequisites:** Application Class Construction, Application Builder Configuration
- **Closely Related:** Bootstrapper Sequence, Path Helpers and Environment Detection
- **Advanced:** Octane Application Lifecycle, Config Caching, Console vs HTTP Boot Differences
- **Cross-Domain:** Deployment Configuration, Serverless Architecture

## AI Agent Notes
`bootstrap/app.php` is the only file in a Laravel application that runs in ALL entry points. Prior to Laravel 11, it used `$app = new Application(...)` with direct `$app->singleton()` calls for kernel binding. The modern version uses `Application::configure()` which enforces Ap plicationBuilder usage. The file's design as a pure configuration file that returns a value is deliberate: it avoids side effects, enables testability (you can `require` the file in a test and inspect the returned Application), and makes the bootstrap process deterministic. The `Application::configure()` method internally calls `new ApplicationBuilder(new static($basePath), $basePath)`.

## Verification
- [ ] File returns an `Illuminate\Foundation\Application` instance (not `ApplicationBuilder`)
- [ ] Builder chain includes `->create()` as the final method call
- [ ] No `dd()`, `var_dump()`, or `echo` present in the file
- [ ] All `with*()` calls use correct method signatures for the Laravel version
- [ ] Environment-specific branching does not depend on resolved services
- [ ] File is readable by web server user and tracked in version control
- [ ] `php -l bootstrap/app.php` passes syntax check
- [ ] `php artisan about` succeeds with the current bootstrap file
