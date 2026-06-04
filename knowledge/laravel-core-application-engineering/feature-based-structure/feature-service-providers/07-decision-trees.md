# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Module Auto-Discovery
**Generated:** 2026-06-03

---

# Decision Inventory

* Per-Feature Service Provider vs Single AppServiceProvider
* register() vs boot() — What Goes Where
* Deferred Provider vs Eager Provider for Feature Bindings

---

# Architecture-Level Decision Trees

---

## Decision 1: Per-Feature Service Provider vs Single AppServiceProvider

---

## Decision Context

Whether to create a dedicated service provider for each feature or put all feature registrations in `AppServiceProvider`.

---

## Decision Criteria

* Number of features in the application
* Whether features need independent toggleability (enable/disable by adding/removing provider)
* Whether features have distinct registration needs (routes, views, migrations, bindings)
* Whether the team values modular provider architecture or simplicity

---

## Decision Tree

How many features exist in the application?
↓
1-2 features?
YES → Use `AppServiceProvider` — single provider is simpler, no modularity benefit yet
NO → 3-5 features?
    YES → Do features need independent toggleability?
        YES → Per-feature providers — toggle by registering/unregistering in `config/app.php`
        NO → Does each feature have distinct registrations (custom routes, views, migrations)?
            YES → Per-feature providers — each provider handles its feature's registrations
            NO → `AppServiceProvider` — registrations are simple enough to centralize
NO → 5+ features?
    YES → Per-feature providers required — `AppServiceProvider` with 50+ lines of registrations is unmanageable

---

## Rationale

Per-feature providers serve as a manifest of what each feature contributes to the application. They make features toggleable, testable in isolation, and enable eventual extraction into packages. The 3-feature threshold is where the modular benefit starts to justify the provider-per-feature overhead.

---

## Recommended Default

**Default:** Per-feature service providers for applications with 3+ features. `AppServiceProvider` for 1-2 features.
**Reason:** At 3+ features, the `AppServiceProvider` accumulates enough registrations that per-feature providers provide meaningful organization and toggleability.

---

## Risks Of Wrong Choice

* Single provider for 10 features: 100+ lines of unrelated registrations — hard to navigate, easy to break
* Per-feature provider for 1 feature: Provider file with 2 lines — unnecessary file overhead
* No provider toggleability: Feature can't be disabled without deleting code
* Providers in wrong order: Dependency between features — Billing provider before User provider causes errors

---

## Related Rules

* Keep register() For Container Bindings Only
* Feature Provider Registration Order

---

## Related Skills

* Create A Feature Service Provider

---

---

## Decision 2: register() vs boot() — What Goes Where

---

## Decision Context

Which registrations go in the feature provider's `register()` method versus the `boot()` method.

---

## Decision Criteria

* Whether the registration is a container binding (bind, singleton, tag)
* Whether the registration depends on other providers having already registered
* Whether the registration interacts with framework components (routes, views, events)
* Whether the registration accesses configuration values

---

## Decision Tree

Is the registration a container binding (`$this->app->bind()`, `$this->app->singleton()`)?
↓
YES → Does the binding depend on bindings from other providers?
    YES → Use `boot()` — ensures all providers' `register()` methods have run
    NO → Use `register()` — bindings belong in register, framework interactions belong in boot
NO → Does the registration interact with framework components (routes, views, migrations, events)?
    YES → Use `boot()` — framework components may not be available during `register()`
    NO → Does the registration access config values (`config('feature.key')`)?
        YES → Use `boot()` — config may not be fully merged during `register()`
        NO → Use `register()` — pure bindings with no dependencies

---

## Rationale

`register()` is for service container bindings that don't depend on other providers or framework components. `boot()` is for everything that interacts with the framework — loading routes, registering views, merging config, adding event listeners. This separation prevents the common bug of accessing null services during `register()`.

---

## Recommended Default

**Default:** Container bindings in `register()`. All framework interactions (routes, views, config) in `boot()`.
**Reason:** This follows Laravel's provider lifecycle rules and prevents the most common service provider bugs (null references, missing config).

---

## Risks Of Wrong Choice

* Routes in `register()`: Route loader not available — `Call to undefined method`
* Config merge in `register()`: Config returns `null` — services configured with missing values
* Bindings in `boot()`: Works but violates convention — other developers expect bindings in `register()`
* Framework interactions in `register()`: Hard-to-debug errors — provider order dependency issues

---

## Related Rules

* Keep register() For Container Bindings Only
* Feature Provider Registration Order

---

## Related Skills

* Create A Feature Service Provider

---

---

## Decision 3: Deferred Provider vs Eager Provider for Feature Bindings

---

## Decision Context

Whether to make a feature service provider deferred (loaded only when its bindings are requested) or eager (loaded on every request).

---

## Decision Criteria

* Whether the provider only registers container bindings (no boot-time logic)
* Whether the feature's services are used on every request or only specific routes
* Whether the provider has `boot()` logic that must run on every request
* Whether performance optimization is a current concern or premature

---

## Decision Tree

Does the provider only contain container bindings (no boot logic, no events, no routes)?
↓
YES → Are the bindings used on every request?
    YES → Eager provider — no benefit from deferring, the bindings will be resolved anyway
    NO → Are the bindings used only on specific routes or queue jobs?
        YES → Deferred provider (`$defer = true`) — bindings loaded only when first resolved
        NO → Eager provider — default behavior, simpler configuration
NO → Does the provider have `boot()` logic (routes, views, events, config merge)?
    YES → Eager provider required — `boot()` only runs on eager providers
    NO → Eager provider — default

---

## Rationale

Deferred providers improve performance by loading only the providers whose bindings are actually used on the current request. If the billing feature's services are only used on `/billing/*` routes, a deferred provider avoids loading billing bindings on every other request. The cost is slightly more complex provider setup.

---

## Recommended Default

**Default:** Eager providers for most features. Deferred providers only for features whose bindings are used on a subset of requests and have no boot logic.
**Reason:** Deferred providers are an optimization, not a default. They add complexity. Only use them when profiling shows a meaningful performance benefit.

---

## Risks Of Wrong Choice

* Deferred provider with boot logic: `boot()` never runs — routes, views, events not registered
* Eager provider for infrequently used feature: Bindings loaded on every request — unnecessary overhead
* Deferred provider for frequently used feature: No performance benefit, added complexity
* Deferred provider with event listeners: Listeners never registered — events silently unhandled

---

## Related Rules

* Deferred Service Provider Optimization
* Feature Provider Registration Order

---

## Related Skills

* Create A Feature Service Provider
