# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** ku-03-deferred-providers
**Generated:** 2026-06-03

---

# Decision Inventory

1. Deferral Eligibility: Whether a provider is suitable for deferral
2. `provides()` Completeness: Ensuring all bindings and aliases are listed
3. Event-Driven Loading: Using `when()` for deferred providers with listeners

---

# Architecture-Level Decision Trees

---

## Decision Name: Deferral Eligibility

---

## Decision Context

Determining whether a service provider should be deferred — skipping `register()` and `boot()` until its services are first resolved.

---

## Decision Criteria

* performance — deferred providers eliminate bootstrap overhead for unused services
* architectural — deferred providers cannot register routes, views, listeners, or gates
* security — deferred providers load mid-request on first resolution
* maintainability — adds `provides()` method that must stay in sync with bindings

---

## Decision Tree

Does the provider have a `boot()` method with logic that must run on every request?
↓
YES → NOT eligible for deferral — boot logic would not execute until first resolution
NO → Does the provider only register bindings (no boot logic)?
↓
YES → Eligible for deferral — implement `DeferrableProvider` and `provides()`
NO → Does the provider have `boot()` logic that can be triggered by an event?
↓
YES → Eligible with `when()` — provider loads when specific events fire
NO → Is the service type-hinted in the constructor of a class resolved on every request?
↓
YES → NOT beneficial to defer — provider loads on every request regardless; deferral adds complexity for no gain
NO → Consider deferral — measure bootstrap overhead first

---

## Rationale

Deferred providers postpone both `register()` and `boot()` until the first time a service they provide is resolved from the container. They are identified during provider registration, stored in a manifest, and loaded lazily. The optimization reduces bootstrap overhead by skipping providers whose services are not used on a given request. However, if the service is type-hinted in a high-traffic class constructor, the provider loads immediately on every request — providing no benefit.

---

## Recommended Default

**Default:** Do NOT defer by default. Profile to identify heavy providers, then defer only those that are binding-only and infrequently used.
**Reason:** Deferral adds complexity (`provides()`, `when()`, manifest maintenance); optimize based on data.

---

## Risks Of Wrong Choice

- Deferring a provider that registers routes/views/gates in `boot()`: these are not registered until the provider is triggered — runtime errors on first access.
- Deferring a provider whose service is type-hinted on every request: the provider loads on the first request anyway — no performance gain, added complexity.
- Missing `provides()` entry: subtle `BindingResolutionException` on resolution — provider never loads.

---

## Related Rules

- Use `DeferrableProvider` for binding-only providers (05-rules.md, Rule 1)
- Keep `provides()` complete for every deferred provider (05-rules.md, Rule 2)
- Use `when()` for event-triggered deferred loading (05-rules.md, Rule 3)

---

## Related Skills

- Implement Deferred Providers (deferred-provider-loading-timing)

---

## Decision Name: `provides()` Completeness

---

## Decision Context

Ensuring every binding, alias, and service abstract registered by a deferred provider is listed in its `provides()` method.

---

## Decision Criteria

* performance — no impact
* architectural — `provides()` is the manifest that the container uses to map service → provider
* security — missing entries cause silent resolution failures
* maintainability — requires manual sync when bindings change

---

## Decision Tree

Does the deferred provider register any container bindings (`bind()`, `singleton()`, `scoped()`)?
↓
YES → Add each binding abstract to `provides()` array
NO → Does the provider register any aliases (`$app->alias()` or facade accessors)?
↓
YES → Add each alias string to `provides()` array
NO → Does the provider register any `instance()` bindings?
↓
YES → Add the instance abstract to `provides()` array
NO → Is `provides()` completely empty?
↓
YES → The provider will never be loaded — remove deferral or add services to `provides()`
NO → Verify every binding in `register()` is represented in `provides()`

---

## Rationale

When `$app->make(UnboundService::class)` is called and no binding exists, the container checks `$this->deferredServices` (populated from the services manifest) to find which deferred provider provides that service. If the service is not in `provides()`, the container does not know which provider to load and throws `BindingResolutionException`. Missing entries are the #1 bug with deferred providers.

---

## Recommended Default

**Default:** List every abstract and alias in `provides()`. Review after every change to `register()`.
**Reason:** Missing entries = `BindingResolutionException` at runtime.

---

## Risks Of Wrong Choice

- Missing binding in `provides()`: `BindingResolutionException` when service is resolved — provider never loads.
- Missing alias in `provides()`: facade or string-based resolution fails silently — returns `null` or throws.
- Stale services manifest: after adding entries to `provides()`, must regenerate cache (`php artisan optimize:clear`).

---

## Related Rules

- Keep `provides()` complete for every deferred provider (05-rules.md, Rule 2)
- Include all aliases in `provides()` (05-rules.md, Rule 4)

---

## Related Skills

- Implement Deferred Providers (deferred-provider-loading-timing)

---

## Decision Name: Event-Driven Loading with `when()`

---

## Decision Context

Using the `when()` method to trigger early loading of a deferred provider when a specific event is dispatched.

---

## Decision Criteria

* performance — `when()` adds overhead on every event dispatch (checks if provider needs loading)
* architectural — enables deferred providers to register listeners before specific events fire
* security — provider loads with full container access
* maintainability — each `when()` entry adds complexity

---

## Decision Tree

Does the deferred provider register event listeners in its `boot()`?
↓
YES → Must the listener run for a specific event that fires before the provider would otherwise be triggered?
YES → Use `when()` to return the event class that triggers preemptive loading
NO → Is the listener for an event that fires on every request?
↓
YES → Consider NOT deferring — the provider loads on every request anyway; `when()` check adds overhead
NO → Does the provider need to respond to an event to set up state before other code runs?
↓
YES → Use `when()` to specify the triggering event class
NO → Deferred provider does not need `when()`

---

## Rationale

The `when()` method returns an array of event classes. When any of these events is dispatched, the deferred provider is loaded preemptively — `register()` and `boot()` run before the event listeners execute. This ensures the listener is registered in time. Each `when()` entry adds a check on every dispatch of that event, so use sparingly.

---

## Recommended Default

**Default:** Omit `when()` unless the provider registers listeners that must fire before the provider's service is first resolved.
**Reason:** Each `when()` entry adds event dispatch overhead and complexity.

---

## Risks Of Wrong Choice

- Not using `when()` for a deferred provider with event listeners: the listener may never register — the provider only loads on its own service resolution, which may happen after the event fires.
- Using `when()` for an event dispatched on every request: the `when()` check fires on every dispatch, and the provider loads on every request — no deferral benefit.
- Over-using `when()`: many entries slow down event dispatch across the application.

---

## Related Rules

- Use `when()` sparingly — each entry adds event dispatch overhead (05-rules.md, Rule 5)

---

## Related Skills

- Implement Deferred Providers (deferred-provider-loading-timing)
