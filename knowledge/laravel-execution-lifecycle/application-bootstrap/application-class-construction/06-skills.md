# Skill: Bootstrap a Laravel Application Instance

## Purpose

Create and configure a new Laravel `Application` instance — the foundational step in every Laravel request lifecycle — using either the modern `Application::configure()` factory (Laravel 11+) or direct construction (pre-Laravel 11).

## When To Use

- Setting up the entry point for a Laravel application (`bootstrap/app.php`)
- Understanding what the constructor establishes before any bootstrapper runs
- Debugging early bootstrap failures where the container is not yet populated
- Building custom framework distributions that need a modified bootstrap sequence

## When NOT To Use

- Calling `new Application(...)` directly in Laravel 11+ — always use `Application::configure()` instead (the builder ensures proper setup)
- Adding application-specific bindings in the Application constructor — use service providers or the ApplicationBuilder
- Expecting configuration or environment variables to be available immediately after construction
- Manually constructing an Application instance in application code — the framework entry points handle this

## Prerequisites

- Composer autoloader loaded and `Illuminate\Foundation\Application` resolvable
- For Laravel 11+: `bootstrap/app.php` as the configuration file
- Understanding of the Service Container and singleton bindings

## Inputs

- `basePath` (optional) — Absolute filesystem path to the application root; defaults to `dirname(__DIR__, 3)` from the framework source
- For Laravel 11+: `Application::configure(basePath: ...)` static factory with builder chain
- For pre-Laravel 11: `new Application($basePath)` constructor call

## Workflow

1. Ensure Composer autoloader is required in the entry point (`public/index.php`, `artisan`, or Octane worker)
2. For Laravel 11+:
   a. Call `Application::configure(basePath: dirname(__DIR__))` in `bootstrap/app.php`
   b. Chain configuration methods (`withRouting()`, `withMiddleware()`, etc.)
   c. Terminate with `->create()` to return the Application instance
3. For pre-Laravel 11:
   a. Instantiate `new Illuminate\Foundation\Application($basePath)`
   b. Bind kernel contracts manually: `$app->singleton(HttpKernel::class, ...)`
4. Verify the instance resolves via `$app->make('app')` and `Container::getInstance()`
5. Confirm `hasBeenBootstrapped()` returns `false` before any bootstrappers run
6. Confirm `runningInConsole()` returns the correct boolean for the current SAPI

## Validation Checklist

- [ ] `$app->make('app')` returns the Application instance
- [ ] `$app->make(Container::class)` returns the same instance as `$app->make('app')`
- [ ] `$app->make(Psr\Container\ContainerInterface::class)` also returns the same instance
- [ ] All three base service providers (Event, Log, Routing) are registered (not yet booted)
- [ ] At least 60 core aliases are registered in the aliases array
- [ ] `$app->make('config')` throws `BindingResolutionException` (config not yet loaded)
- [ ] `runningInConsole()` matches the current PHP SAPI
- [ ] `hasBeenBootstrapped()` returns `false`
- [ ] Base path binding exists via `$app->make('path.base')`

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| `BindingResolutionException` when calling `app('config')` | Config not loaded — constructor only establishes base bindings | Wait for `LoadConfiguration` bootstrapper before accessing config |
| Incorrect path resolution | No base path passed, or non-standard directory layout | Always pass explicit `basePath` in non-standard deployments |
| Type error at entry point | `->create()` omitted — builder returned instead of Application | Always terminate the builder chain with `->create()` |
| `runningInConsole()` returns wrong value | Custom PHP SAPI | Verify `PHP_SAPI` value matches expected; use `$_ENV['APP_RUNNING_IN_CONSOLE']` override if needed |

## Decision Points

- **`Application::configure()` vs `new Application()`** — Always use `Application::configure()` in Laravel 11+; only use `new Application()` when building a custom framework distribution that needs to subclass and extend the constructor
- **Explicit vs default base path** — Pass explicit `basePath` for non-standard directory layouts (serverless, monorepos, Phar); omit for standard Laravel installations

## Performance Considerations

- Constructor cost: ~0.3-0.5ms for base service provider registrations, ~0.1ms for alias population
- In Octane, constructor runs once per worker — cost amortized across thousands of requests
- The `$aliases` array registration is ~120-150 method calls at <0.15ms total
- Path binding is a single `$this->instance()` call — negligible cost

## Security Considerations

- The constructor registers `Psr\Container\ContainerInterface` binding — any PSR-11-aware library gets full container access
- `runningInConsole()` uses `PHP_SAPI` — can be spoofed with custom PHP SAPIs
- Base path fallback (`dirname(__DIR__, 3)`) assumes standard vendor layout — n explicit path prevents path traversal confusion in hardened deployments

## Related Rules

- Always use `Application::configure()->create()` over `new Application()` in Laravel 11+ (05-rules.md, Rule 1)
- Never modify the Application constructor or add bindings in constructor subclasses (05-rules.md, Rule 2)
- Never call `app('config')` or any non-base binding immediately after construction (05-rules.md, Rule 3)
- Always pass explicit `basePath` in non-standard directory layouts (05-rules.md, Rule 4)

## Related Skills

- Configure Application via ApplicationBuilder (application-builder-configuration)
- Register Core Aliases and Base Bindings (base-bindings-and-core-aliases)
- Create a Laravel Bootstrap File (bootstrap-app-php-file)

## Success Criteria

- Application instance is fully constructed with all base bindings in place
- All three entry points (`index.php`, `artisan`, Octane) accept and use the instance
- `$app->make('app')` succeeds immediately after construction
- The instance is ready for the bootstrapper sequence to run

---

# Skill: Debug Application Construction Failures

## Purpose

Diagnose and resolve failures that occur during the Laravel Application constructor phase — before any bootstrapper has run — where the container holds only base bindings and aliases.

## When To Use

- `BindingResolutionException` occurs for services that should be available but are not
- Entry points (`index.php`, `artisan`) crash immediately with no application-level error handling
- Path resolution returns wrong directories in non-standard deployments
- `runningInConsole()` returns incorrect values
- Octane workers fail during initialization

## When NOT To Use

- Errors that occur after the bootstrapper sequence has started (belong to bootstrapper-sequence skills)
- Errors in service provider registration or boot logic (belong to service provider debugging skills)
- Runtime request errors (belong to middleware or controller debugging skills)

## Prerequisites

- Access to the entry point file (`public/index.php`, `artisan`)
- Access to `bootstrap/app.php`
- Ability to run PHP with error reporting enabled
- Knowledge of the Application constructor call chain: `registerBaseBindings()` → `registerBaseServiceProviders()` → `registerCoreContainerAliases()`

## Inputs

- Error messages and stack traces from the failing entry point
- The `bootstrap/app.php` file contents
- The environment configuration (`.env`, directory structure)
- The Composer autoloader configuration (`composer.json`)

## Workflow

1. Examine the stack trace — if it originates from `Illuminate\Foundation\Application::__construct()`, this is a construction failure
2. Check that `->create()` is present at the end of the builder chain in `bootstrap/app.php`
3. Verify the `Application::configure(basePath: ...)` argument matches the actual project root
4. Check `composer.json` PSR-4 autoload configuration — the namespace must match the application structure
5. If using `new Application(...)` directly, ensure the base path resolves to the correct directory
6. Confirm that no code inside `bootstrap/app.php` calls `$app->make()` for non-base bindings
7. Test `runningInConsole()` by checking `PHP_SAPI` value directly
8. Run `php -l bootstrap/app.php` to check for syntax errors
9. Verify OPcache is not serving a stale compiled version of `bootstrap/app.php` — clear OPcache if needed

## Validation Checklist

- [ ] Stack trace identified as constructor-phase (not bootstrapper or provider phase)
- [ ] `->create()` terminates the builder chain
- [ ] Base path resolves to the correct project root directory
- [ ] No `$app->make()` calls in `bootstrap/app.php` for non-base bindings
- [ ] `composer.json` PSR-4 autoload entry matches the application namespace
- [ ] `php -l bootstrap/app.php` passes without syntax errors
- [ ] OPcache has been cleared (if enabled) after file changes
- [ ] `PHP_SAPI` value is correct for the execution context

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| `BindingResolutionException` for `'config'` | Code accesses config before LoadConfiguration bootstrapper | Move config access to `boot()` method, not `register()` |
| Path helpers return wrong directories | Missing or incorrect `basePath` argument | Pass explicit `basePath` to `Application::configure()` |
| Entry point returns type error | `->create()` omitted from builder chain | Add `->create()` to return Application, not ApplicationBuilder |
| Composer class not found | Autoloader not required before bootstrap | Ensure `vendor/autoload.php` is required in `public/index.php` |
| All services resolve to null | Container state corrupted | Reconstruct Application — check for OPcache corruption |

## Decision Points

- **Builder chain vs direct construction** — If using `new Application(...)`, migrate to `Application::configure()->create()` for Laravel 11+ compatibility
- **Constructor failure vs bootstrapper failure** — Constructor failures occur before any bootstrapper runs; bootstrapper failures occur during the six-phase sequence

## Performance Considerations

- Constructor failures are always fatal — the application cannot recover without a new instance
- In Octane, constructor failures cause worker crashes; the process manager spawns a replacement worker
- OPcache may serve stale compiled code — use `opcache_reset()` in deployment scripts

## Security Considerations

- Constructor failures produce raw PHP errors before error handlers are registered — stack traces may expose filesystem paths and internal code structure in production
- Ensure `display_errors=Off` and `log_errors=On` in production `php.ini` to prevent sensitive information disclosure

## Related Rules

- Always use `Application::configure()->create()` over `new Application()` (05-rules.md, Rule 1)
- Never modify the Application constructor or add bindings in constructor subclasses (05-rules.md, Rule 2)
- Never call `$this->make()` inside `registerBaseBindings()` or `registerBaseServiceProviders()` (05-rules.md, Rule 5)

## Related Skills

- Bootstrap a Laravel Application Instance (this KU)
- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)
- Create a Laravel Bootstrap File (bootstrap-app-php-file)

## Success Criteria

- The failing entry point (`index.php`, `artisan`, or Octane worker) starts successfully
- The Application instance is constructed with correct base path and aliases
- No construction-phase `BindingResolutionException` occurs
- All three base service providers are registered correctly
