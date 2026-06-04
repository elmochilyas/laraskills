# ECC Anti-Patterns — Deferred Providers

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Deferred Providers |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Deferring Providers with Boot Logic
2. Missing `provides()` Method
3. Over-Deferral for Frequently-Used Services
4. Forgetting Services Cache Regeneration

---

## Repository-Wide Anti-Patterns

- Premature Optimization — deferring a provider that runs on every request adds overhead without benefit.
- Queue Abuse — using deferred providers to defer non-trivial initialization logic.

---

## Anti-Pattern 1: Deferring Providers with Boot Logic

### Category
Framework Usage

### Description
Implementing `DeferrableProvider` on a provider that registers routes, event listeners, view composers, or gates in `boot()`. Deferred providers load lazily, so boot logic does not execute until the first service resolution.

### Why It Happens
Developers apply `DeferrableProvider` to any provider without checking whether it has `boot()` logic. They assume deferral always improves performance.

### Warning Signs
- `DeferrableProvider` implemented on a provider with `boot()` method
- Routes or event listeners that are "sometimes unavailable"
- Features that work only after the deferred service is first used

### Why It Is Harmful
Routes, event listeners, and other boot-time registrations from a deferred provider are NOT registered until the provider's service is first resolved. A route registered by a deferred provider is inaccessible until some other code triggers the provider's lazy loading.

### Real-World Consequences
A `ReportDeferredServiceProvider` implements `DeferrableProvider` and registers report routes in `boot()`. Users trying to access `/reports` get 404 errors. The route isn't registered until a different request resolves a report-related service. Users experience intermittent 404s.

### Preferred Alternative
Only defer providers that have no `boot()` method or whose `boot()` logic is purely about the deferred services themselves. Providers that register routes, events, or listeners must be eager.

### Refactoring Strategy
1. Remove `DeferrableProvider` from providers with `boot()` logic
2. Split the provider: keep bindings in a deferred provider, move route/event registration to an eager provider
3. Verify boot-time features register correctly

### Detection Checklist
- [ ] Provider implements `DeferrableProvider` but has `boot()` method
- [ ] Routes or events seem to be intermittently unavailable
- [ ] First resolution of a service triggers route registration

### Related Rules
Rule 1 (05-rules.md): Do not defer providers that register routes, events, listeners, or gates in `boot()`.

### Related Skills
Implement Deferred Service Providers (06-skills.md).

### Related Decision Trees
Deferred vs Eager Provider decision (07-decision-trees.md).

---

## Anti-Pattern 2: Missing `provides()` Method

### Category
Reliability

### Description
Implementing `DeferrableProvider` without implementing the `provides()` method, or returning an incomplete list of service identifiers from `provides()`.

### Why It Happens
Developers implement the interface but forget the method, or they update the provider's bindings without updating `provides()`. The framework silently skips the provider because it cannot match any resolution requests.

### Warning Signs
- `provides()` returns an empty array
- `provides()` is missing from a `DeferrableProvider` implementation
- A deferred provider never loads despite its service being resolved

### Why It Is Harmful
The framework uses `provides()` to build the deferred services manifest. If the method returns an empty or incomplete list, the provider is never triggered. Services that should be available are not bound.

### Real-World Consequences
A deferred provider binds `Analytics::class` but `provides()` only returns `['analytics']`. The code resolves `$app->make(Analytics::class)`. The container checks the manifest, finds only `'analytics'`, doesn't match `Analytics::class`, and throws `BindingResolutionException`. The service is unavailable despite being "registered."

### Preferred Alternative
Implement `provides()` to return ALL service identifiers the provider registers — both string keys and class names. Update the method whenever bindings change.

### Refactoring Strategy
1. Review all deferred providers for a complete `provides()` method
2. Add or update `provides()` to include all binding identifiers
3. Regenerate the services cache: `php artisan optimize`

### Detection Checklist
- [ ] `DeferrableProvider` without `provides()` method
- [ ] `provides()` returns empty or incomplete list
- [ ] Deferred service resolution fails despite provider implementing the interface

### Related Rules
Rule 2 (05-rules.md): Always implement `provides()` with the complete list of service identifiers.

### Related Skills
Implement Deferred Service Providers (06-skills.md).

### Related Decision Trees
Deferred Provider Implementation decision (07-decision-trees.md).

---

## Anti-Pattern 3: Over-Deferral for Frequently-Used Services

### Category
Performance

### Description
Deferring a provider whose services are resolved on every request. The overhead of checking the deferred manifest and loading the provider on first request may exceed the benefit of skipping it during bootstrap.

### Why It Happens
Developers apply deferral indiscriminately, assuming it's always beneficial. They don't measure whether the service is actually used on every request.

### Warning Signs
- A deferred provider's service is resolved on every request or every page
- The provider is loaded immediately after bootstrap anyway
- No measurable bootstrap improvement after deferring

### Why It Is Harmful
Deferred providers require a deferred services manifest lookup and a lazy-loading resolution path. If the service is resolved frequently, the minor overhead of deferral may not compensate for the complexity it introduces.

### Real-World Consequences
A `LoggingServiceProvider` is deferred. The first request triggers logging, loading the provider. Every subsequent request also triggers logging. The provider is effectively eager with extra overhead. The team struggles with deferred provider bugs for no performance benefit.

### Preferred Alternative
Only defer providers whose services are NOT used on every request. Measure before and after deferring. If a service is used on >80% of requests, keep it eager.

### Refactoring Strategy
1. Profile which services are resolved on each request
2. For services resolved on >80% of requests, remove `DeferrableProvider`
3. Keep deferral for services used on <50% of requests (admin reports, exports, etc.)

### Detection Checklist
- [ ] Deferred provider loaded on the first request of every session
- [ ] No measurable bootstrap improvement with deferral enabled
- [ ] Service is resolved on most or all requests

### Related Rules
Rule 3 (05-rules.md): Only defer providers whose services are not used on most requests.

### Related Skills
Implement Deferred Service Providers (06-skills.md).

### Related Decision Trees
Deferred vs Eager Provider decision (07-decision-trees.md).

---

## Anti-Pattern 4: Forgetting Services Cache Regeneration

### Category
Reliability

### Description
Adding a deferred provider or updating its `provides()` method without regenerating the services cache (`bootstrap/cache/services.php`). The cached manifest contains stale data.

### Why It Happens
Developers are unaware that `php artisan optimize` generates the deferred services manifest. They add deferred providers assuming the framework will detect them at runtime, which it does only when the services cache doesn't exist.

### Warning Signs
- After adding a deferred provider, the service is not available
- `bootstrap/cache/services.php` exists but doesn't include the new provider
- Removing `bootstrap/cache/services.php` fixes the issue

### Why It Is Harmful
Without a fresh services cache, the container cannot find the deferred provider when its service is resolved. The provider is never loaded, and the service is unavailable.

### Real-World Consequences
A team adds a deferred `AnalyticsServiceProvider` and deploys to production. The services cache still references the old providers. The analytics service is never resolved because the manifest doesn't include the new provider. Analytics features silently fail for all users.

### Preferred Alternative
After adding or modifying deferred providers, run `php artisan optimize` to regenerate the services cache. Include this in deployment scripts.

### Refactoring Strategy
1. After adding deferred providers, run `php artisan optimize`
2. Verify `bootstrap/cache/services.php` includes the new provider
3. Add `php artisan optimize` to deployment pipeline

### Detection Checklist
- [ ] `bootstrap/cache/services.php` exists but is stale
- [ ] Deferred provider works in local (no cache) but not in production (cached)
- [ ] Adding deferred providers not followed by cache regeneration

### Related Rules
Rule 4 (05-rules.md): Regenerate the services cache after adding or modifying deferred providers.

### Related Skills
Implement Deferred Service Providers (06-skills.md).

### Related Decision Trees
Deferred Services Cache decision (07-decision-trees.md).
