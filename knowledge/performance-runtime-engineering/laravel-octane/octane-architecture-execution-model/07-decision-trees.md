# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** Octane Architecture and Execution Model
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Understanding Octane's execution model | Architecture | Design |

---

# Architecture-Level Decision Trees

---

## Decision: Understanding Octane Execution Model

---

## Decision Context

Octane boots Laravel once per worker, then handles multiple requests in that worker. Services resolved once persist. Request-scoped services must be reset.

---

## Decision Criteria

* **performance** — bootstrap runs once, not per-request
* **architectural** — service containers are persisted
* **maintainability** — state management is the key difference from FPM

---

## Decision Tree

Is the application already profiled to confirm bootstrap >20% of request time?
↓
**YES** — Octane will provide meaningful throughput gain.
**NO** — Profile first. Low-bootstrap apps see minimal gain.

---

Are there singleton services with request-scoped dependencies?
↓
**YES** — These must use Octane's flush strategies (Defer, reset middleware).
**NO** — Standard singleton pattern works.

---

Are static properties used for caching or state?
↓
**YES** — Must be reviewed. Static state persists across requests in Octane.
**NO** — Reduced risk of state leaks.

---

Does the app use middleware or service providers that register listeners?
↓
**YES** — Move registration to AppServiceProvider. Prevent listener accumulation.
**NO** — Standard pattern.

---

## Recommended Default

**Default:** Review state management first, deploy Octane second.
**Reason:** State bugs are the #1 issue with Octane migration.

---

## Risks Of Wrong Choice

* Deploying without state audit: data leaks between requests
* Assuming FPM-debugged code works in Octane: state persistence changes behavior

---

## Related Skills

* Octane Architecture and Execution Model
