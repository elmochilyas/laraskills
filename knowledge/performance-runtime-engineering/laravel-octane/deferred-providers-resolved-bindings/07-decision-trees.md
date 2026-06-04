# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Deferred Providers and Resolved Bindings
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Service provider deferral strategy for Octane | Architecture | Design |

---

# Architecture-Level Decision Trees

---

## Decision: Service Provider Deferral

---

## Decision Context

In Octane, service providers run once per worker. Deferred providers (lazy-loaded) avoid resolving services until first use. Binding resolution order must be correct.

---

## Decision Criteria

* **performance** — resolution happens once; persistence across requests
* **architectural** — deferred providers reduce worker startup time
* **maintainability** — binding resolution timing must be deterministic

---

## Decision Tree

Is the service used on every request?
↓
**YES** — Don't defer. Resolve eagerly during provider boot. Single resolution cached.
**NO** — Defer. Reduces worker startup time.

---

Does the binding depend on per-request state (request, auth)?
↓
**YES** — Register as a factory (closure that captures request state). Cannot be singleton.
**NO** — Singleton is fine. Resolved once per worker.

---

Is the service provider heavy (many registrations)?
↓
**YES** — Consider splitting into deferred sub-providers. Load on demand.
**NO** — Single provider is fine.

---

## Recommended Default

**Default:** Resolve per-request services as factories. Resolve app-wide singletons eagerly in provider.
**Reason:** Balances startup speed with correct request-scoped resolution.

---

## Risks Of Wrong Choice

* Singleton for request-scoped service: wrong data leaked across requests
* Deferred provider used in every request: extra lookup overhead

---

## Related Rules

* Eager-Load Every-Request Providers
* Defer Rarely-Used Providers

---

## Related Skills

* Deferred Providers and Resolved Bindings
