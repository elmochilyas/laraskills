# Decomposition: Service Provider Optimization

## Topic Overview
In Octane's memory-resident model, service provider `register()` and `boot()` methods run **once per worker start**, not per request. This means: 1) Singletons persist across requests (can be used for connection pooling), 2) Any provider registering stateful bindings must use the `$app->scoped()` or `$app->singleton()` pattern correctly, 3) Providers with side effects in `boot()` (event listeners, middleware registration) must not accumulate registrations over time.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
laravel-octane-performance/service-provider-optimization/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Service Provider Optimization
- **Purpose:** In Octane's memory-resident model, service provider `register()` and `boot()` methods run **once per worker start**, not per request. This means: 1) Singletons persist across requests (can be used for connection pooling), 2) Any provider registering stateful bindings must use the `$app->scoped()` or `$app->singleton()` pattern correctly, 3) Providers with side effects in `boot()` (event listeners, middleware registration) must not accumulate registrations over time.
- **Difficulty:** Intermediate
- **Dependencies:
  - Resolved Bindings | Octane Service Container Lifecycle
  - --

## Dependency Graph
**Depends on:**
  - Resolved Bindings | Octane Service Container Lifecycle
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - State audit
  - Registering event listeners per-request in a provider
  - Power plant model
  - Safe migration pattern

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization