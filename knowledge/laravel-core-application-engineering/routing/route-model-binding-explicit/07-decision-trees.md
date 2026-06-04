# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Route Model Binding (Explicit)
**Generated:** 2026-06-03

---

# Decision Inventory

* Route::model() vs Route::bind() for Explicit Registration
* Explicit Binding in Service Provider vs Inline in Route File
* Binding with Caching vs Uncached Resolution
* Custom resolveRouteBinding on Model vs Route::bind() in Provider

---

# Architecture-Level Decision Trees

---

## Decision 1: Route::model() vs Route::bind() for Explicit Registration

---

## Decision Context

Whether to use `Route::model()` (class-to-parameter mapping) or `Route::bind()` (closure-based resolution) for explicit binding registration.

---

## Decision Criteria

* Whether the resolution logic is standard `findOrFail` or custom
* Whether the binding needs caching, authorization, or non-standard logic
* Whether the binding documents the parameter-model relationship

---

## Decision Tree

Is the resolution logic a simple `Model::findOrFail($value)`?
↓
YES → Is the binding intended to explicitly document the parameter-model relationship?
    ↓
    YES → `Route::model('user', User::class)` — explicit documentation of implicit-like behavior
    NO → Implicit binding is sufficient — no explicit registration needed
NO → Does the resolution need custom logic (cache, join, query scope)?
    ↓
    YES → `Route::bind('user', fn($value) => ...)` — closure provides full control
    NO → Does the resolution need authorization or error handling?
        ↓
        YES → `Route::bind()` — custom logic before/after resolution
        NO → `Route::model()` — standard findOrFail with explicit mapping

---

## Rationale

`Route::model()` registers a parameter-to-class mapping that performs the equivalent of implicit binding (`Model::findOrFail($value)`). It adds marginal clarity over implicit binding. `Route::bind()` registers a closure that receives the URL segment value and returns any resolved value — it provides full control over resolution including caching, authorization, and non-standard queries.

---

## Recommended Default

**Default:** Use implicit binding for standard `findOrFail` resolution. Use `Route::bind()` for custom resolution logic. Use `Route::model()` only when explicit documentation of the binding relationship is needed.
**Reason:** Implicit binding is zero-configuration for standard cases. `Route::bind()` is needed for custom logic. `Route::model()` adds ceremony without functional benefit over implicit binding.

---

## Risks Of Wrong Choice

* `Route::model()` for custom logic: Cannot customize resolution; stuck with `findOrFail`
* `Route::bind()` for standard findOrFail: Unnecessary closure; implicit binding does the same with less code
* Implicit binding when documentation is needed: New developers don't know which model the parameter resolves to
* Duplicate binding: Both `Route::model()` and implicit binding for same parameter — explicit wins; developer may think implicit is active

---

## Related Rules

* Use Type-Hinted Parameters in Controllers
* Keep Bindings Simple

---

## Related Skills

* Register Explicit Model Bindings Using Route::bind()
* Implement Cached Model Resolution in Explicit Bindings

---

---

## Decision 2: Explicit Binding in Service Provider vs Inline in Route File

---

## Decision Context

Where to register explicit bindings — in a dedicated service provider or inline in route files.

---

## Decision Criteria

* Whether the binding is shared across multiple route files
* Whether the binding logic is complex enough to warrant centralized management
* Whether the team uses dedicated providers for different concerns

---

## Decision Tree

Is the binding used across multiple route files (web.php, api.php)?
↓
YES → Service provider — centralized; shared by all route files
NO → Is the binding logic complex (caching, joins, authorization)?
    ↓
    YES → Service provider — complex logic benefits from centralization and testability
    NO → Inline in route file — simple binding visible where used
NO → Does the team use dedicated providers for separation of concerns?
    ↓
    YES → Dedicated `BindingsServiceProvider` — separates binding logic from other provider concerns
    NO → `AppServiceProvider::boot()` — acceptable for small applications with few bindings

---

## Rationale

Explicit bindings are registered in service provider `boot()` methods. A dedicated `BindingsServiceProvider` keeps binding logic separate from general application bootstrapping. This separation makes bindings easy to audit — developers know exactly where to look for binding configuration. Complex bindings (with caching, authorization) benefit from centralized, documented logic.

---

## Recommended Default

**Default:** Register explicit bindings in a dedicated `BindingsServiceProvider`. Keep simple bindings in the route file if they are single-use and trivially simple.
**Reason:** A dedicated provider makes bindings discoverable and auditable. Complex bindings separated from route definitions.

---

## Risks Of Wrong Choice

* Bindings in multiple route files: Duplicate registration; inconsistent behavior; one file may not load before routes are dispatched
* All bindings in AppServiceProvider: Provider grows large; binding logic mixed with other concerns
* Binding in route file before group middleware: Binding runs before middleware; binding logic cannot depend on auth or session
* Missing provider registration: Explicit binding never registered — falls back to implicit or no binding

---

## Related Rules

* Keep Bindings Simple
* Register in a Dedicated Provider

---

## Related Skills

* Register Explicit Model Bindings Using Route::bind()
* Create a Dedicated BindingsServiceProvider for Route Model Bindings

---

---

## Decision 3: Binding with Caching vs Uncached Resolution

---

## Decision Context

Whether to cache resolved models in explicit bindings to avoid repeated database queries.

---

## Decision Criteria

* Whether the same model may be resolved multiple times per request
* Whether the model data changes frequently
* Whether cache invalidation is manageable

---

## Decision Tree

Can the same model be resolved multiple times during a single request?
↓
NO → Uncached — one query per resolution is acceptable
YES → Is the model data relatively stable (not changing every minute)?
    ↓
    YES → Cached binding — `Cache::remember("user.{$value}", 3600, fn() => ...)`
    NO → Is per-request caching sufficient (not shared across requests)?
        ↓
        YES → Request-scoped cache — array property on the binding closure; cleared per request
        NO → Uncached — data is too volatile for caching
NO → Is cache invalidation straightforward?
    ↓
    YES → Cached binding — clear cache on model save/delete via observer
    NO → Request-scoped cache only — don't cache across requests if invalidation is complex

---

## Rationale

Explicit bindings run before controller code. A slow binding (multiple cache lookups, complex joins, API calls) delays every request that hits the route. Caching speeds up repeated resolutions. However, cached bindings must be invalidated when the model changes, or stale data is served. Per-request caching (storing resolved models in an array) is safer than shared caching.

---

## Recommended Default

**Default:** Uncached for simple ID-based resolutions. Request-scoped cache for models resolved multiple times per request. Shared cache with invalidation for expensive resolutions (API calls, complex joins).
**Reason:** Caching adds complexity. Only pay the cost when the resolution is demonstrably expensive or repeated.

---

## Risks Of Wrong Choice

* Uncached repeated resolution: Same model queried 3x per request; N+1 on route binding
* Shared cache without invalidation: Stale model served after update; user sees old data
* Cache key collision: Two models with the same key in different contexts; wrong model served
* Binding closure with side effects: Cache stores the resolved model but side effects (logging, events) are skipped on cache hit

---

## Related Rules

* Keep Bindings Simple
* Register in a Dedicated Provider

---

## Related Skills

* Register Explicit Model Bindings Using Route::bind()
* Implement Cached Model Resolution in Explicit Bindings

---

---

## Decision 4: Custom resolveRouteBinding on Model vs Route::bind() in Provider

---

## Decision Context

Whether to override `resolveRouteBinding()` on the model class or use `Route::bind()` in a service provider for custom resolution.

---

## Decision Criteria

* Whether the custom resolution applies to ALL routes for the model
* Whether the customization is model-level or route-level
* Whether the model class needs to remain framework-agnostic

---

## Decision Tree

Does the custom resolution apply to ALL routes using this model?
↓
YES → `resolveRouteBinding()` on the model — centralizes binding behavior for the model
NO → `Route::bind()` in provider — per-route customization without affecting other routes
NO → Is the customization needed for a specific binding behavior (different columns, different queries)?
    ↓
    YES → `Route::bind()` — specific handling for specific routes
    NO → Implicit binding — no customization needed
NO → Is the model class intentionally framework-agnostic?
    ↓
    YES → `Route::bind()` — avoids coupling the model to the routing framework
    NO → Either — if customization is model-wide, `resolveRouteBinding()` is cleaner

---

## Rationale

`resolveRouteBinding()` on the model affects ALL bindings of that model — both implicit and explicit. It's the right choice when the model's binding behavior is fundamentally different from `findOrFail`. `Route::bind()` is per-parameter and overrides any model-level binding for that specific parameter. Use `resolveRouteBinding()` when the model identity is non-standard; use `Route::bind()` for route-specific exceptions.

---

## Recommended Default

**Default:** `Route::bind()` for per-route customizations. `resolveRouteBinding()` for model-wide binding behavior changes.
**Reason:** `Route::bind()` is explicit at the registration level. `resolveRouteBinding()` silently affects all bindings and should be reserved for fundamental model identity changes.

---

## Risks Of Wrong Choice

* `resolveRouteBinding()` for single route: All bindings of the model change behavior; other routes get unexpected resolution
* `Route::bind()` for model-wide: Must register the same binding for every parameter name — duplication
* Both registered: `Route::bind()` overrides `resolveRouteBinding()` for the specific parameter; confusing precedence
* Custom `resolveRouteBinding()` throwing different exception: `ModelNotFoundException` returns 404; custom exception may not be caught

---

## Related Rules

* Keep Bindings Simple
* Register in a Dedicated Provider

---

## Related Skills

* Register Explicit Model Bindings Using Route::bind()
* Override resolveRouteBinding for Model-Wide Custom Resolution
