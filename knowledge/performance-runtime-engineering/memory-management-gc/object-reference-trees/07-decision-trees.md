# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** Memory Management & GC
**Knowledge Unit:** Object Reference Trees
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | How to structure object references for memory efficiency | Architecture | Design |
| 2 | Shallow vs deep object hierarchies | Architecture | Design |

---

# Architecture-Level Decision Trees

---

## Decision: Structuring Object References

---

## Decision Context

Object reference trees determine how memory is shared or duplicated. Deep trees with many branches increase GC scanning cost and memory fragmentation.

---

## Decision Criteria

* **performance** — more references = more GC scanning
* **architectural** — shallow trees are easier to manage
* **maintainability** — deep hierarchies can be hard to debug

---

## Decision Tree

Does the object tree have >10 levels of nesting?
↓
**YES** — Consider flattening. Deep trees increase GC scan cost and memory churn.
**NO** — Standard depth is fine.

---

Are objects shared across the tree (same child referenced by multiple parents)?
↓
**YES** — Use explicit sharing with careful lifecycle management. Consider WeakReference for cache-like parents.
**NO** — No special handling needed.

---

Is this in a persistent runtime where references accumulate?
↓
**YES** — Ensure reference trees are cleaned up between requests. Use __destruct or explicit cleanup.
**NO (FPM)** — All references freed at request end.

---

## Recommended Default

**Default:** Keep object trees shallow (<5 levels). Share references explicitly with clear lifecycle.
**Reason:** Shallow trees reduce GC scanning cost and improve code readability.

---

## Risks Of Wrong Choice

* Deep trees: high GC scanning cost
* Unintentional shared references: mutation side effects

---

## Related Skills

* Object Reference Trees
