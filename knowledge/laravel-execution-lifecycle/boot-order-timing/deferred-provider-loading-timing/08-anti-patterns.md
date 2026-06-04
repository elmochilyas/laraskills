# ECC Anti-Patterns — Deferred Provider Loading Timing

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Deferred Provider Loading Timing |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Deferring Everything
2. Hidden Boot Logic in Deferred Providers
3. Stale Manifest Blindness
4. Over-Deferral of Frequently-Used Services
5. Missing Service in provides()

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — deferred providers triggering database calls on first resolution
- Premature Caching — caching during deferred provider registration before boot phase completes

---

## Anti-Pattern 1: Deferring Everything

### Category
Performance

### Description
Making all service providers deferred without evaluating whether each provider is a good candidate, breaking boot-time registration of routes, events, and listeners.

### Why It Happens
Developers read "deferred providers improve performance" and apply it universally without understanding the constraints — deferred providers cannot reliably register routes, events, or listeners in `boot()`.

### Warning Signs
- Every provider implements `DeferrableProvider`
- Routes, event listeners, or view composers registered in deferred providers
- Features that "sometimes work" — listeners fire inconsistently

### Why It Is Harmful
Deferred providers with `boot()` logic still run `boot()` on first resolution — not during the main boot phase. If `boot()` registers routes, event listeners, view composers, or gates, those registrations do not happen until the provider is triggered — potentially too late for early-arriving requests.

### Real-World Consequences
A developer makes `EventServiceProvider` deferred. The `boot()` method, which registers listeners via `Event::listen()`, never runs during the main boot phase. When an event is dispatched, the listeners are not registered. All event-driven features silently break. The developer spends days debugging why events "don't work."

### Preferred Alternative
Defer only providers that have no `boot()` logic and only register bindings. Use eager providers for all initialization (routes, events, listeners, gates).

### Refactoring Strategy
1. Remove `DeferrableProvider` from all providers with `boot()` logic
2. For binding-only providers, keep `DeferrableProvider` and implement `provides()`
3. For providers with both bindings and boot logic, split into deferred binding provider and eager boot provider

### Detection Checklist
- [ ] Provider with `boot()` method implements `DeferrableProvider`
- [ ] Routes, listeners, or gates registered in a deferred provider
- [ ] Feature behavior is inconsistent or works only after certain service resolutions

### Related Rules
Deferred Provider Loading Timing Rule 2 (05-rules.md): Never Defer Providers with Boot Logic.

### Related Skills
Implement Deferred Providers for Bootstrap Optimization (06-skills.md).

### Related Decision Trees
Deferral Eligibility (07-decision-trees.md).

---

## Anti-Pattern 2: Hidden Boot Logic in Deferred Providers

### Category
Architecture

### Description
Having a `boot()` method in a deferred provider with the mistaken belief that it will not run or can be safely deferred.

### Why It Happens
Developers add `DeferrableProvider` to a provider that has a `boot()` method, thinking the `boot()` will be skipped entirely — not realizing it runs on first resolution.

### Warning Signs
- Deferred provider with a non-empty `boot()` method
- `Event::listen()` in a deferred provider's `boot()` without `when()`
- Routes registered in a deferred provider's `boot()`
- No `when()` method to trigger early loading

### Why It Is Harmful
The deferred provider's `boot()` still runs — but on first resolution of a provided service, not during the main boot phase. If `boot()` registers routes or event listeners, those registrations happen mid-request or not at all if the service is never resolved.

### Real-World Consequences
A deferred `NotificationProvider` has `boot()` that registers `UserRegistered` listeners. The provider is triggered when `NotificationService::class` is first resolved. A user registers (dispatching `UserRegistered`) before any code resolves `NotificationService`. The listener never fires — the welcome email is never sent.

### Preferred Alternative
Eager providers for all boot-time initialization. If a provider must be deferred but also registers listeners, implement `when()` to trigger loading before the relevant event fires.

### Refactoring Strategy
1. Remove `DeferrableProvider` from providers with `boot()` logic that must run on every request
2. For providers with listener registration, implement `when()` returning the event classes that should trigger loading
3. Alternatively, split the provider into a deferred binding provider and an eager boot provider

### Detection Checklist
- [ ] Deferred provider with non-empty `boot()`
- [ ] Event listeners registered in deferred provider without `when()`
- [ ] Routes or gates registered in deferred provider

### Related Rules
Deferred Provider Loading Timing Rule 2 (05-rules.md): Never Defer Providers with Boot Logic.
Deferred Provider Loading Timing Rule 5 (05-rules.md): Use when() for Event-Triggered Deferred Loading.

### Related Skills
Implement Deferred Providers for Bootstrap Optimization (06-skills.md).

### Related Decision Trees
Deferral Eligibility (07-decision-trees.md).

---

## Anti-Pattern 3: Stale Manifest Blindness

### Category
Maintainability

### Description
Changing a provider's deferred status, `provides()` method, or registration list without regenerating the services cache, causing the stale manifest to be used.

### Why It Happens
Developers are unaware that the services manifest (`bootstrap/cache/services.php`) caches provider deferral status. They change provider code and expect changes to reflect immediately.

### Warning Signs
- Provider added to `config/app.php` but not resolving
- Deferred provider still treated as eager (or vice versa)
- `BindingResolutionException` for services that are clearly registered
- No `php artisan optimize:clear` in the development or deployment workflow

### Why It Is Harmful
The services manifest caches which providers are deferred and their service mappings. Without regeneration, the framework uses a stale manifest: a provider that was eager remains in the manifest as eager after you add `DeferrableProvider`, or a new service is missing from the manifest.

### Real-World Consequences
A developer adds `DeferrableProvider` to a binding-only provider and deploys without running `optimize:clear`. The stale manifest still lists the provider as eager. Every request continues to pay the `register()` overhead. The performance improvement never materializes, and the developer concludes "deferred providers don't work."

### Preferred Alternative
Always run `php artisan optimize:clear` (or `optimize`) after changing a provider's deferred status or its `provides()` method.

### Refactoring Strategy
1. Add `php artisan optimize:clear && php artisan optimize` to the deployment pipeline
2. After any provider change, regenerate the cache and verify the manifest
3. Inspect `bootstrap/cache/services.php` to confirm deferred status

### Detection Checklist
- [ ] Provider deferred status changed without cache regeneration
- [ ] `provides()` method updated without cache regeneration
- [ ] `BindingResolutionException` for services listed in `provides()`
- [ ] Stale manifest suspected

### Related Rules
Deferred Provider Loading Timing Rule 3 (05-rules.md): Regenerate Services Cache After Provider Changes.

### Related Skills
Implement Deferred Providers for Bootstrap Optimization (06-skills.md).

### Related Decision Trees
Cache Management (07-decision-trees.md).

---

## Anti-Pattern 4: Over-Deferral of Frequently-Used Services

### Category
Performance

### Description
Deferring a provider whose services are resolved on 90%+ of requests, gaining no meaningful performance benefit while adding complexity.

### Why It Happens
Developers apply "defer by default" thinking, not measuring whether the service is actually used on most requests.

### Warning Signs
- A frequently-resolved service (logger, cache, database) registered in a deferred provider
- No performance measurement before and after deferral
- Provider loads on the first request and stays loaded — no savings on subsequent requests
- The `provides()` list is long and changes frequently

### Why It Is Harmful
Deferral provides marginal benefit when the service is used on nearly every request — the provider still loads. Meanwhile, deferral adds complexity: the first-use latency spike, the risk of `provides()` being incomplete, stale manifest issues, and ongoing maintenance burden.

### Real-World Consequences
A developer defers the `LoggerServiceProvider`. The logger is used on every single request (for logging, error handling, debugging). The provider loads on the first request and stays loaded. Zero performance gain. But the developer now must maintain `provides()` and regenerate the services cache whenever the provider changes — purely additional work.

### Preferred Alternative
Keep frequently-used providers eager. Defer only providers whose services are resolved on fewer than ~50% of requests.

### Refactoring Strategy
1. Measure how often each deferred provider's services are resolved (use Telescope or custom metrics)
2. For providers used on 90%+ of requests, remove `DeferrableProvider`
3. For providers used on 50-90% of requests, evaluate if deferral complexity is worth marginal savings

### Detection Checklist
- [ ] Logger, cache, or other frequently-used service is deferred
- [ ] No performance measurement before/after deferral
- [ ] Provider loads on the first request and persists — no savings

### Related Rules
Deferred Provider Loading Timing Rule 6 (05-rules.md): Avoid Deferring Providers Used on Most Requests.

### Related Skills
Implement Deferred Providers for Bootstrap Optimization (06-skills.md).

### Related Decision Trees
Deferral Eligibility (07-decision-trees.md).

---

## Anti-Pattern 5: Missing Service in provides()

### Category
Reliability

### Description
Registering services or aliases in a deferred provider's `register()` method without including them in the `provides()` return array.

### Why It Happens
Developers add new bindings or aliases to `register()` and forget to update `provides()`. The method is out of sight, out of mind.

### Warning Signs
- `$this->app->bind()` or `alias()` added to a deferred provider without updating `provides()`
- `BindingResolutionException` for a service that should exist
- Services resolve only after another service from the same provider is resolved first

### Why It Is Harmful
The deferred services manifest maps service identifiers to their provider. Missing a service in `provides()` means the manifest does not associate it with the provider. When `$app->make(Service::class)` is called, the container finds no binding and no deferred provider to load, throwing `BindingResolutionException`.

### Real-World Consequences
A deferred `AnalyticsProvider` registers `AnalyticsService::class` and an alias `'analytics'` in `register()`. The `provides()` method returns only `[AnalyticsService::class]`, missing the alias. When application code calls `app('analytics')`, the container finds no binding and no deferred provider to load. `BindingResolutionException` thrown.

### Preferred Alternative
Every service identifier and alias registered in `register()` must be listed in `provides()`. Keep the two in sync.

### Refactoring Strategy
1. List every `$this->app->bind()`, `singleton()`, `scoped()`, `instance()`, and `alias()` call in `register()`
2. Add each abstract and alias string to `provides()`
3. Review `provides()` after every change to `register()`

### Detection Checklist
- [ ] New binding added to `register()` without updating `provides()`
- [ ] New alias added to `register()` without updating `provides()`
- [ ] `BindingResolutionException` for service registered in a deferred provider
- [ ] Service resolves only after another service triggers the provider

### Related Rules
Deferred Provider Loading Timing Rule 1 (05-rules.md): Keep provides() Complete and In Sync.

### Related Skills
Implement Deferred Providers for Bootstrap Optimization (06-skills.md).

### Related Decision Trees
`provides()` Completeness (07-decision-trees.md).
