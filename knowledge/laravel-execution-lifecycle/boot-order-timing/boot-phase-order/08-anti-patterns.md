# ECC Anti-Patterns — Boot Phase Order

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Boot Phase Order |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Boot() as Catch-All Initialization
2. Heavy I/O in Boot()
3. Manual `$app->boot()` Invocation
4. Binding Registration in boot()

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — resolving services in `register()` fires before boot
- Premature Caching — caching during `register()` caches before all bindings exist

---

## Anti-Pattern 1: Boot() as Catch-All Initialization

### Category
Code Organization

### Description
Dumping all initialization logic — registrations, business logic, bindings, logging, and setup — into a single provider's `boot()` method without separation of concerns.

### Why It Happens
Developers treat `boot()` as the provider's main method and place everything there because "it runs and everything is available."

### Warning Signs
- A single `boot()` method exceeding 50 lines
- `$this->app->bind()` or `singleton()` calls in `boot()`
- Business logic, logging, and initialization mixed together

### Why It Is Harmful
Mixing bindings, initialization, and business logic in `boot()` violates the single-responsibility principle. Bindings registered here are invisible to deferred providers that resolved before boot. The boot phase becomes impossible to trace or debug.

### Real-World Consequences
A developer places `$this->app->singleton(PaymentGateway::class)` in `boot()`. A deferred analytics provider that resolves `PaymentGateway` during its lazy load finds no binding — `BindingResolutionException` in production. The binding works locally because the eager provider resolved first, but fails when provider ordering changes.

### Preferred Alternative
Keep `register()` for all container bindings. Limit `boot()` to initialization: route registration, event listeners, view composers, and gates.

### Refactoring Strategy
1. Move all `$this->app->bind()`, `singleton()`, `scoped()` calls from `boot()` to `register()`
2. Extract business logic from `boot()` into dedicated service classes
3. Split a large provider into multiple smaller providers by concern

### Detection Checklist
- [ ] `$this->app->bind()` or `singleton()` used in `boot()`
- [ ] `boot()` method exceeds 50 lines or does multiple unrelated things
- [ ] Business logic (I/O, API calls, data processing) in `boot()`

### Related Rules
Boot Phase Order Rule 1 (05-rules.md): Separate Binding Registration from Initialization.
Boot Phase Order Rule 5 (05-rules.md): Keep Boot Focused on Initialization Only.

### Related Skills
Structure Service Provider boot() Methods (06-skills.md).

### Related Decision Trees
Boot Logic Placement (07-decision-trees.md).

---

## Anti-Pattern 2: Heavy I/O in Boot()

### Category
Performance

### Description
Performing database queries, API calls, file operations, or any I/O inside a service provider's `boot()` method.

### Why It Happens
Developers think "boot() runs once" without realizing that for eager providers, it runs on every request in traditional FPM deployments.

### Warning Signs
- `DB::query()`, `Http::post()`, `file_get_contents()` called in `boot()`
- `Cache::put()` with computed data in `boot()`
- API calls or external service pings in `boot()`

### Why It Is Harmful
`boot()` runs on every request for eager providers. Heavy operations add 5-50ms to every request's bootstrap time, directly impacting time-to-first-byte. In Octane, boot runs once per worker but heavy operations still delay worker startup and first request.

### Real-World Consequences
A provider calls an external monitoring API in `boot()`. Under normal load (100 req/s), this adds 50ms × 100 = 5 seconds of cumulative API wait time per second. The monitoring API becomes a bottleneck. Under Octane with 32 workers, the API receives 32 simultaneous calls on every deployment.

### Preferred Alternative
Move heavy I/O to middleware, queued jobs, or lazy initialization. Keep `boot()` focused on lightweight registration of routes, events, and listeners.

### Refactoring Strategy
1. Identify all I/O operations in `boot()`
2. Move request-scoped I/O to middleware
3. Move one-time initialization I/O to a queued job or `booted()` callback
4. For Octane, move heavy setup to `booted()` with run-once guards

### Detection Checklist
- [ ] Database queries in `boot()`
- [ ] HTTP API calls in `boot()`
- [ ] File reads/writes in `boot()`
- [ ] Cache writes with computed data in `boot()`

### Related Rules
Boot Phase Order Rule 2 (05-rules.md): Avoid Heavy I/O in Boot.

### Related Skills
Structure Service Provider boot() Methods (06-skills.md).

### Related Decision Trees
Boot Logic Placement (07-decision-trees.md).

---

## Anti-Pattern 3: Manual `$app->boot()` Invocation

### Category
Framework Usage

### Description
Calling `$app->boot()`, `app()->boot()`, or `$this->app->boot()` from middleware, controllers, or any application code.

### Why It Happens
Developers need a "fully booted application" at a certain point and call boot manually, not understanding that the framework manages this automatically.

### Warning Signs
- `$app->boot()` called in middleware
- `app()->boot()` called in controllers
- `$this->app->boot()` called in service providers

### Why It Is Harmful
The framework manages the boot phase automatically. Manual calls may trigger double booting (guarded by `$app->booted` flag but still problematic) or force boot before all providers are registered, causing `BindingResolutionException`.

### Real-World Consequences
A middleware calls `app()->boot()` to ensure services are available. On the first request, this forces boot before all providers have registered. A provider registered after this point never gets its `boot()` called during the normal boot phase — its initialization is skipped entirely.

### Preferred Alternative
Trust the framework to manage boot timing. If you need services initialized earlier, move that initialization to a provider's `register()` or `boot()` method.

### Refactoring Strategy
1. Find all `$app->boot()` calls in application code
2. Remove each call — the framework handles booting
3. If code depends on services being booted, wrap it in a `booted()` callback

### Detection Checklist
- [ ] `$app->boot()` used outside framework internals
- [ ] `app()->boot()` in middleware or controllers
- [ ] Double boot or early boot errors in logs

### Related Rules
Boot Phase Order Rule 3 (05-rules.md): Do Not Call boot() Manually.

### Related Skills
Structure Service Provider boot() Methods (06-skills.md).

### Related Decision Trees
Boot Logic Placement (07-decision-trees.md).

---

## Anti-Pattern 4: Binding Registration in boot()

### Category
Framework Usage

### Description
Registering container bindings via `$this->app->bind()`, `singleton()`, or `scoped()` inside `boot()` instead of `register()`.

### Why It Happens
Developers do not understand the two-phase separation. They see `boot()` as "the main provider method" and place all code there, including bindings.

### Warning Signs
- `$this->app->bind()` in `boot()`
- `$this->app->singleton()` in `boot()`
- `$this->app->scoped()` in `boot()`
- Bindings registered in `boot()` cannot be resolved by deferred providers that loaded before boot

### Why It Is Harmful
The two-phase guarantee — all `register()` calls complete before any `boot()` starts — ensures bindings are visible to all providers. Bindings placed in `boot()` are invisible to deferred providers that resolved earlier and to other providers' `register()` methods. The `$bindings` and `$singletons` properties (processed after `register()`) are incompatible with `boot()` binding.

### Real-World Consequences
A deferred analytics provider is triggered when `Analytics::class` is resolved. It tries to resolve `Logger::class`, which was registered in `boot()` of another provider. Since boot hasn't happened yet (the analytics provider is loaded lazily), `Logger` is not bound. Production crashes with `BindingResolutionException`.

### Preferred Alternative
All container bindings belong in `register()`. Use `boot()` only for initialization that depends on those bindings.

### Refactoring Strategy
1. Move all `$this->app->bind()`, `singleton()`, `scoped()` from `boot()` to `register()`
2. If a binding depends on a service that must be resolved, use a closure that captures the dependency lazily
3. Verify no `bind()` or `singleton()` calls remain in any `boot()` method

### Detection Checklist
- [ ] `$this->app->bind()` in `boot()`
- [ ] `$this->app->singleton()` in `boot()`
- [ ] `BindingResolutionException` for services expected to exist in deferred providers
- [ ] `$bindings` / `$singletons` properties not respected in `boot()`

### Related Rules
Boot Phase Order Rule 1 (05-rules.md): Separate Binding Registration from Initialization.
Boot Phase Order Rule 4 (05-rules.md): Document Boot Dependencies Between Providers.

### Related Skills
Structure Service Provider boot() Methods (06-skills.md).

### Related Decision Trees
Binding Registration in Boot Phase (07-decision-trees.md).
