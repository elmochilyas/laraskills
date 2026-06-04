# ECC Anti-Patterns — Bootstrap With Event System

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Bootstrap With Event System |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Bootstrap Listener as Service Locator
2. Listener Registered Too Late
3. Wildcard Bootstrap Event Listeners
4. Modifying Container Bindings in Bootstrap Listeners
5. Heavy I/O in Bootstrap Listeners

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — bootstrap listeners that query the database before middleware runs
- Premature Caching — caching during bootstrap event listeners before all services are ready

---

## Anti-Pattern 1: Bootstrap Listener as Service Locator

### Category
Architecture

### Description
Using a bootstrap event listener (`bootstrapping:*` / `bootstrapped:*`) to resolve services, register routes, or perform application setup instead of using a service provider's `boot()` method.

### Why It Happens
Developers discover bootstrap events and treat them as general-purpose hooks for any code that needs to run during initialization.

### Warning Signs
- `Route::`, `Gate::define()`, `Event::listen()` called in a bootstrap event listener
- Services resolved and used for application configuration in bootstrap listeners
- Business logic executed in a `bootstrapped: bootProviders` listener

### Why It Is Harmful
Bootstrap events are designed for monitoring, profiling, and cross-cutting concerns — not for application initialization. Code in bootstrap listeners runs outside the service provider lifecycle and is harder to discover, test, and maintain.

### Real-World Consequences
A package registers route definitions in a `bootstrapped: bootProviders` listener. When the application upgrades Laravel and the bootstrapper list changes, the listener fires at a different time. Routes that worked now 404 because the listener runs before or after expected.

### Preferred Alternative
Use a service provider's `boot()` method for all application initialization. Reserve bootstrap events for monitoring, profiling, and configuration overrides.

### Refactoring Strategy
1. Move route, event, and gate registration from bootstrap listeners to provider `boot()` methods
2. Move service resolution from listeners to provider `boot()` or `register()` as appropriate
3. Keep only monitoring/profiling code in bootstrap event listeners

### Detection Checklist
- [ ] Route or event registration code in bootstrap event listeners
- [ ] Service resolution in bootstrap listeners
- [ ] Business logic in `bootstrapped:*` listeners

### Related Rules
Bootstrap With Event System Rule 4 (05-rules.md): Prefer Provider boot() Over Bootstrap Events for Application Setup.

### Related Skills
Leverage Bootstrap Events for Monitoring and Setup (06-skills.md).

### Related Decision Trees
Bootstrap Observer Strategy (07-decision-trees.md).

---

## Anti-Pattern 2: Listener Registered Too Late

### Category
Framework Usage

### Description
Registering bootstrap event listeners in a service provider's `boot()` method instead of `register()` or `bootstrap/app.php`.

### Why It Happens
Developers are familiar with `boot()` for initialization and naturally place listener registration there, not realizing bootstrap events fire before `boot()` is called.

### Warning Signs
- `$this->app['events']->listen('bootstrapping:*', ...)` in a provider's `boot()` method
- Bootstrap monitoring code that never produces output
- Debugging sessions where bootstrap events seem "not to fire"

### Why It Is Harmful
Bootstrap events (`bootstrapping:*`, `bootstrapped:*`) are dispatched during the kernel's bootstrap pipeline, which runs before any provider's `boot()` is reached. Listeners registered in `boot()` silently never execute — the events have already fired.

### Real-World Consequences
A developer adds a `bootstrapped: bootProviders` listener in `boot()` to log bootstrap duration. The listener never fires. After hours of debugging, they discover the timing issue. Meanwhile, production has no bootstrap timing data.

### Preferred Alternative
Register all bootstrap event listeners in a service provider's `register()` method or in `bootstrap/app.php`.

### Refactoring Strategy
1. Find all bootstrap event listeners registered via `$this->app['events']->listen()` in `boot()` methods
2. Move them to `register()` methods or `bootstrap/app.php`
3. Verify the listener fires by adding a temporary log or using Telescope

### Detection Checklist
- [ ] Bootstrap event listener in `boot()` method
- [ ] Bootstrap monitoring code that never appears to run
- [ ] Register in `register()` or `bootstrap/app.php` instead

### Related Rules
Bootstrap With Event System Rule 1 (05-rules.md): Register Bootstrap Listeners Before Bootstrappers Run.

### Related Skills
Leverage Bootstrap Events for Monitoring and Setup (06-skills.md).

### Related Decision Trees
Bootstrap Event Listener Registration Timing (07-decision-trees.md).

---

## Anti-Pattern 3: Wildcard Bootstrap Event Listeners

### Category
Performance

### Description
Using wildcard event name patterns like `bootstrapping:*` or `bootstrapped:*` to listen to all bootstrap events when only specific events are needed.

### Why It Happens
Developers use wildcards for convenience — "catch everything" during development and never narrow the listener.

### Warning Signs
- `Event::listen('bootstrapping:*', ...)`
- `Event::listen('bootstrapped:*', ...)`
- Listener logic that checks which bootstrapper fired and switches behavior

### Why It Is Harmful
Wildcard listeners match every bootstrapper event, adding dispatch overhead to all 12 core bootstrap events regardless of which event is relevant. This multiplies listener execution time unnecessarily.

### Real-World Consequences
A developer uses `'bootstrapped:*'` to log bootstrap timing. The listener fires 6 times per request (once per bootstrapper). In production at 1000 req/s, this generates 6000 unnecessary log entries per second, increasing log storage costs and I/O overhead.

### Preferred Alternative
Listen to specific bootstrap event names (e.g., `bootstrapped: bootProviders`) unless you intentionally need to observe all bootstrap steps for debugging or profiling.

### Refactoring Strategy
1. Identify which bootstrapper event is actually needed
2. Replace `'bootstrapping:*'` with the specific event name
3. If multiple events are needed, register separate listeners for each

### Detection Checklist
- [ ] Wildcard `'bootstrapping:*'` used when one event suffices
- [ ] Wildcard `'bootstrapped:*'` in production code
- [ ] Listener with `if`/`switch` on bootstrapper name

### Related Rules
Bootstrap With Event System Rule 3 (05-rules.md): Use Specific Bootstrap Event Names, Not Wildcards.

### Related Skills
Leverage Bootstrap Events for Monitoring and Setup (06-skills.md).

### Related Decision Trees
Event Name Specificity (07-decision-trees.md).

---

## Anti-Pattern 4: Modifying Container Bindings in Bootstrap Listeners

### Category
Architecture

### Description
Registering container bindings or modifying the container's service configuration inside bootstrap event listeners.

### Why It Happens
Developers see bootstrap events as "early initialization hooks" and add bindings there, thinking they will be available earlier.

### Warning Signs
- `$app->bind()`, `$app->singleton()` in a bootstrap event listener
- `$app->instance()` in a bootstrap event listener
- Bindings that appear and disappear depending on listener registration order

### Why It Is Harmful
Bootstrap listeners execute during the kernel's bootstrap pipeline, before or between bootstrappers. Bindings added here may conflict with provider-registered bindings, creating order-dependent behavior that is difficult to reproduce and debug.

### Real-World Consequences
A `bootstrapping: registerProviders` listener binds `DatabaseLogger::class` as a singleton. A separate provider also binds `DatabaseLogger::class` in its `register()` method. The binding from the listener wins if it registers before the provider, but not otherwise. Non-deterministic resolution behavior that is impossible to reproduce consistently.

### Preferred Alternative
All container bindings belong in service provider `register()` methods. Use bootstrap events only for configuration overrides (e.g., forcing environment detection before `LoadEnvironmentVariables`).

### Refactoring Strategy
1. Move all `$app->bind()` / `singleton()` / `instance()` calls from bootstrap listeners to provider `register()` methods
2. For configuration overrides, keep only the `bootstrapping: loadConfiguration` listener
3. Verify no bindings are registered outside of provider `register()` methods

### Detection Checklist
- [ ] `$app->bind()` in bootstrap event listener
- [ ] `$app->singleton()` in bootstrap event listener
- [ ] Non-deterministic binding resolution related to listener registration order

### Related Rules
Bootstrap With Event System Rule 5 (05-rules.md): Do Not Modify Container Bindings in Bootstrap Event Listeners.

### Related Skills
Leverage Bootstrap Events for Monitoring and Setup (06-skills.md).

### Related Decision Trees
Bootstrap Observer Strategy (07-decision-trees.md).

---

## Anti-Pattern 5: Heavy I/O in Bootstrap Listeners

### Category
Performance

### Description
Performing database queries, API calls, or file writes inside bootstrap event listeners.

### Why It Happens
Developers do not realize that bootstrap events execute in the critical path before any middleware or application code runs.

### Warning Signs
- `DB::insert()`, `Http::post()`, `Log::channel()->write()` in bootstrap event listener
- Network requests to external services in bootstrap listeners
- File operations in bootstrap listeners

### Why It Is Harmful
Bootstrap events execute in the critical path before any middleware or application code runs. Every microsecond spent in a bootstrap listener directly delays every request's time-to-first-byte.

### Real-World Consequences
A `bootstrapped: loadConfiguration` listener logs configuration loading duration to the database via `DB::insert()`. This database query adds 5-10ms to every single request's bootstrap time. At 500 req/s, this wastes 2.5-5 seconds of cumulative database time per second.

### Preferred Alternative
Keep bootstrap listeners lightweight — set flags, increment counters, or store timestamps in memory. Move I/O to middleware or queued jobs.

### Refactoring Strategy
1. Identify all I/O operations in bootstrap event listeners
2. Replace database writes with in-memory counters
3. Move logging to middleware or `terminate()` callbacks
4. For Octane, ensure bootstrap listeners are idempotent and lightweight

### Detection Checklist
- [ ] Database queries in bootstrap event listeners
- [ ] HTTP API calls in bootstrap event listeners
- [ ] File writes in bootstrap event listeners
- [ ] Bootstrap time impact > 50µs from listener overhead

### Related Rules
Bootstrap With Event System Rule 2 (05-rules.md): Keep Bootstrap Event Listeners Lightweight.

### Related Skills
Leverage Bootstrap Events for Monitoring and Setup (06-skills.md).

### Related Decision Trees
Bootstrap Observer Strategy (07-decision-trees.md).
