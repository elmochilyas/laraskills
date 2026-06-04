# Console vs HTTP Boot Differences

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Boot Order & Timing |
| Knowledge Unit | Console vs HTTP Boot Differences |
| Difficulty | Intermediate |
| Lifecycle Phase | Application Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Laravel provides two kernel entry points — HTTP and Console — that share the same underlying Application bootstrap but differ in their bootstrapper set, middleware pipeline, and termination sequence. The HTTP Kernel processes web requests through a middleware pipeline after bootstrapping. The Console Kernel boots the application, registers Artisan commands, and optionally runs a scheduler — without a middleware pipeline. Understanding these differences is critical for code that behaves differently in CLI vs web contexts.

## Core Concepts
- **HTTP Kernel dispatches through middleware**: After bootstrapping, the request passes through global, group, and route middleware before reaching the controller.
- **Console Kernel registers commands**: After bootstrapping, it loads Artisan commands from registered providers and application command paths.
- **No middleware in console**: Console commands have no middleware pipeline — they execute directly after bootstrap.
- **Bootstrapper differences**: The Console Kernel uses a different bootstrapper set than the HTTP Kernel (e.g., console kernel has `LoadConfiguration` and `RegisterFacades` but does NOT register `HandleExceptions` in some configurations).
- **runningInConsole()**: `app()->runningInConsole()` returns true during console execution, enabling context-aware behavior.
- **Schedule resolution**: The Console Kernel resolves and runs scheduled tasks when `schedule:run` is invoked.
- **Termination difference**: The HTTP Kernel calls `terminate()` on terminable middleware; the Console Kernel has no equivalent middleware termination.

## When To Use
- Writing code that behaves differently in CLI vs HTTP contexts (e.g., verbose logging in console).
- Debugging issues that manifest only in one kernel context (e.g., memory leak in queue worker but not web request).
- Understanding why a middleware-based feature doesn't work in Artisan commands.

## When NOT To Use
- Don't use `runningInConsole()` for business logic decisions — use dependency injection with different implementations.
- Don't simulate middleware in console commands — use command-specific event hooks instead.
- Avoid overriding kernel bootstrap behavior unless building a custom kernel implementation.

## Best Practices (WHY)
- **Check context explicitly**: Use `app()->runningInConsole()` or `runningInConsole()` helper for context-aware provider registration. *Why: Providers may need to register different services for CLI vs HTTP.*
- **Keep CLI commands self-contained**: Console commands should not depend on middleware-provided state (auth, session). *Why: No middleware runs in console — session, auth, and other request-specific services are not available.*
- **Use console-specific providers**: Register CLI-only services in providers guarded by `runningInConsole()`. *Why: Avoids loading HTTP-only services during command execution.*
- **Test in both contexts**: A feature that works in HTTP may fail in CLI due to missing middleware or different bootstrapper order. *Why: CI pipelines should run tests in both kernel contexts.*

## Architecture Guidelines
- The Console Kernel extends `Illuminate\Foundation\Console\Kernel` which defines its own bootstrapper list.
- HTTP Kernel bootstrappers: `LoadEnvironmentVariables`, `LoadConfiguration`, `HandleExceptions`, `RegisterFacades`, `RegisterProviders`, `BootProviders`.
- Console Kernel bootstrappers: Same six except `HandleExceptions` is typically replaced or configured differently.
- The HTTP Kernel's `sendRequestThroughRouter()` builds a middleware pipeline; the Console Kernel has no equivalent.
- Both kernels share the same `Application` instance and provider registration.

## Performance
- Console bootstrapping is typically faster because there's no middleware pipeline overhead.
- Console kernel `handle()` skips the middleware dispatch — bootstrapping is the primary cost.
- Scheduler runs (`schedule:run`) boot the full application on every invocation — use cache to reduce provider overhead.
- Command auto-discovery via `Artisan::command()` in providers adds registration overhead not present in HTTP requests.

## Security
- Console commands run with the application's full container access — ensure command handlers validate user input and permissions.
- No CSRF, no auth middleware, no session — console commands must implement their own authentication if needed.
- Scheduler tasks run as the web server user — ensure file permissions and command arguments are validated.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Assuming middleware runs in console | Writing code that depends on session/auth middleware | Runtime errors or null values in console context | Guard with `runningInConsole()` or use console events |
| Different bootstrap behavior | Not testing in CLI context | Provider registration differs between HTTP and Console | Test commands in CI using `php artisan` |
| Scheduler running heavy command every minute | Command registered as `everyMinute()` with full bootstrap | 60 full bootstraps per minute | Use `withoutOverlapping()` or run as daemon |
| Forgetting maintenance mode | Console commands ignore down-for-maintenance by default | Commands run on a downed site | Check `app()->isDownForMaintenance()` in command |
| Session misuse in commands | Trying to access session in console | No session driver available | Use command arguments/options for input |

## Anti-Patterns
- **Duplicating middleware logic in commands**: Reproducing auth, throttle, or validation middleware behavior inside a command instead of using proper command guards.
- **HTTP-conditional provider registration**: Registering services based on `app()->runningInConsole()` without a clear reason.
- **Console-only configuration**: Loading different config sets for CLI vs HTTP — leads to inconsistent behavior.

## Examples
```php
// Service provider with context-aware registration
public function register()
{
    if ($this->app->runningInConsole()) {
        $this->app->register(ConsoleServiceProvider::class);
    }
}

// Artisan command accessing no middleware
class ProcessReports extends Command
{
    public function handle()
    {
        // No session, no auth, no CSRF — use direct container resolution
        $reports = app(ReportService::class)->generate();
        $this->info('Reports generated: ' . count($reports));
    }
}
```

## Related Topics
- **Prerequisites:** Complete Boot Sequence — the shared bootstrap foundation both kernels rely on.
- **Closely Related:** HTTP Kernel Internals, Console Kernel Internals — the kernel-specific execution flows.
- **Advanced:** Octane Boot Timing — Octane blurs the HTTP/Console distinction.
- **Cross-Domain:** Artisan Command Architecture, Scheduler Internals.

## AI Agent Notes
- `app()->runningInConsole()` checks `PHP_SAPI` and `php_sapi_name()` — not just whether the Console Kernel is in use.
- The Console Kernel's bootstrapper list may vary by Laravel version — always check the source.
- Queue workers use the Console Kernel — they inherit console bootstrap behavior.
- To test console behavior in HTTP context, use `Artisan::call()` which internally uses the Console Kernel.

## Verification
- [ ] Code that depends on middleware state is guarded or only used in HTTP context
- [ ] Service providers use `runningInConsole()` for CLI-specific registration
- [ ] Console commands do not depend on session, auth, or CSRF middleware
- [ ] Scheduler commands have `withoutOverlapping()` where appropriate
- [ ] CI pipeline tests commands via `php artisan` in addition to HTTP tests
