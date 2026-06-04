# Bootstrapper Sequence

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Application Bootstrap |
| Knowledge Unit | Bootstrapper Sequence |
| Difficulty | Advanced |
| Lifecycle Phase | Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
The bootstrapper sequence is the ordered pipeline of six classes that transform the bare `Application` container — which has only base bindings and aliases — into a fully operational Laravel application with environment, configuration, error handling, facades, and service providers. The sequence is immutable: `LoadEnvironmentVariables` → `LoadConfiguration` → `HandleExceptions` → `RegisterFacades` → `RegisterProviders` → `BootProviders`. Each bootstrapper performs a well-defined initialization step, and the order is hardcoded in the kernel. The `bootstrapWith()` method orchestrates execution and toggles the `hasBeenBootstrapped` guard to prevent double execution. Understanding this sequence is the single most important prerequisite for debugging bootstrap-order bugs, which are among the most common and confusing issues in Laravel development.

## Core Concepts
- **The Six Bootstrappers (exact order):**
  1. `LoadEnvironmentVariables` — Loads `.env` file via `Dotenv\Dotenv`.
  2. `LoadConfiguration` — Loads config files from `config/` into a `Repository` bound as `'config'`.
  3. `HandleExceptions` — Sets custom error/exception handlers and registers the debug page.
  4. `RegisterFacades` — Instantiates `AliasLoader` and registers facades from `config/app.php 'aliases'`.
  5. `RegisterProviders` — Iterates `config/app.php 'providers'` and calls `$app->register()` on each.
  6. `BootProviders` — Calls `$provider->boot()` on every registered provider.
- **`bootstrapWith(array $bootstrappers)`** — Iterates the bootstrapper array, resolves each from the container, calls `$bootstrapper->bootstrap($this)`. Sets `$this->hasBeenBootstrapped = true` before execution, `$this->booted = true` after.
- **Kernel-specific bootstrappers** — HTTP and Console kernels each define their own `$bootstrappers` array. The six core bootstrappers are present in both, though `HandleExceptions` behaves differently in CLI.
- **hasBeenBootstrapped guard** — After `bootstrapWith()` completes, all subsequent calls throw `LogicException`. This prevents re-bootstrap in Octane and long-running processes.

## When To Use
- Debugging service resolution failures where services are not yet available
- Understanding the exact timing of configuration loading vs provider registration
- Optimizing bootstrap performance by identifying the most expensive bootstrapper phase
- Designing custom bootstrappers for advanced framework initialization needs
- Auditing provider dependencies to prevent circular or ordering issues

## When NOT To Use
- Adding custom bootstrappers to the kernel's `$bootstrappers` array — this is not a supported extension point
- Skipping bootstrappers by modifying the kernel array — all six are required for proper framework operation
- Expecting config to be available before `LoadConfiguration` runs — use `boot()` not `register()` for config-dependent code
- Calling `bootstrapWith()` manually after the guard has been set — use `reset()` first in long-running processes

## Best Practices
- **Always run `php artisan config:cache` in production** — `LoadConfiguration` is the most expensive bootstrapper; caching reduces it from ~15ms to ~0.1ms.
- **Defer providers that only bind** — Implement `DeferrableProvider` to move providers from the `RegisterProviders` bootstrapper to lazy resolution.
- **Place config-dependent logic in `boot()` not `register()`** — Configuration is loaded before `RegisterProviders` but after providers are registered, so `register()` cannot safely access config.
- **Monitor boot time per provider** — `BootProviders` is often the heaviest phase; profile with Telescope or Clockwork to identify slow providers.
- WHY: The bootstrapper order is immutable — writing code that assumes a different order will break silently when the sequence does not match expectations.

## Architecture Guidelines
- Bootstrappers are not service providers — they run before providers are even registered, setting up infrastructure (environment, config, error handling) that providers depend on.
- The two-phase register/boot approach allows providers to register bindings in `register()` that other providers consume during `boot()` — without this separation, provider interdependency would require explicit ordering.
- `bootstrapWith()` uses simple `foreach` iteration — no parallelism because each step depends on the previous.
- The `hasBeenBootstrapped` guard is a binary lock — set to `true` after bootstrap completes, must be explicitly reset to `false` to allow re-bootstrap.

## Performance Considerations
- Total bootstrapper CPU cost: ~5–15ms per request in FPM (dominated by config parsing and provider registration).
- `LoadConfiguration` is the most expensive single bootstrapper: reads all `config/*.php` files (typically 20–40) using `file_get_contents()` and `array_replace_recursive()` for overrides.
- `RegisterProviders` cost scales linearly with provider count — a typical 30–50 providers adds 2–5ms.
- `BootProviders` triggers application-specific boot logic (DB queries, route registrations, view composers) — often the heaviest phase.
- Config caching reduces `LoadConfiguration` from file parsing to a single cached file read — 10x–50x speedup.
- In Octane, the entire sequence runs once per worker; cost is amortized across thousands of requests.

## Security Considerations
- `LoadEnvironmentVariables` reads `.env` — ensure file permissions restrict access to the web server user only.
- `HandleExceptions` enables detailed error output when `APP_DEBUG=true` — this can leak sensitive configuration in production if misconfigured.
- `RegisterFacades` reads `config/app.php 'aliases'` — validate that registered facades do not expose unintended service access.
- The bootstrapper sequence runs before the middleware pipeline — there is no request-level security during bootstrap.
- `HandleExceptions` registers `set_error_handler` and `set_exception_handler` — custom bootstrappers must respect these handlers to avoid uncaught errors.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Accessing `config()` in provider `register()` | Assuming config loads before providers | Returns null or wrong value | Use `boot()` for config-dependent code |
| Adding bootstrappers to kernel array | Extending kernel incorrectly | Sequence breaks — not a supported extension | Use service providers, booting callbacks, or middleware |
| Ignoring `HandleExceptions` impact | `APP_DEBUG=true` left on in production | Sensitive data leaked in error pages | Set `APP_DEBUG=false` in production; test error pages in staging |
| Expecting `env()` to work after `config:cache` | Confusing runtime vs cached behavior | `env()` returns null when config is cached | Use `config()` instead of `env()` in application code |
| Modifying `$bootstrappers` order | Attempting to customize initialization | Unpredictable failures from ordering violations | The bootstrapper sequence is immutable — extend via providers |

## Anti-Patterns
- **Bootstrapper manipulation** — Overriding `Kernel::$bootstrappers` to add, remove, or reorder bootstrappers; this voids framework guarantees.
- **Eager resolution in bootstrappers** — Calling `$app->make()` inside a bootstrapper for services that aren't yet registered.
- **Stateful bootstrappers** — Designing bootstrappers that leave request-scoped state in the container, causing leaks in Octane.
- **Config-dependent env() calls** — Using `env()` in config files after `config:cache`; cached config files resolve `env()` calls at cache-build time, not runtime.

## Examples

### Bootstrapper Execution Order
```php
// In Http\Kernel::handle():
// $this->bootstrappers() returns:
[
    \Illuminate\Foundation\Bootstrap\LoadEnvironmentVariables::class,
    \Illuminate\Foundation\Bootstrap\LoadConfiguration::class,
    \Illuminate\Foundation\Bootstrap\HandleExceptions::class,
    \Illuminate\Foundation\Bootstrap\RegisterFacades::class,
    \Illuminate\Foundation\Bootstrap\RegisterProviders::class,
    \Illuminate\Foundation\Bootstrap\BootProviders::class,
]

// bootstrapWith() calls:
foreach ($bootstrappers as $bootstrapper) {
    $this->make($bootstrapper)->bootstrap($this);
}
```

### What Each Bootstrapper Makes Available
```php
// After LoadEnvironmentVariables:
//   $_ENV populated from .env file
//   env() helper works (reads from $_ENV)

// After LoadConfiguration:
//   config() helper works
//   $app->make('config') returns Repository

// After HandleExceptions:
//   Custom error/exception handlers active
//   Ignition/whoops debug page registered

// After RegisterFacades:
//   Facades like Cache::, DB::, etc. work
//   AliasLoader auto-loads facade classes

// After RegisterProviders:
//   All service providers instantiated
//   register() called on each

// After BootProviders:
//   boot() called on each provider
//   Application fully initialized
```

## Related Topics
- **Prerequisites:** Application Class Construction, Application Builder Configuration
- **Closely Related:** Kernel Architecture (HTTP/Console), Service Provider Lifecycle, Bootstrap App PHP File
- **Advanced:** Config Caching Mechanics, Octane Request Lifecycle, Complete Boot Sequence
- **Cross-Domain:** Error Handling Configuration, Environment Management

## AI Agent Notes
The bootstrapper sequence is the framework's only opportunity to initialize itself before user code runs. Every bootstrapper is designed to be safely idempotent for Octane — they create state that survives across requests via the `hasBeenBootstrapped` guard. Any bootstrapper that creates request-scoped state would be a bug in the Octane model. The `bootstrapWith()` method is defined in `Illuminate\Foundation\Application` (line ~250). Each bootstrapper class lives in `Illuminate\Foundation\Bootstrap\*`. The kernel's `$bootstrappers` array is defined in `Http\Kernel` (line ~30) and `Console\Kernel` (line ~25). In Laravel 9+, `HandleExceptions` was updated to support Ignition v2. In Laravel 11, the sequence was formally documented as immutable and the guard hardened to throw `LogicException`.

## Verification
- [ ] `LoadEnvironmentVariables` runs first and loads `.env` correctly
- [ ] `LoadConfiguration` runs second and populates config repository
- [ ] `HandleExceptions` registers error/exception handlers successfully
- [ ] `RegisterFacades` loads facade aliases from config
- [ ] `RegisterProviders` calls `register()` on every provider in `config/app.php`
- [ ] `BootProviders` calls `boot()` on every registered provider
- [ ] `hasBeenBootstrapped()` returns `true` after sequence completes
- [ ] `bootstrapWith()` throws `LogicException` if called again
- [ ] Configuration is NOT accessible during `register()` but IS accessible during `boot()`
- [ ] `env()` helper works only after `LoadEnvironmentVariables` completes
