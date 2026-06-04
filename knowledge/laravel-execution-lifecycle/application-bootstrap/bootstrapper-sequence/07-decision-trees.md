# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Application Bootstrap
**Knowledge Unit:** Bootstrapper Sequence
**Generated:** 2026-06-03

---

# Decision Inventory

1. Config-Dependent Provider Logic: `register()` vs `boot()` placement
2. Bootstrapper Modification: Adding custom bootstrappers vs using providers
3. Env Helper Usage: `env()` vs `config()` after config caching
4. Bootstrap Guard Reset: When to call `reset()` before re-bootstrapping

---

# Architecture-Level Decision Trees

---

## Decision Name: Config-Dependent Provider Logic Placement

---

## Decision Context

Deciding whether to place configuration-dependent logic in a service provider's `register()` or `boot()` method.

---

## Decision Criteria

* performance — no difference; both execute during bootstrap
* architectural — `register()` runs before all providers are registered; `boot()` runs after
* security — accessing config in `register()` silently uses defaults, not configured values
* maintainability — `boot()` is the documented location for config-dependent logic

---

## Decision Tree

Does the code read configuration values (`config()`, `$this->app['config']`)?
↓
YES → Place in `boot()` — config is loaded before `BootProviders` but NOT safe in `register()`
NO → Does the code check environment values (`env()`, `APP_ENV`)?
↓
YES → Place in `boot()` if using `env()`; `$_ENV` direct reads are safe in `register()`
NO → Does the code register container bindings with no external dependencies?
↓
YES → Safe to place in `register()` — the primary purpose of the `register()` method
NO → Does the code depend on other providers' bindings?
↓
YES → Place in `boot()` — all providers are registered before `BootProviders` runs
NO → Use `register()` for pure registration logic; `boot()` for anything that reads state

---

## Rationale

The bootstrapper sequence guarantees `LoadConfiguration` runs before `RegisterProviders` and `BootProviders`, but providers are instantiated during `RegisterProviders` and their `register()` method executes before `BootProviders`. At `register()` time, configuration is loaded but other providers' `register()` may not have run yet. At `boot()` time, all providers are registered and configuration is guaranteed available. Config reads in `register()` produce intermittent `null` values.

---

## Recommended Default

**Default:** `register()` for container bindings only; `boot()` for any logic that reads config, env, or other providers' bindings.
**Reason:** Guarantees ordering safety — all dependencies are available in `boot()`.

---

## Risks Of Wrong Choice

- Config reads in `register()`: returns `null` or default values intermittently, especially when config caching is enabled or providers are deferred.
- Environment checks in `register()`: `env()` works here (LoadEnvironmentVariables runs first) but `config()` may not — mixing env and config patterns is confusing.
- Heavy logic in `register()`: blocks the `RegisterProviders` bootstrapper phase, slowing bootstrap for all subsequent providers.

---

## Related Rules

- Place all config-dependent logic in `boot()` not `register()` (05-rules.md, Rule 1)
- Never call `env()` helper in application code after `php artisan config:cache` (05-rules.md, Rule 3)

---

## Related Skills

- Diagnose Bootstrap-Order Bugs (06-skills.md)
- Register Service Providers (service-providers)

---

## Decision Name: Bootstrapper Modification Strategy

---

## Decision Context

Deciding whether to modify the kernel's `$bootstrappers` array to add custom initialization logic, or use alternative extension points.

---

## Decision Criteria

* performance — custom bootstrappers add to bootstrap time
* architectural — the six-bootstrapper sequence is an immutable framework contract
* security — custom bootstrappers run before middleware, outside request context
* maintainability — modifying the array voids framework guarantees

---

## Decision Tree

Do you need custom logic that runs during application initialization?
↓
YES → Can the logic run in a service provider's `boot()` method?
YES → Use a service provider — the documented extension point
NO → Can the logic run in a `booting()`/`booted()` callback?
↓
YES → Register via ApplicationBuilder `->booting()` or `->booted()`
NO → Can the logic run as middleware?
↓
YES → Use middleware — runs during the request pipeline, has access to request context
NO → Is the logic so fundamental that it must run before service providers?
↓
YES → Consider a custom bootstrapper ONLY if absolutely necessary — this is not a supported extension point
NO → Avoid modifying `$bootstrappers` — it is not a supported extension point

---

## Rationale

The six-bootstrapper sequence (`LoadEnvironmentVariables → LoadConfiguration → HandleExceptions → RegisterFacades → RegisterProviders → BootProviders`) is an immutable framework contract. Each bootstrapper sets up infrastructure that the next depends on. Adding, removing, or reordering violates these dependencies and voids framework guarantees. Service providers, lifecycle callbacks, and middleware cover virtually all extension needs.

---

## Recommended Default

**Default:** Use service providers for initialization logic; use `booting()` for logic that must run before providers boot.
**Reason:** Documented, supported extension points that respect the bootstrapper ordering contract.

---

## Risks Of Wrong Choice

- Adding a bootstrapper before `LoadEnvironmentVariables`: your bootstrapper has no access to `.env` values.
- Removing `LoadConfiguration`: all subsequent config-dependent code (including `HandleExceptions`) fails silently.
- Reordering bootstrappers: framework code that assumes a specific phase is complete will break unpredictably.

---

## Related Rules

- Never modify the kernel's `$bootstrappers` array (05-rules.md, Rule 2)

---

## Related Skills

- Diagnose Bootstrap-Order Bugs (06-skills.md)
- Configure Application via ApplicationBuilder (application-builder-configuration)

---

## Decision Name: Env Helper Usage Strategy

---

## Decision Context

Choosing between `env()` and `config()` helpers in application code, particularly with respect to `php artisan config:cache`.

---

## Decision Criteria

* performance — both are O(1) after caching
* architectural — `env()` resolves at call time; `config()` reads from repository
* security — `env()` returning `null` after caching is a silent failure
* maintainability — `config()` is the correct holistic access pattern

---

## Decision Tree

Is the code in a `config/*.php` file?
↓
YES → Use `env()` with a default value — config files execute during `LoadConfiguration`, before config is cached
NO → Will `php artisan config:cache` be used in production?
↓
YES → Use `config()` — after caching, `env()` returns `null` for any key not in `$_ENV` at build time
NO → Is the code in application logic (providers, controllers, middleware, commands)?
↓
YES → Use `config()` — consistent access pattern, works with and without caching
NO → Is the code in a bootstrapper or very early initialization (before `LoadConfiguration`)?
↓
YES → Use `$_ENV` directly — neither `env()` nor `config()` is available yet
NO → Use `config()` — the standard access pattern

---

## Rationale

When `config:cache` is enabled, config files are serialized and `env()` calls inside them are resolved at cache-build time. After caching, `env()` returns `null` for any key not present in `$_ENV` at build time. `config()` reads from the cached repository and always returns the cached value. The correct pattern is: `env()` only in `config/*.php` files (with defaults), `config()` everywhere else.

---

## Recommended Default

**Default:** `config('app.key')` or `config('database.default')` in all application code; `env('APP_KEY')` only in `config/app.php`.
**Reason:** Consistent access pattern that works identically with and without config caching.

---

## Risks Of Wrong Choice

- Using `env()` in application code after `config:cache`: returns `null` — application uses null/empty values instead of configured secrets.
- Using `config()` in `config/*.php` files before the repository is fully populated: reads unexpected values or triggers recursive resolution.
- Mixing `env()` and `config()` for the same value: inconsistent results depending on caching state.

---

## Related Rules

- Never call `env()` helper in application code after `php artisan config:cache` (05-rules.md, Rule 3)
- Place all config-dependent logic in `boot()` not `register()` (05-rules.md, Rule 1)

---

## Related Skills

- Diagnose Bootstrap-Order Bugs (06-skills.md)
