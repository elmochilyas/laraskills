# ECC Anti-Patterns — Bootstrapper Sequence

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Application Bootstrap |
| **Knowledge Unit** | Bootstrapper Sequence |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Bootstrapper Manipulation
2. Eager Resolution in Bootstrappers
3. Stateful Bootstrappers
4. Config-Dependent `env()` Calls
5. Accessing Config in `register()` Before Providers Boot

---

## Repository-Wide Anti-Patterns

- Premature Caching — caching config values before `LoadConfiguration` runs caches the wrong values.
- Hidden Database Queries — bootstrappers that trigger database calls during initialization.

---

## Anti-Pattern 1: Bootstrapper Manipulation

### Category
Architecture

### Description
Overriding `Kernel::$bootstrappers` to add, remove, or reorder the six core bootstrappers. The bootstrapper sequence is hardcoded and immutable — each step depends on the previous.

### Why It Happens
Developers need custom initialization logic and assume modifying the kernel bootstrapper array is the correct extension point. They don't realize service providers, `booting()` callbacks, and middleware are the supported mechanisms.

### Warning Signs
- Custom `Kernel` subclass overrides `$bootstrappers` property
- Bootstrapper array modified in `Kernel::bootstrappers()` method
- Bootstrap order changed to optimize for specific scenario

### Why It Is Harmful
The six bootstrappers have strict ordering dependencies. Removing or reordering breaks framework guarantees. `LoadConfiguration` must run before `RegisterFacades`, which must run before `RegisterProviders`. Violating this causes unpredictable `BindingResolutionException`.

### Real-World Consequences
A team removes `HandleExceptions` from the bootstrapper array to "speed up" the bootstrap. Production crashes with uncaught exceptions because the custom error handler is never registered. Every error silently fails without logging.

### Preferred Alternative
Use service providers, `booting()`/`booted()` callbacks, or middleware for custom initialization logic. The bootstrapper sequence is not a supported extension point.

### Refactoring Strategy
1. Remove kernel bootstrapper overrides
2. Move custom initialization to service providers
3. If timing-specific logic is needed, use lifecycle hooks (`booting()`, `booted()`)
4. If request-specific, use middleware

### Detection Checklist
- [ ] `Kernel::$bootstrappers` overridden in custom kernel
- [ ] Bootstrapper array modified at runtime
- [ ] Custom bootstrappers added to the kernel

### Related Rules
Rule 1 (05-rules.md): Never modify the kernel bootstrapper array — it is not a supported extension point.

### Related Skills
Understand Bootstrap Order and Timing (06-skills.md).

### Related Decision Trees
Bootstrapper Customization vs Provider decision (07-decision-trees.md).

---

## Anti-Pattern 2: Eager Resolution in Bootstrappers

### Category
Reliability

### Description
Calling `$app->make()` inside a bootstrapper for services that aren't yet registered. Bootstrappers run sequentially, and each depends on the state established by previous bootstrappers.

### Why It Happens
Developers write custom bootstrappers that try to resolve services not yet available. They assume the full container is accessible because the Application exists.

### Warning Signs
- Custom bootstrapper calls `$app->make()` for arbitrary services
- `BindingResolutionException` during bootstrapper execution
- Service resolution order assumptions that break in Octane

### Why It Is Harmful
Each bootstrapper runs at a specific point in the initialization sequence. Trying to resolve services before their bootstrapper has run fails with exceptions or returns null values that propagate silently.

### Real-World Consequences
A custom bootstrapper calls `config('app.name')` before `LoadConfiguration` runs. The config repository doesn't exist yet, so the call returns null. Downstream code uses null as the application name, causing email subjects, logging, and notification channels to fail silently.

### Preferred Alternative
Access services only after their corresponding bootstrapper has completed. Use `boot()` in service providers for application code that depends on configuration.

### Refactoring Strategy
1. Identify which bootstrapper must run before the required service is available
2. Move the logic to the appropriate phase (provider `boot()`, middleware, controller)
3. Use lifecycle hooks instead of custom bootstrappers

### Detection Checklist
- [ ] Custom bootstrapper calls `$app->make()` or `config()`
- [ ] Service resolution fails during bootstrapper execution

### Related Rules
Rule 2 (05-rules.md): Never resolve services in bootstrappers before their required bootstrapper phase.

### Related Skills
Understand Bootstrap Order and Timing (06-skills.md).

### Related Decision Trees
Bootstrapper Extension Point Timing decision (07-decision-trees.md).

---

## Anti-Pattern 3: Stateful Bootstrappers

### Category
Performance

### Description
Designing bootstrappers that leave request-scoped state in the container or in static properties, causing memory leaks in Octane where the bootstrapper sequence runs once per worker.

### Why It Happens
Bootstrappers are written without considering that in Octane, the bootstrap sequence runs once and the state persists across thousands of requests. Per-request data set during bootstrap pollutes subsequent requests.

### Warning Signs
- Custom bootstrapper sets user-specific data in the container
- Bootstrapper creates bindings that vary by request context
- Static properties modified in bootstrappers

### Why It Is Harmful
Bootstrappers run once per worker in Octane. Any state they create persists across all requests handled by that worker. Request-scoped state set during bootstrap becomes shared across users.

### Real-World Consequences
A custom bootstrapper captures the first request's locale and sets `App::setLocale()` during initialization. In Octane, this locale persists for all subsequent requests, serving the wrong language to every user after the first request.

### Preferred Alternative
Use scoped bindings, middleware, or request lifecycle hooks for per-request state. Bootstrappers should only set framework-level configuration that is truly application-wide and immutable.

### Refactoring Strategy
1. Identify request-scoped state in custom bootstrappers
2. Move to middleware for per-request initialization
3. Use scoped container bindings for state that varies per request

### Detection Checklist
- [ ] Bootstrapper sets values that vary per request
- [ ] Octane memory grows over time
- [ ] First request's state leaks to subsequent requests

### Related Rules
Rule 3 (05-rules.md): Bootstrappers must be stateless with respect to request context.

### Related Skills
Write Octane-Safe Bootstrappers (06-skills.md).

### Related Decision Trees
Bootstrapper Octane Safety decision (07-decision-trees.md).

---

## Anti-Pattern 4: Config-Dependent `env()` Calls

### Category
Reliability

### Description
Using `env()` in config files after `php artisan config:cache` has been run. Cached config files resolve `env()` calls at cache-build time, not at runtime.

### Why It Happens
Developers use `env()` in config files because it's convenient and works in local development. They don't realize that `config:cache` reads and serializes all config values, including resolving `env()` calls at build time.

### Warning Signs
- `env()` calls present in `config/*.php` files
- After `config:cache`, `env()` returns null or stale values
- Config values differ between cached and uncached environments

### Why It Is Harmful
After `config:cache`, `env()` calls in config files are resolved once during cache building. The original `env()` call is lost — only the resolved value remains. Changing `.env` without clearing the cache has no effect.

### Real-World Consequences
A team updates `.env` with a new database password but forgets to run `php artisan config:clear`. The cached config still has the old password. Production database connections fail with authentication errors during the deployment.

### Preferred Alternative
Always use `config()` helper in application code. Use `env()` only in config files, understanding that `config:cache` resolves them at build time.

### Refactoring Strategy
1. Find all `env()` calls in application code (outside config files)
2. Replace with `config('file.key')` calls
3. Ensure the config file uses `env()` for default values

### Detection Checklist
- [ ] `env()` used in application code outside `config/*.php`
- [ ] `env()` returns null after `config:cache`
- [ ] Config values don't update after `.env` changes

### Related Rules
Rule 4 (05-rules.md): Use `env()` only in config files — use `config()` everywhere else.

### Related Skills
Optimize Bootstrap Performance (06-skills.md).

### Related Decision Trees
Config Cache Build vs Runtime decision (07-decision-trees.md).

---

## Anti-Pattern 5: Accessing Config in `register()` Before Providers Boot

### Category
Framework Usage

### Description
Calling `config()` or accessing `$this->app['config']` inside a service provider's `register()` method. Configuration is loaded before providers are registered but `register()` runs during provider registration, before `boot()`.

### Why It Happens
Developers don't understand the two-phase provider lifecycle. They put all provider logic in `register()` because it's the first method called, not realizing config isn't available there.

### Warning Signs
- `config()` called in `register()` method of any service provider
- `$this->app['config']` accessed in `register()`
- Config values return null during provider registration

### Why It Is Harmful
Config access in `register()` returns null because the config repository has been loaded (by `LoadConfiguration`) but the provider's `register()` runs before the `BootProviders` phase. The binding exists but the config is not yet available to newly registered providers.

### Real-World Consequences
A payment gateway provider calls `config('services.stripe.key')` in `register()`. The config returns null. The provider uses the null key to initialize the Stripe client. All API calls fail with authentication errors.

### Preferred Alternative
Place all config-dependent logic in the `boot()` method. Use `register()` only for registering bindings that don't depend on configuration.

### Refactoring Strategy
1. Move config-dependent logic from `register()` to `boot()`
2. Keep `register()` for binding-only operations
3. If a binding depends on config, register a closure in `register()` that captures the config access lazily

### Detection Checklist
- [ ] `config()` or `$this->app['config']` used in `register()` method
- [ ] Config-dependent bindings receive null values
- [ ] Provider works in `boot()` but not `register()`

### Related Rules
Rule 5 (05-rules.md): Access config only in `boot()` — never in `register()`.

### Related Skills
Understand Bootstrap Order and Timing (06-skills.md).

### Related Decision Trees
Provider Register vs Boot Timing decision (07-decision-trees.md).
