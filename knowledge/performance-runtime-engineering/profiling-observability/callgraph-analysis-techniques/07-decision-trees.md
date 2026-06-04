# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Profiling and Observability
**Knowledge Unit:** Callgraph Analysis Techniques
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Callgraph analysis approach | Performance | Analyze |

---

# Architecture-Level Decision Trees

---

## Decision: Callgraph Analysis

---

## Decision Context

Callgraphs show function call relationships and time distribution. Analyze from hot leaf upward to identify optimization candidates.

---

## Decision Criteria

* **performance** — callgraph reveals why a function is slow
* **operations** — callgraph interpretation requires understanding caller-callee relationships
* **maintainability** — focus optimization on application-level functions

---

## Decision Tree

Is the hot function called from many places?
↓
**YES** — Broader optimization: memoize, cache, or refactor callers to reduce calls.
**NO (single caller)** — Narrower optimization: optimize the function itself.

---

Is the hot function in a loop?
↓
**YES** — Loop optimization: reduce iterations, hoist invariants, simplify body.
**NO** — Single invocation. Optimize the function body.

---

Is the hot path in application code or vendor?
↓
**Application** — Direct optimization.
**Vendor** — Check for newer version, or reduce calls through caching.

---

## Recommended Default

**Default:** Trace from hottest exclusive-time function up the call stack. Identify the application-level caller and optimize there.
**Reason:** Optimizing the application layer is usually more effective than deep library code.

---

## Risks Of Wrong Choice

* Optimizing deep library code: effort may be lost on version update
* Not tracing callers: may optimize the wrong function

---

## Related Skills

* Callgraph Analysis Techniques
