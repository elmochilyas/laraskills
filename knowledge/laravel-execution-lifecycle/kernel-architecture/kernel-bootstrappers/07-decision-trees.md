# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Kernel Architecture
**Knowledge Unit:** Kernel Bootstrappers Array
**Generated:** 2026-06-03

---

# Decision Inventory

1. Custom Bootstrapper: Service provider vs custom bootstrapper for custom initialization
2. Bootstrap Optimization: Config caching vs provider deferral
3. Guard Safety: Re-bootstrapping strategy in long-running processes

---

# Architecture-Level Decision Trees

---

## Decision Name: Custom Initialization Strategy

---

## Decision Context

Choosing between a custom bootstrapper and a service provider for custom initialization that must run before or after the standard bootstrappers.

---

## Decision Criteria

* performance — bootstrappers run on every request; lightweight or deferred preferred
* architectural — bootstrappers run before service providers; providers are the standard extension point
* security — bootstrappers have full container access before middleware
* maintainability — service providers are the documented extension point

---

## Decision Tree

Does the initialization need to run BEFORE service providers register?
↓
YES → Use a custom bootstrapper — runs during the bootstrap phase, before `RegisterProviders`
NO → Does the initialization need to run AFTER all providers boot?
↓
YES → Use a `booted()` callback registered via `$app->booted()` in a service provider's `register()` method
NO → Does the initialization belong to a specific provider's concern?
↓
YES → Use the provider's `boot()` method — the standard extension point
NO → Does the initialization need to run on every request (not just once per lifecycle)?
↓
YES → Use middleware — runs during the request pipeline, not during bootstrap
NO → Use a service provider — the default and standard extension point

---

## Rationale

Custom bootstrappers are added to the kernel's `$bootstrappers` array and run during the bootstrap phase, before any service provider is registered. They are appropriate for framework-level initialization (loading tenant configuration from a database). However, modifying the kernel's bootstrapper array is not a documented extension point for user code — service providers and lifecycle hooks cover virtually all needs.

---

## Recommended Default

**Default:** Use service providers for initialization; only add custom bootstrappers for framework-level concerns that must run before providers.
**Reason:** Service providers are the documented, supported extension point.

---

## Risks Of Wrong Choice

- Custom bootstrapper that duplicates provider functionality: two code paths doing the same thing — confusion.
- Bootstrapper that resolves services before they are registered: `BindingResolutionException`.
- Adding a bootstrapper that does heavy I/O: delays every request's bootstrap time.

---

## Related Skills

- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)
- Manage Lifecycle Callback Hooks (lifecycle-callback-hooks)

---

## Decision Name: Bootstrap Optimization Priority

---

## Decision Context

Choosing between config caching and provider deferral for reducing bootstrap overhead.

---

## Decision Criteria

* performance — config caching reduces `LoadConfiguration` from ~15ms to ~0.1ms; deferral skips providers entirely
* architectural — config caching freezes config at build time; deferral preserves runtime loading
* security — `env()` calls in cached config are resolved at build time
* maintainability — both require CI pipeline integration

---

## Decision Tree

Has config caching been enabled?
↓
YES → Config loading is already optimized (0.1ms vs 15ms uncached) — focus on provider optimization
NO → Enable `php artisan config:cache` first — highest-impact optimization
↓
Are there providers that only register bindings (no boot logic)?
YES → Implement `DeferrableProvider` — these providers skip bootstrap entirely on requests that don't use their services
NO → Are there providers with heavy boot() logic that is not needed on every request?
↓
YES → Split into deferred binding provider + eager boot provider (or use `when()`)
NO → Are there > 30 providers in the application?
↓
YES → Audit provider count; merge small providers; consider deferred providers for infrequently-used services
NO → Bootstrap is likely already optimized

---

## Rationale

Config caching is the single highest-impact bootstrap optimization — reducing `LoadConfiguration` from ~15ms to ~0.1ms. Provider deferral is next, eliminating `register()` + `boot()` cost for providers whose services are not used on the current request. Together, these reduce bootstrap from 30-80ms to 5-15ms.

---

## Recommended Default

**Default:** Enable config caching in production; defer providers that only register bindings.
**Reason:** Highest-impact optimizations with minimal code change.

---

## Risks Of Wrong Choice

- Config caching without clearing during development: stale config values — unexpected behavior.
- Deferring a provider used on most requests: no performance gain, added complexity, first-use latency spike.
- Not auditing provider count: 60+ small providers each adding 0.5ms = 30ms bootstrap overhead from registration alone.

---

## Related Skills

- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)
- Implement Deferred Providers (deferred-providers)
