# ECC Anti-Patterns — Register vs Boot

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Register vs Boot |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Service Resolution in `register()`
2. Side Effects in `register()`
3. Manual Provider Registration Instead of Framework Orchestration
4. Business Logic in `register()` That Belongs in `boot()`

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — resolving services in `register()` triggers eager loading during provider registration.
- Premature Caching — caching during `register()` caches before all bindings exist.

---

## Anti-Pattern 1: Service Resolution in `register()`

### Category
Framework Usage

### Description
Calling `$this->app->make()`, `resolve()`, or `app()` inside a service provider's `register()` method. The service being resolved may be registered by a later provider and is not yet available.

### Why It Happens
Developers treat `register()` as the provider's main initialization method and assume all services are available because the Application exists.

### Warning Signs
- `$this->app->make()` called in `register()`
- `app('service')` or `resolve('service')` called in `register()`
- `BindingResolutionException` during provider registration

### Why It Is Harmful
The two-phase guarantee means all `register()` methods complete before any `boot()` runs. Resolving a service in `register()` may work in development (if the provider happens to be registered earlier) but fail in production with different provider ordering.

### Real-World Consequences
A provider resolves `Cache::class` in `register()`. In local development, the CacheServiceProvider is registered before this provider. In production, a package discovery reorders providers, and the Cache provider registers after this one. Production crashes with `BindingResolutionException`.

### Preferred Alternative
Use `boot()` for all service resolution. Keep `register()` for pure binding operations only.

### Refactoring Strategy
1. Move all `$this->app->make()` calls from `register()` to `boot()`
2. If a binding depends on resolved values, register a closure in `register()` that captures the dependency lazily
3. Verify no `app()`, `resolve()`, or `make()` calls remain in `register()`

### Detection Checklist
- [ ] `$this->app->make()` used in `register()` method
- [ ] `app()` or `resolve()` called in `register()`
- [ ] `BindingResolutionException` during provider registration

### Related Rules
Rule 1 (05-rules.md): Never resolve services in `register()` — use `boot()` for resolution.

### Related Skills
Understand Provider Register vs Boot Phases (06-skills.md).

### Related Decision Trees
Provider Lifecycle Phase decision (07-decision-trees.md).

---

## Anti-Pattern 2: Side Effects in `register()`

### Category
Architecture

### Description
Performing I/O, writing files, sending HTTP requests, or executing database queries inside a service provider's `register()` method. The `register()` method should only configure the container.

### Why It Happens
Developers treat provider lifecycle methods as general-purpose initialization. They perform I/O in `register()` because it's the first method that runs.

### Warning Signs
- `Log::info()`, `DB::query()`, `Http::post()` called in `register()`
- File operations in `register()`
- Side effects that execute during provider registration

### Why It Is Harmful
`register()` runs during the `RegisterProviders` bootstrapper. Side effects here execute before error handling, authentication, and middleware are fully operational. In Octane, `register()` runs once per worker — side effects are not repeated per request.

### Real-World Consequences
A provider sends a "provider registered" HTTP webhook in `register()`. In Octane, this webhook fires once per worker start. With 32 workers, the destination receives 32 identical webhooks during deployment, flooding the monitoring system.

### Preferred Alternative
Keep `register()` pure — bindings only. Move side effects to `boot()` for initialization that must run, or to middleware for request-scoped side effects.

### Refactoring Strategy
1. Remove all I/O operations from `register()`
2. Move them to `boot()` if they must run once per lifecycle
3. Move to middleware if they should run per request

### Detection Checklist
- [ ] Database queries, file writes, or HTTP calls in `register()`
- [ ] Logging or event dispatching in `register()`
- [ ] Octane workers trigger the same side effect multiple times

### Related Rules
Rule 2 (05-rules.md): Never perform I/O or side effects in `register()` — it should only configure the container.

### Related Skills
Understand Provider Register vs Boot Phases (06-skills.md).

### Related Decision Trees
Provider Lifecycle Phase decision (07-decision-trees.md).

---

## Anti-Pattern 3: Manual Provider Registration Instead of Framework Orchestration

### Category
Framework Usage

### Description
Calling `$app->register(SomeProvider::class)` manually in application code instead of listing the provider in `config/app.php` or `bootstrap/providers.php`.

### Why It Happens
Developers manually register providers in route closures, service code, or other providers without understanding that the framework already handles orchestration.

### Warning Signs
- `$app->register()` called outside of a service provider's `register()` method
- `App::register()` called in route files or middleware
- Same provider registered multiple times

### Why It Is Harmful
Manual registration bypasses the framework's two-phase lifecycle. Providers registered late (after boot) execute `register()` and `boot()` immediately, potentially before their dependencies are available.

### Real-World Consequences
A route closure calls `App::register(ReportingServiceProvider::class)` on the first request. The provider registers reporting services and boots. But the next request doesn't call this closure (it's cached), so the reporting services are not available on subsequent requests. Intermittent failures follow.

### Preferred Alternative
List providers in `config/app.php` (Laravel 10) or `bootstrap/providers.php` (Laravel 11). Let the framework orchestrate registration in the correct two-phase lifecycle.

### Refactoring Strategy
1. Find all `$app->register()` calls in application code
2. Add the providers to the appropriate configuration file
3. Remove manual registration calls

### Detection Checklist
- [ ] `$app->register()` called outside of the main provider declaration
- [ ] Same provider registered both in config and manually
- [ ] Intermittent provider availability issues

### Related Rules
Rule 3 (05-rules.md): Let the framework orchestrate provider registration — do not call `register()` manually.

### Related Skills
Understand Provider Register vs Boot Phases (06-skills.md).

---

## Anti-Pattern 4: Business Logic in `register()` That Belongs in `boot()`

### Category
Architecture

### Description
Placing route registration, event listener registration, view composers, or gate definitions in `register()` instead of `boot()`. These operations require services that may not be available during registration.

### Why It Happens
Developers see provider as "the place for setup" and put everything in the first available method. They don't understand the separation of concerns between the two phases.

### Warning Signs
- `Route::`, `Event::listen()`, `Gate::`, `Blade::` called in `register()`
- View composers registered in `register()`
- Services resolved and used for configuration in `register()`

### Why It Is Harmful
These operations often depend on services that are registered by other providers. In `register()`, those services may not exist yet. Routes, events, and gates registered in `register()` may fail silently or not be registered at all.

### Real-World Consequences
A provider registers event listeners in `register()`. The listener classes depend on a service registered by a deferred provider. The deferred provider hasn't loaded yet, so the listener receives an incomplete service. Events dispatch but produce incorrect results.

### Preferred Alternative
Use `register()` only for container bindings. Use `boot()` for route registration, event listeners, view composers, gate definitions, and any code that depends on other provider services.

### Refactoring Strategy
1. Move all non-binding code from `register()` to `boot()`
2. Keep only `$this->app->bind()`, `$this->app->singleton()`, `$this->app->when()->needs()->give()` in `register()`
3. Use `$bindings` and `$singletons` properties for simple bindings

### Detection Checklist
- [ ] Route or event registration code in `register()`
- [ ] View composers or gate definitions in `register()`
- [ ] `$this->app->make()` in `register()`

### Related Rules
Rule 4 (05-rules.md): Use `register()` for bindings only — use `boot()` for features that depend on other services.

### Related Skills
Understand Provider Register vs Boot Phases (06-skills.md).

### Related Decision Trees
Provider Lifecycle Phase decision (07-decision-trees.md).
