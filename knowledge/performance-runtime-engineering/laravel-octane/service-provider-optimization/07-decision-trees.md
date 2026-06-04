# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Service Provider Optimization
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Service provider registration strategy for Octane | Performance | Optimize |

---

# Architecture-Level Decision Trees

---

## Decision: Service Provider Strategy

---

## Decision Context

In Octane, providers run once per worker startup. Heavy providers increase worker startup time. Deferred providers and eager singletons balance startup vs request performance.

---

## Decision Criteria

* **performance** — provider boot time contributes to worker startup latency
* **architectural** — singleton vs factory registration affects state scope
* **maintainability** — provider organization affects code clarity

---

## Decision Tree

Does the provider register services used on every request?
↓
**YES** — Eager (normal) provider. Services resolved once, cached.
**NO** — Consider making it deferred. Only resolves when service is first requested.

---

Is the provider's boot method heavy (~100ms+)?
↓
**YES** — Defer the provider, or optimize boot method.
**NO** — No action needed.

---

Does the provider register per-request state (middleware, request-scoped services)?
↓
**YES** — Keep eager. Must ensure per-request state is properly scoped.
**NO** — Can defer if rarely used.

---

Can multiple small providers be merged?
↓
**YES** — Merging reduces total provider count and speeds worker startup.
**NO** — Keep separate for clarity.

---

## Recommended Default

**Default:** Eager providers for every-request services. Deferred for rarely-used. Merge small providers.
**Reason:** Reduces worker startup time while maintaining performance for frequent services.

---

## Risks Of Wrong Choice

* Too many deferred providers: per-request resolution overhead
* Too many eager heavy providers: slow worker startup

---

## Related Skills

* Service Provider Optimization
