# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** Preloading Script Design Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Preloading strategy: selective vs comprehensive | Implementation | Design |
| 2 | Which classes to include in preload script | Implementation | Implement |

---

# Architecture-Level Decision Trees

---

## Decision: Selective vs Comprehensive Preloading

---

## Decision Context

Preloading all framework classes vs carefully selecting only hot-path classes.

---

## Decision Criteria

* **performance** — more preloaded classes = less autoloading but more memory
* **architectural** — comprehensive preloading increases startup time
* **maintainability** — selective preloading requires profiling data

---

## Decision Tree

What is the application type?
↓
**Framework app (Laravel/Symfony)** → Selective preloading of core framework classes (highest benefit-to-memory ratio)
**Small custom app** → Minimal preloading or none; benefit doesn't justify complexity
**API microservice** → Selective preloading of framework bootstrap classes

---

Is OpCache memory consumption a concern?
↓
**YES** → Strictly selective; only preload classes that appear in every request
**NO** → Can preload more broadly; still avoid rarely-used classes

---

Has autoloading been profiled to identify the most-loaded classes?
↓
**YES** → Preload the top 100-200 most-loaded classes
**NO** → Profile first; guesswork leads to wasted memory

---

Is startup time critical (container environment with frequent restarts)?
↓
**YES** → Limit preloading to core framework only; minimize startup delay
**NO** → Broader preloading is acceptable

---

## Recommended Default

**Default:** Preload core framework classes only (top 100-200 by load count). Leave app-specific classes for lazy loading.
**Reason:** Maximizes benefit-to-memory ratio. Full preload of 800+ classes wastes memory.

---

## Risks Of Wrong Choice

* Comprehensive preload: 40-80MB wasted OpCache memory for rarely-used classes
* No preloading: 1-3ms per-request autoloading overhead for framework apps
* Preloading wrong classes: memory used with no performance benefit

---

## Related Rules

* Preload Core Framework Classes Only
* Measure Benefit Before Committing

---

## Related Skills

* Preloading Reduces Cold-Start Latency
