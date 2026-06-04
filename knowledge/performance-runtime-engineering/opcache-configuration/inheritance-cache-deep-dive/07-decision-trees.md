# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** Inheritance Cache Deep Dive
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Inheritance cache configuration | Configuration | Tune |

---

# Architecture-Level Decision Trees

---

## Decision: Inheritance Cache Settings

---

## Decision Context

OpCache inheritance cache stores class/interface parent-child relationships. Reduces runtime resolution overhead for deep inheritance trees.

---

## Decision Criteria

* **performance** — inheritance cache reduces class resolution time
* **architectural** — deep inheritance trees benefit most
* **maintainability** — default settings work for most apps

---

## Decision Tree

Does the application have deep inheritance trees (>5 levels)?
↓
**YES** — Inheritance cache provides measurable benefit.
**NO** — Benefit is minimal.

---

Is class resolution appearing in profiling flame graphs?
↓
**YES** — Verify inheritance cache is enabled.
**NO** — Not a bottleneck.

---

Are there many interface implementations (>10 per interface)?
↓
**YES** — Inheritance cache reduces resolution overhead.
**NO** — Minimal benefit.

---

## Recommended Default

**Default:** opcache.inheritance_cache = on. Disabling rarely beneficial.
**Reason:** Minimal overhead for meaningful inheritance resolution speed.

---

## Risks Of Wrong Choice

* Disabling inheritance cache: slight increase in class resolution time
* Not applicable for most apps: benefit is marginal

---

## Related Skills

* Inheritance Cache Deep Dive
