# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** Deferred Provider Loading Timing
**Generated:** 2026-06-03

---

# Decision Inventory

1. Deferral Eligibility: Whether a provider should be deferred
2. `provides()` Completeness: Ensuring all bindings are discoverable
3. Cache Management: Services manifest regeneration timing

---

# Architecture-Level Decision Trees

---

## Decision Name: Deferral Eligibility

---

## Decision Context

Determining whether a service provider is a good candidate for deferral.

---

## Decision Criteria

* performance — deferral saves 100% of register/boot overhead on requests not using the service
* architectural — deferred providers cannot register routes, listeners, views, or gates in boot()
* security — first-use latency spike for deferred provider loading
* maintainability — adds `provides()` and manifest maintenance

---

## Decision Tree

Does the provider have a `boot()` method with logic that must run on every request?
↓
YES → NOT eligible for deferral
NO → Does the provider only register bindings (no boot logic)?
↓
YES → Eligible for deferral — implement `DeferrableProvider` and complete `provides()`
NO → Is the service type-hinted in a class constructor that is resolved on every request?
↓
YES → NOT beneficial to defer — provider loads on every request anyway; deferral adds complexity
NO → Is the service used on fewer than 50% of requests?
↓
YES → Consider deferral — profile to confirm benefit
NO → Not worth deferring — the complexity of deferral exceeds the minimal performance gain

---

## Rationale

Deferred providers skip both `register()` and `boot()` until the first time a service they provide is resolved from the container. This provides significant savings for infrequently-used services but no benefit for services resolved on every request. If the service is type-hinted in a class that is resolved on every request, the provider loads immediately on the first request — providing no performance advantage.

---

## Recommended Default

**Default:** Do not defer by default. Profile to identify heavy providers; defer only binding-only, infrequently-used providers.
**Reason:** Deferral adds complexity; optimize based on data.

---

## Risks Of Wrong Choice

- Deferring a provider with boot() logic: boot() runs on first resolution — logic may execute too late (route registration, listener registration).
- Deferring a provider used on most requests: no performance gain, added complexity, first-use latency spike.
- Forgetting `provides()` entry: `BindingResolutionException` — provider never loads.

---

## Related Rules

- Defer providers that only bind (05-rules.md, Rule 1)
- Keep `provides()` complete for every deferred provider (05-rules.md, Rule 2)
- Clear cache after changes to deferred provider status (05-rules.md, Rule 4)

---

## Related Skills

- Implement Deferred Providers

---

## Decision Name: `provides()` Completeness

---

## Decision Context

Ensuring every binding and alias registered by a deferred provider is listed in its `provides()` method.

---

## Decision Criteria

* performance — no impact
* architectural — `provides()` is the manifest that maps service → provider for lazy loading
* security — missing entries cause silent resolution failures
* maintainability — must stay in sync every time `register()` changes

---

## Decision Tree

Does the provider register any service via `$this->app->bind()`, `singleton()`, `scoped()`, or `instance()`?
↓
YES → Add each abstract to `provides()` array
NO → Does the provider register any aliases via `$this->app->alias()`?
↓
YES → Add each alias string to `provides()` array
NO → If `provides()` returns an empty array:
↓
YES → The provider will NEVER be loaded — remove deferral or add services to `provides()`
NO → Verify every service registered in `register()` is represented in `provides()`

---

## Rationale

When `$app->make(Service::class)` is called and no binding exists, the container checks `$this->deferredServices` (populated from the services manifest) to find which deferred provider provides that service. If the service is not in `provides()`, the container does not know which provider to load and throws `BindingResolutionException`.

---

## Recommended Default

**Default:** List every abstract and alias in `provides()`. Review after every change to `register()`.
**Reason:** Missing entries = `BindingResolutionException` at runtime.

---

## Risks Of Wrong Choice

- Missing binding in `provides()`: `BindingResolutionException` — provider never loads.
- Missing alias in `provides()`: facade or string-based resolution fails silently — returns null or throws.
- Stale services manifest: after adding entries to `provides()`, must regenerate cache.

---

## Related Rules

- Keep `provides()` complete for every deferred provider (05-rules.md, Rule 2)

---

## Related Skills

- Implement Deferred Providers
