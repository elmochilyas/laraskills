# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Reference Counting
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Understanding zval refcount mechanism | Design | Understand |
| 2 | Debugging refcount issues | Debug | Resolve |

---

# Architecture-Level Decision Trees

---

## Decision: Debugging Unexpected Refcount Behavior

---

## Decision Context

PHP uses refcount += 1 on assignment, -= 1 on unset. Unexpected retention (refcount > 1 when expecting 1) indicates an unintentional reference.

---

## Decision Criteria

* **performance** — high refcount prevents memory from being freed
* **architectural** — understanding refcount helps debug memory issues
* **maintainability** — refcount bugs are hard to trace

---

## Decision Tree

Is a variable retaining memory unexpectedly?
↓
**YES** — Check refcount with debug_zval_refcounts() or xdebug_debug_zval().
**NO** — Normal behavior.

---

Is the variable passed to a function that stores it (array push, object property)?
↓
**YES** — Refcount increased by the container. Explicitly remove or null the container reference.
**NO** — Look for assignment by reference (&) or global scope.

---

Is the variable referenced in a closure?
↓
**YES** — Closures capture variables by reference. Use `use (&$var)` only when needed.
**NO** — Standard scoping.

---

## Recommended Default

**Default:** Use debug_zval_refcounts() when investigating unexpected memory retention.
**Reason:** Understanding refcount lets you find unintentional reference holders.

---

## Risks Of Wrong Choice

* Not investigating unexpected retention: memory leak
* Over-analyzing refcounts: premature optimization

---

## Related Skills

* Reference Counting
