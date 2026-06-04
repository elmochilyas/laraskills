# Metadata

**Domain:** Performance & Runtime Engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** Interned Strings
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | interned_strings_buffer value | Configuration | Configure |

---

# Architecture-Level Decision Trees

---

## Decision: interned_strings_buffer

---

## Decision Context

Interned strings buffer stores string literals shared across requests. Reduces memory by sharing identical strings. Buffer too small wastes optimization; too large wastes RAM.

---

## Decision Criteria

* **performance** — string interning saves memory and comparison time
* **architectural** — most strings are interned automatically
* **operations** — monitor usage to tune

---

## Decision Tree

How many unique string literals does the application use?
↓
**Small app (<100k strings)** → 8MB is sufficient.
**Medium app** → 16MB.
**Large app (>500k strings)** → 32MB.

---

What is current interned strings usage?
↓
**<80% used** — Current value is sufficient.
**>80% used** — Increase by 50%.

---

Are there many repetitive strings in the codebase?
↓
**YES (framework: class names, method names, annotations)** — Larger buffer saves more memory.
**NO** — Default size is fine.

---

## Recommended Default

**Default:** 16MB for Laravel apps. 8MB for smaller apps.
**Reason:** Most frameworks benefit from 16MB; larger rarely improves hit rate.

---

## Risks Of Wrong Choice

* Too small: strings not interned, memory waste
* Too large: no benefit, RAM waste

---

## Related Skills

* Interned Strings Buffer
