# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture
**Knowledge Unit:** Service Provider Strategies
**Generated:** 2026-06-03

---

# Decision Inventory

* Provider Phase Placement (register vs boot)
* Eager vs Deferred Provider Loading
* Provider Organization (Monolithic vs Domain-Scoped)

---

# Architecture-Level Decision Trees

---

## Decision 1: Provider Phase Placement (register vs boot)

---

## Decision Context

Whether to place logic in a service provider's `register()` or `boot()` method based on what the code does.

---

## Decision Criteria

* Whether the code performs binding vs resolution
* Whether it depends on other providers' registrations
* Whether it interacts with resolved services (observers, routes, events)
* Whether it uses facades or helpers

---

## Decision Tree

What does the code do?
↓
Container binding (`$this->app->bind()`, `->singleton()`, `->instance()`, `->tag()`)?
YES → Place in `register()`
NO → Service resolution or interaction with resolved services?
    YES → Place in `boot()` — all providers have completed registration
NO → Model observer registration (`Order::observe()`) or event listener?
    YES → Place in `boot()` — models and events are available after registration
NO → Route registration or configuration?
    YES → Place in `boot()` — routing is configured after all providers register
NO → Conditional provider registration (environment-gated)?
    YES → Use `$this->app->register()` inside `register()` with environment check

---

## Rationale

The two-phase provider contract guarantees all `register()` calls across all providers complete before any `boot()` begins. `register()` is for building the container (bindings only). `boot()` is for using it (resolution, observers, routes, events). Service resolution during `register()` returns potentially partially initialized instances.

---

## Recommended Default

**Default:** Container bindings in `register()`, all service interaction in `boot()` using method injection
**Reason:** Thin `register()` makes bindings easy to audit. `boot()` method injection provides resolved services cleanly. This separation prevents the most common provider bug — resolving services before they're fully registered.

---

## Risks Of Wrong Choice

* Service resolution in `register()`: Returns partially initialized service, works by coincidence until provider order changes
* Business logic in providers: Runs on every request, untestable without booting the provider
* Facades in `register()`: Facades may not have their application reference set yet

---

## Related Rules

* Keep register() Thin — Only Container Bindings (05-rules.md)
* Use Method Injection in boot() (05-rules.md)
* Never Put Business Logic in Service Providers (05-rules.md)

---

## Related Skills

* Skill: Keep register() Thin with Container Bindings

---

## Decision 2: Eager vs Deferred Provider Loading

---

## Decision Context

Whether a service provider should be loaded on every request (eager) or only when its services are first resolved (deferred).

---

## Decision Criteria

* Percentage of requests that use the provider's services
* Provider instantiation and registration cost
* Whether the provider registers observers or event listeners
* Complexity of deferred manifest management

---

## Decision Tree

Is the service used on >80% of requests?
↓
YES → Eager provider — deferred overhead not justified
NO → Does the provider register model observers or event listeners?
    YES → Eager provider — deferred providers cannot register observers at boot
NO → Is the provider used on <80% of requests?
    YES → Deferred provider — set `protected $defer = true`
    YES → Implement `provides()` returning all bound abstract names
    NO → Is the provider a debug toolbar or profiler?
        YES → Environment-gated (non-production) eager provider

Is `php artisan optimize` run in the deployment pipeline?
YES → Deferred manifest is compiled, deferred providers work correctly
NO → Deferred providers fall back to eager loading — benefit lost

---

## Rationale

Deferred providers avoid instantiation, register, and boot cost until the service is first resolved. For services used infrequently, this eliminates bootstrap overhead entirely, reducing bootstrap time by 30-70%. However, deferred providers cannot register observers or event listeners, and they require the `optimize` command to compile the manifest.

---

## Recommended Default

**Default:** Eager for framework-essential and frequently-used services; deferred for rare-use services (<80% of requests)
**Reason:** The deferred manifest adds complexity (must implement `provides()`, must run `optimize`). Only justify this for services that are not used on most requests.

---

## Risks Of Wrong Choice

* Deferring an eagerly-needed provider: Service not found during boot phase of other providers
* Keeping rarely-used providers eager: 2-5ms additional bootstrap overhead per request
* Deferred provider without `provides()`: `BindingResolutionException` when resolved
* Deferred provider with observers/listeners: Observers never registered — silent bug

---

## Related Rules

* Defer Providers for Services Not Used on Every Request (05-rules.md)
* Implement provides() for Every Deferred Provider (05-rules.md)
* Gate Debug/Profiler Providers by Environment (05-rules.md)

---

## Related Skills

* Skill: Keep register() Thin with Container Bindings
* Skill: Organize Service Providers by Domain

---

## Decision 3: Provider Organization (Monolithic vs Domain-Scoped)

---

## Decision Context

Whether to register all bindings in a single monolithic provider or create separate providers per domain/bounded context.

---

## Decision Criteria

* Total number of container bindings
* Number of distinct business domains
* Team ownership structure
* Need for selective provider registration

---

## Decision Tree

How many container bindings does the application have?
↓
< 10 bindings?
YES → Single `AppServiceProvider` is sufficient
NO → 10+ bindings?
    YES → Are there distinct bounded contexts (domains)?
        YES → Create one provider per domain (BillingServiceProvider, SalesServiceProvider, etc.)
        NO → Group by concern: infrastructure providers, application providers
NO → Multiple teams owning different parts of the codebase?
    YES → One provider per team-owned domain with clear boundaries
    NO → Domain providers (single team, but organized for clarity)

Can any domain provider be deferred?
YES → Deferred providers enable per-domain lazy loading
NO → All domains are used on every request — keep eager

---

## Rationale

Monolithic providers with 50+ bindings violate single responsibility, make selective deferral impossible, and create a registration point that every developer must touch. Domain-scoped providers provide clear ownership, enable selective deferral, and scale to large teams.

---

## Recommended Default

**Default:** Single `AppServiceProvider` for <10 bindings; domain-scoped providers for 10+ bindings or 2+ bounded contexts
**Reason:** Small applications don't need provider organization overhead. Once the application has clear domain boundaries or enough bindings to warrant organization, domain providers provide clarity and ownership.

---

## Risks Of Wrong Choice

* Monolithic provider at scale: Unmanageable, no ownership, impossible to selectively defer
* Domain providers for tiny app: Unnecessary files, registration overhead, premature abstraction
* Cross-domain bindings in wrong provider: Unclear ownership, duplicate bindings, confusion

---

## Related Rules

* Organize Providers by Domain or Bounded Context (05-rules.md)
* Keep register() Thin — Only Container Bindings (05-rules.md)
* Gate Debug/Profiler Providers by Environment (05-rules.md)

---

## Related Skills

* Skill: Keep register() Thin with Container Bindings
* Skill: Organize Service Providers by Domain
