# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** State Management and Leak Prevention
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | State management strategy for Octane | Architecture | Design |
| 2 | Identifying and fixing state leaks | Debug | Diagnose |

---

# Architecture-Level Decision Trees

---

## Decision: State Management Strategy

---

## Decision Context

Octane persists memory across requests. Static/global state leaks between requests if not properly reset. Must distinguish request-scoped from application-scoped state.

---

## Decision Criteria

* **performance** — correct state management enables safe persistent memory
* **architectural** — request scope must be explicitly managed
* **maintainability** — reset mechanisms add complexity

---

## Decision Tree

Is the state request-scoped (user, request, session)?
↓
**YES** — Use Laravel's request container. Reset on each request automatically.
**NO** — Application-scoped (config, services). Safe in singleton.

---

Does the code use static properties on classes?
↓
**YES** — Must be reset per request. Add middleware or use Octane's reset mechanism.
**NO** — Standard state management.

---

Does the code use global variables ($GLOBALS)?
↓
**YES** — Incompatible with Octane. Refactor to request-scoped container.
**NO** — Safe.

---

Are there listeners accumulating in event dispatcher?
↓
**YES** — Move listener registration from constructor/boot to service provider. Octane handles dispatcher reset.
**NO** — Standard pattern.

---

Is there a growing collection or array that grows per-request?
↓
**YES** — Initialize inside request handler, not in constructor.
**NO** — Standard pattern.

---

## Recommended Default

**Default:** Use Laravel's container for request-scoped state. Avoid statics/globals. Register listeners in service providers.
**Reason:** These patterns automatically reset per-request in Octane.

---

## Risks Of Wrong Choice

* Any unreset static state: data leaks between requests
* Singleton with request-scoped dependency: wrong data

---

## Related Skills

* State Management and Leak Prevention
