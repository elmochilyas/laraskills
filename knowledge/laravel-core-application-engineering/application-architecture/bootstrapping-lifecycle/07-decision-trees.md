# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture
**Knowledge Unit:** Bootstrapping Lifecycle
**Generated:** 2026-06-03

---

# Decision Inventory

* Provider Registration vs Boot Phase Placement
* Deferred vs Eager Service Provider Loading
* Custom Bootstrapper vs Service Provider for Initialization

---

# Architecture-Level Decision Trees

---

## Decision 1: Provider Registration vs Boot Phase Placement

---

## Decision Context

Service providers have a two-phase contract: `register()` for container bindings, `boot()` for service interaction. Placing logic in the wrong phase causes bootstrap failures.

---

## Decision Criteria

* Whether the code performs binding vs resolution
* Whether it depends on other providers' registrations
* Whether it requires fully resolved services
* Timing of dependency availability

---

## Decision Tree

What does the code do?
↓
Container binding (`$this->app->bind()`, `->singleton()`, `->instance()`, `->tag()`)?
YES → Place in `register()` method
NO → Service resolution or interaction with resolved services?
    YES → Does it depend on bindings from other providers?
        YES → Place in `boot()` method
        NO → Can it use a `resolving` callback instead?
            YES → Use `$this->app->resolving()` in `register()`, logic in callback
            NO → Place in `boot()` method
NO → Business logic, DB queries, API calls?
    YES → This does not belong in a provider — extract to a service/action class

---

## Rationale

The two-phase contract guarantees all `register()` calls complete before any `boot()` begins. Resolving services during `register()` may return partially initialized instances or work only by coincidence. Using `resolving` callbacks eliminates order dependencies.

---

## Recommended Default

**Default:** Bindings in `register()`, service interaction in `boot()`, business logic in dedicated classes
**Reason:** The register phase is for building the container; the boot phase is for using it. Violating this separation is the most common source of bootstrap bugs.

---

## Risks Of Wrong Choice

* Service resolution in `register()`: Works by coincidence until provider order changes, then fails unpredictably
* Business logic in bootstrappers: Runs on every request, cannot be cached or bypassed
* Assuming provider boot order: Fragile when providers are reordered

---

## Related Rules

* Never Resolve Services in register() (05-rules.md)
* Never Rely on Service Provider Boot Order (05-rules.md)
* Never Add Business Logic to Bootstrappers (05-rules.md)

---

## Related Skills

* Skill: Debug Bootstrap Issues
* Skill: Optimize Bootstrap Performance

---

## Decision 2: Deferred vs Eager Service Provider Loading

---

## Decision Context

Whether to mark a service provider as deferred (lazy-loaded only when its services are resolved) or eager (loaded on every request).

---

## Decision Criteria

* Percentage of requests that use the service
* Provider registration cost (class loading, instantiation)
* Complexity of deferred provider setup
* Whether the service is used in bootstrapping

---

## Decision Tree

Is the service used on every request?
↓
YES (80%+ of requests)?
YES → Eager provider (do not defer)
NO → Is the service used on <80% of requests?
    YES → Can the provider be deferred?
        YES → Set `protected $defer = true`
        YES → Implement `provides()` method returning all bound abstracts
        NO → Eager provider (deferred complexity not justified)
NO → Does the service need to be available during other providers' `boot()`?
    YES → Eager provider (deferred providers not loaded during boot sequence)
    NO → Deferred provider

---

## Rationale

Deferred providers avoid the instantiation, register, and boot cost until the service is first resolved. This reduces bootstrap time by 30-70% for large applications. However, the complexity of deferred resolution is not justified when the provider loads on nearly every request anyway.

---

## Recommended Default

**Default:** Eager providers for framework-essential services; deferred for rare-use services (<80% of requests)
**Reason:** The complexity of deferred providers is justified only when the service is infrequently used. For services used on most requests, the overhead of deferred resolution exceeds the benefit.

---

## Risks Of Wrong Choice

* Deferring an eagerly-needed provider: Services not available during boot phase, increased resolution time on first use
* Keeping rarely-used providers eager: Unnecessary bootstrap time (2-5ms per request), increased memory footprint
* Deferred provider without `provides()`: `BindingResolutionException` when service is resolved

---

## Related Rules

* Defer Providers for Services Not Used on Every Request (05-rules.md)

---

## Related Skills

* Skill: Optimize Bootstrap Performance
* Skill: Implement Deferred Service Providers

---

## Decision 3: Custom Bootstrapper vs Service Provider for Initialization

---

## Decision Context

When early initialization is needed before the middleware pipeline runs, choose between adding a custom bootstrapper to the Kernel or using a service provider.

---

## Decision Criteria

* How early in the lifecycle the initialization must run
* Whether the initialization is infrastructure or business logic
* Whether it needs to run before middleware
* Whether caching or deferring is needed

---

## Decision Tree

What needs to happen?
↓
Infrastructure initialization (register logger, set error handlers)?
YES → Must it run before all providers?
    YES → Custom bootstrapper (add to Kernel `$bootstrappers` array)
    NO → Service provider `register()` or `boot()` method
NO → Environment validation or configuration setup?
    YES → Service provider `boot()` method
NO → Business logic, DB queries, or API calls?
    YES → Does it need to run before middleware?
        YES → Likely wrong approach — move to middleware or controller
        NO → Extract to dedicated service, call from command/event/listener

---

## Rationale

Bootstrappers run on every request before middleware and cannot be cached. They are reserved for framework-level infrastructure initialization. Business logic at this stage cannot be bypassed for specific routes and adds latency to every request.

---

## Recommended Default

**Default:** Use service providers for initialization; avoid custom bootstrappers
**Reason:** Service providers support deferring, caching (via optimize), and have a well-defined lifecycle (register then boot). Custom bootstrappers are framework-level extensions that should rarely be needed in application code.

---

## Risks Of Wrong Choice

* Business logic in bootstrappers: Per-request overhead, cannot be cached or skipped, database connection required at bootstrap
* Service provider for pre-provider initialization: Provider runs too late for the initialization to take effect

---

## Related Rules

* Never Add Business Logic to Bootstrappers (05-rules.md)
* Always Run config:cache in Production (05-rules.md)

---

## Related Skills

* Skill: Debug Bootstrap Issues
* Skill: Implement Deferred Service Providers
