# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Octane Memory Management
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | State management strategy for Octane | Architecture | Design |

---

# Architecture-Level Decision Trees

---

## Decision: State Management in Octane

---

## Decision Context

Octane keeps memory across requests. Service providers run once; application state must be reset per-request. Leaks accumulate across requests.

---

## Decision Criteria

* **performance** — no per-request bootstrap saves 30-60%
* **architectural** — state must be request-scoped
* **maintainability** — explicit reset of state per request

---

## Decision Tree

Is the data request-scoped or application-scoped?
↓
**Request** — Store in Laravel's request container. Reset on each request.
**Application** — Store in services (resolved once at worker start). Ensure no request-specific state leaks in.

---

Does the code store data in static properties?
↓
**YES** — Static properties persist across requests. Must be reset per-request or risk leaking state.
**NO** — Safe from this pattern.

---

Does the code register listeners or observers on construct?
↓
**YES** — Move registration to AppServiceProvider. Avoid per-request registration that accumulates listeners.
**NO** — Standard pattern.

---

Is there a growing array or collection that should reset per-request?
↓
**YES** — Initialize in middleware or controller, not in constructor.
**NO** — Monitor memory anyway.

---

## Recommended Default

**Default:** Treat all static/global state as suspect. Reset per-request. Use Laravel's scoped container.
**Reason:** The #1 source of Octane memory leaks is unreset static state.

---

## Risks Of Wrong Choice

* Static state not reset: data leaks between requests
* Service providers with request-specific data: shared state corruption

---

## Related Skills

* Octane Memory Management
