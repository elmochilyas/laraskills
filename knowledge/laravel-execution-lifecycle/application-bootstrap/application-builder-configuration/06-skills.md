# Skill: Configure Application via ApplicationBuilder

## Purpose

Set up the Laravel Application routing, middleware, exception handling, and container bindings using the fluent `ApplicationBuilder` API in `bootstrap/app.php` (Laravel 11+).

## When To Use

- Initializing a new Laravel 11+ project's `bootstrap/app.php`
- Adding routing, middleware, or exception handling configuration at the framework level
- Pre-registering container singletons, bindings, or scoped singletons at bootstrap time
- Adding `booting()` or `booted()` lifecycle callbacks that must run during application initialization

## When NOT To Use

- Placing business logic or heavy computation inside builder closures
- Capturing request-scoped variables in `booting()` or `booted()` closures (Octane memory leaks)
- Configuring services that depend on environment variables before `LoadEnvironmentVariables` runs
- Registering bindings in the builder that are also registered in a service provider (duplicate registration race)

## Prerequisites

- Laravel 11+ application
- Understanding of the Service Container (singleton, scoped, bind)
- Knowledge of `bootstrap/app.php` as the single entry point configuration file

## Inputs

- `basePath` — Root filesystem path for the application
- Route file paths (`web`, `api`, `commands`, `channels`)
- Middleware configuration closures
- Exception handling configuration closures
- Singleton/binding arrays mapping contracts to concretions
- Lifecycle callback closures

## Workflow

1. Open `bootstrap/app.php` and start with `return Application::configure(basePath: dirname(__DIR__))`
2. Chain `->withRouting()` to register web, API, console, and health route files
3. Chain `->withMiddleware()` to configure global middleware stack, aliases, and groups
4. Chain `->withExceptions()` to configure exception reporting, rendering, and ignoring logic
5. Chain `->withCommands()` to register Artisan command classes
6. Chain `->withSingletons()` to bind contracts to concretions as true singletons
7. Chain `->withBindings()` for standard (non-singleton) interface-to-class mappings
8. Chain `->withBroadcasting()` and `->withEvents()` if your application uses these features
9. Chain `->booting(function ($app) { ... })` for logic that runs right before service providers boot
10. Terminate the chain with `->create()` and ensure the file returns the result

## Validation Checklist

- [ ] `->create()` is the final method call in the builder chain
- [ ] All `with*()` method signatures match the current Laravel version (11+)
- [ ] No request-scoped variables (`$request`, user data) are captured in closures
- [ ] No duplicate binding registration between builder and service providers
- [ ] `withRouting()` precedes `withMiddleware()` when middleware references route groups
- [ ] No secrets (API keys, passwords) are hardcoded in builder closures
- [ ] Environment-specific branching uses `$app->runningInConsole()` or `$app->environment()`
- [ ] Builder chain is minimal — only includes methods for subsystems the application uses

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| Runtime type error on entry points | Missing `->create()` at chain end | Append `->create()` to return Application, not ApplicationBuilder |
| Memory leak in Octane | Captured `$request` in builder closure | Remove request-scoped variables from closures |
| Middleware config silently not applied | `withMiddleware()` called before `withRouting()` | Reorder: `withRouting()` then `withMiddleware()` |
| Binding resolved to wrong concrete | Duplicate binding in builder and provider | Move registration to single location only |

## Decision Points

- **`withRouting()` vs route service provider** — Use `withRouting()` for simple file-path configuration; use `RouteServiceProvider` for advanced route model binding, middleware groups, or pattern filters
- **`withSingletons()` vs service provider** — Use `withSingletons()` for simple class mappings; use a service provider when the binding needs setup logic, config reads, or dependency injection
- **`booting()` vs middleware** — Use `booting()` for framework-wide setup before providers boot; use middleware for per-request logic
- **Environment branching** — Use `$app->runningInConsole()` to register console-only commands; use `$app->environment()` for deployment-environment-specific configuration

## Performance Considerations

- Builder overhead added: ~0.2ms per builder method in the chain
- Deferred callbacks from `with*()` consume memory proportional to chain length (~5-10 closures is negligible)
- Configurator objects (Routing, Middleware, Exceptions) are serialized into the container — avoid request-scoped state
- Route, config, and middleware caching via `php artisan optimize` captures builder-configured routes

## Security Considerations

- Builder closures capturing secrets (API keys) preserve them in memory across all Octane requests
- `withExceptions()` callbacks must not leak sensitive data in error responses
- Environment-specific branches using `$app->environment()` are case-sensitive — misspelled names silently evaluate to false
- All middleware classes in `withMiddleware()` must be trusted and properly namespaced

## Related Rules

- Always terminate builder chain with `->create()` (05-rules.md, Rule 1)
- Never capture request-scoped variables in builder closures (05-rules.md, Rule 2)
- Prefer `Application::configure()` over manual kernel binding (05-rules.md, Rule 3)
- Never place business logic in builder closures (05-rules.md, Rule 4)
- Call `withRouting()` before `withMiddleware()` when middleware depends on routes (05-rules.md, Rule 5)

## Related Skills

- Bootstrap a Laravel Application Instance (application-class-construction)
- Create a Laravel Bootstrap File (bootstrap-app-php-file)
- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)

## Success Criteria

- `bootstrap/app.php` returns an `Illuminate\Foundation\Application` instance
- Routing, middleware, and exceptions are configured correctly per the application's needs
- Container bindings registered via the builder resolve correctly in service providers and controllers
- All entry points (`index.php`, `artisan`, Octane) load the application without errors
- `php artisan about` displays the correct application state

---

# Skill: Register Container Bindings in Bootstrap

## Purpose

Register service container singletons, scoped singletons, and interface-to-class bindings directly in `bootstrap/app.php` using `withSingletons()`, `withScopedSingletons()`, and `withBindings()`.

## When To Use

- Binding simple class-to-class or interface-to-class mappings that need no setup logic
- Registering services that must be available to all service providers during boot
- Overriding package-provided bindings with application-specific implementations
- Pre-configuring bindings before any service provider's `register()` or `boot()` runs

## When NOT To Use

- Binding services that require complex setup logic, configuration reading, or dependency injection — use a service provider instead
- Registering the same binding in both the builder and a service provider (race condition)
- Binding request-scoped services that need to be fresh per request — use `$app->scoped()` in a provider instead
- Registering services whose concrete depends on environment variables loaded after bootstrap

## Prerequisites

- Working `bootstrap/app.php` with `Application::configure()` chain
- Understanding of container binding types: singleton, scoped, and standard bindings
- Familiarity with `ApplicationBuilder::withSingletons()`, `withScopedSingletons()`, `withBindings()`

## Inputs

- Array of `abstract => concrete` class string pairs for singletons
- Array of `abstract => concrete` pairs for scoped singletons
- Array of `abstract => concrete` pairs for standard bindings
- Optional factory closures for bindings that need simple instantiation

## Workflow

1. Identify bindings that belong at the bootstrap level (simple mappings, no setup logic)
2. Add `->withSingletons([...])` with `abstract => concrete` pairs for cross-request services
3. Add `->withScopedSingletons([...])` for services that must be fresh per request in long-running processes
4. Add `->withBindings([...])` for interfaces that should produce a new instance each resolution
5. Keep factory closures in `withSingletons()` under 3 lines — move complex logic to a service provider
6. Verify no binding key is registered both here and in any service provider

## Validation Checklist

- [ ] No binding key appears in both `withSingletons()` and a service provider
- [ ] Factory closures in `withSingletons()` do not read config or perform I/O
- [ ] Scoped singletons are used for request-scoped data in Octane-compatible applications
- [ ] All abstract keys use interface or class constants, not magic strings
- [ ] Singleton entries are simple class-to-class mappings (not complex factories)

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| Binding resolved to unexpected concrete | Duplicate in builder and provider | Keep registration in one place only |
| Complex factory untestable | Logic in `withSingletons()` closure | Move to service provider's `register()` |
| Binding not surviving flush in Octane | Not using `reset()` between requests | Use `reset()` or accept binding is request-scoped |

## Decision Points

- **`withSingletons()` vs `withScopedSingletons()`** — Use `withSingletons()` for application-wide state (connection pools, rate limiters); use `withScopedSingletons()` for request-scoped state (cart, user context)
- **Simple mapping vs factory closure** — Prefer `Interface::class => Concrete::class` strings; use factory closures only for 2-3 line constructors

## Performance Considerations

- Singleton bindings persist in container until `flush()` — negligible overhead per binding
- Scoped singletons are cleared on `flush()` — zero residual memory between requests
- Factory closures in builder are registered but not executed until first resolution

## Security Considerations

- Factory closures that capture variables at registration time persist across requests in Octane
- Do not pass raw secrets into factory closures — use config values loaded after bootstrappers run

## Related Rules

- Do not register the same binding in both builder and service provider (05-rules.md, Rule 6)
- Use `withSingletons()` exclusively for bindings needing cross-request persistence (05-rules.md, Rule 7)
- Use `scoped()` instead of `singleton()` for fresh-per-request bindings (application-flush-and-reset, Rule 5)

## Related Skills

- Configure Application via ApplicationBuilder (this KU)
- Reset Application State Between Octane Requests (application-flush-and-reset)
- Write Environment-Aware Service Providers (path-helpers-and-environment-detection)

## Success Criteria

- All bindings registered via builder resolve correctly via `app()->make()`
- Factory closures execute lazily (on first resolution, not at registration time)
- No `BindingResolutionException` for bootstrap-registered bindings
- Bindings are not accidentally overridden by service providers

---

# Skill: Add Lifecycle Hooks During Bootstrap

## Purpose

Register `booting()` and `booted()` lifecycle callbacks in the `ApplicationBuilder` chain to execute custom logic at precise points during the application initialization sequence.

## When To Use

- Performing framework-wide setup that must run before any service provider's `boot()` method
- Configuring container state that other booting callbacks or providers depend on
- Implementing cross-cutting initialization that applies to all environments
- Registering deferred configuration that must execute during the booting or booted lifecycle phases

## When NOT To Use

- Capturing request-scoped variables inside lifecycle hooks (causes memory leaks in Octane)
- Performing I/O or API calls inside hooks (blocks bootstrap on every request or worker start)
- Replacing service provider logic with lifecycle hooks (providers are the correct abstraction)
- Registering middleware or route-specific logic in lifecycle hooks (use middleware instead)

## Prerequisites

- Understanding of the bootstrapper sequence (LoadEnvironmentVariables → ... → BootProviders)
- Knowledge of when `booting()` vs `booted()` fires relative to service providers
- Awareness of Octane's single-worker-initialization model

## Inputs

- `booting(Closure $callback)` — Callback receives `$app`; runs after all base bootstrappers but before provider `boot()`
- `booted(Closure $callback)` — Callback receives `$app`; runs after all providers have booted

## Workflow

1. Identify logic that must run before provider boot — add `->booting(function ($app) { ... })` to the builder chain
2. Identify logic that must run after all providers have booted — add `->booted(function ($app) { ... })`
3. Ensure closures use `$app` parameter only — do not `use` variables from outer scope
4. Keep closures pure (no side effects on global state, no I/O)
5. Verify closures are serializable (no resource handles, no closures that capture non-serializable objects)

## Validation Checklist

- [ ] `booting()` callbacks do not read config or environment (may not be loaded yet)
- [ ] `booted()` callbacks can safely read config and resolve all bound services
- [ ] No `use` statements in closures that capture request-scoped variables
- [ ] Callbacks are idempotent — safe to run once per worker in Octane
- [ ] No I/O operations (HTTP calls, database queries) in either callback

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| `BindingResolutionException` in `booting()` | Resolving a service not yet registered | Move resolution to `booted()` or a provider's `boot()` |
| Memory leak in Octane | Closure captures `$request` or user data | Remove `use` variables; use `$app` parameter only |
| Side effects run twice | `booting()` runs on each worker start, not each request | Make callbacks idempotent |

## Decision Points

- **`booting()` vs `booted()`** — Use `booting()` for logic that must run before provider boot (registering early bindings); use `booted()` for logic that depends on fully booted providers
- **Lifecycle hook vs service provider** — Use lifecycle hooks for framework-wide, cross-cutting initialization; use service providers for domain-specific binding and boot logic

## Performance Considerations

- Each lifecycle callback is a closure stored in SplObjectStorage — memory cost per callback is negligible (~few hundred bytes)
- In Octane, `booting()` and `booted()` run once per worker, not per request — cost is fully amortized
- Heavy logic in hooks blocks worker initialization — keep under 1ms total

## Security Considerations

- Closures that capture secrets in their `use` clause expose those secrets in memory across all Octane requests
- `booted()` runs after error handlers are active — uncaught exceptions in callbacks may expose stack traces

## Related Rules

- Never capture request-scoped variables in builder closures (05-rules.md, Rule 2)
- Never place business logic inside builder closures (05-rules.md, Rule 4)
- Place all config-dependent logic in `boot()` not `register()` (bootstrapper-sequence, Rule 1)

## Related Skills

- Configure Application via ApplicationBuilder (this KU)
- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)
- Write Environment-Aware Service Providers (path-helpers-and-environment-detection)

## Success Criteria

- `booting()` callbacks execute at the correct phase (before provider `boot()`)
- `booted()` callbacks execute after all providers have booted
- No `BindingResolutionException` from either callback type
- Callbacks are idempotent and safe for Octane's multi-request lifecycle
