# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** Octane Boot Timing
**Generated:** 2026-06-03

---

# Decision Inventory

1. Binding Lifetime: `scoped()` vs `singleton()` for Octane safety
2. Provider Strategy: Deferred vs eager under Octane
3. Worker Lifecycle: State cleanup between Octane requests

---

# Architecture-Level Decision Trees

---

## Decision Name: Binding Lifetime Selection for Octane

---

## Decision Context

Choosing between `$app->scoped()` and `$app->singleton()` when registering services in applications running under Octane.

---

## Decision Criteria

* performance — singletons avoid per-request instantiation; scoped adds ~0.1ms per request
* architectural — singletons persist across requests; scoped are flushed between requests
* security — singletons with request-scoped state leak user data between requests
* maintainability — `scoped()` is the Octane-safe default for stateful services

---

## Decision Tree

Does the service hold mutable state that varies per request (user data, request metadata, session)?
↓
YES → Use `$app->scoped()` — automatically flushed between Octane requests
NO → Is the service stateless (no mutable properties, no captured references)?
↓
YES → Use `$app->singleton()` — safe to reuse, better performance, no leak risk
NO → Does the service depend on a scoped service?
↓
YES → Use `$app->scoped()` — a singleton depending on a scoped creates stale dependency
NO → Would reusing the same instance across requests cause incorrect behavior?
↓
YES → Use `$app->scoped()` — fresh instance per request
NO → Use `$app->singleton()` if truly stateless; `scoped()` if unsure

---

## Rationale

Under Octane, singletons persist across all requests handled by a single worker. If a singleton holds user data from request #1, request #2 sees user #1's data — this is the #1 Octane data contamination issue. `scoped()` creates one instance per request, which is cleared when `flush()` runs between requests. Only truly stateless services (no mutable properties) are safe with `singleton()`.

---

## Recommended Default

**Default:** `$app->scoped()` for any service that interacts with request data; `$app->singleton()` only for demonstrably stateless utility services.
**Reason:** Prevents the most common Octane data leak.

---

## Risks Of Wrong Choice

- `singleton()` with request-scoped state: user data leaks between requests — security incident.
- `scoped()` for stateless services: unnecessary per-request instantiation overhead.
- Singleton depending on scoped: stale scoped dependency — pulled once, never refreshed.

---

## Related Rules

- Use scoped() for per-request state in Octane (05-rules.md, Rule 1)
- Audit all singletons for mutable state (05-rules.md, Rule 3)

---

## Related Skills

- Manage Octane Boot Timing (06-skills.md)

---

## Decision Name: Provider Strategy Under Octane

---

## Decision Context

Choosing between deferred and eager provider registration when the bootstrap cost is amortized across thousands of Octane requests.

---

## Decision Criteria

* performance — deferred providers reduce per-worker startup time and memory; eager providers have near-zero per-request cost
* architectural — under Octane, all providers (deferred or eager) boot once per worker, not per request
* security — deferred providers load on first resolution, which may be later than expected
* maintainability — deferred providers add complexity (`provides()`, manifest)

---

## Decision Tree

Is the provider's service used on most requests?
↓
YES → Use eager provider — deferral provides no benefit under Octane since boot is one-time anyway
NO → Does the provider only register bindings (no boot logic)?
↓
YES → Use deferred provider — saves per-worker memory and startup time if the service is rarely used
NO → Is reducing worker startup time a priority (e.g., auto-scaling, rapid deployment)?
↓
YES → Consider deferring heavy providers — faster worker ready time at cost of first-use latency
NO → Use eager provider — under Octane, the performance difference is minimal; simplicity wins

---

## Rationale

Under Octane, both deferred and eager providers boot once per worker. The bootstrap cost is amortized across thousands of requests — effectively zero per request. Deferred providers still benefit from not loading their service classes (saving memory) and slightly faster worker startup. However, the dramatic performance difference seen in FPM between deferred and eager providers does not exist under Octane.

---

## Recommended Default

**Default:** Eager providers for simplicity under Octane; defer only heavy, rarely-used, binding-only providers.
**Reason:** Under Octane, deferral benefit is marginal; simplicity and code clarity matter more.

---

## Risks Of Wrong Choice

- Deferring every provider under Octane: first request pays all provider load costs — slow first request per worker.
- Deferring a provider with boot() logic under Octane: boot() runs on first resolution — may be too late for setup.
- Not pre-resolving critical deferred services: unnecessary first-use latency spike.

---

## Related Rules

- Pre-resolve hot-path services in booted() (05-rules.md, Rule 2)
- Audit all singletons for mutable state (05-rules.md, Rule 3)

---

## Related Skills

- Manage Octane Boot Timing (06-skills.md)
