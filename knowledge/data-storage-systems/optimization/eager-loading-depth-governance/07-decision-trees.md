# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Query Optimization & Profiling
**Knowledge Unit:** 4-14 Eager Loading Depth Governance
**Generated:** 2026-06-03

---

# Decision Inventory

* Eager loading depth limits
* Nested eager loading strategy
* Default vs explicit eager loading

---

# Architecture-Level Decision Trees

---

## Eager Loading Depth Strategy

---

## Decision Context

Setting governance rules for how many levels of eager loading are allowed, preventing excessive JOIN chains.

---

## Decision Criteria

* performance: deep eager loading creates large JOINs with many tables
* architectural: >3 levels of eager loading suggests design issue
* maintainability: explicit loading is clearer than nested
* security: no impact

---

## Decision Tree

Eager loading nested relationships?
↓
How many levels deep?
→ 1-2 levels: Standard — use with('relation.subrelation')
→ 3 levels: CAUTION — may create large JOINs
→ 4+ levels: FLAG — review data access pattern
    → Consider lazy loading after serialization
    → Consider denormalization
    → Consider read model / CQRS
↓
Best Practice:
→ Load what the response needs, not what you might need
→ Use load() for conditional eager loading
→ Use loadMissing() to avoid re-loading already-loaded relationships

---

## Recommended Default

**Default:** Limit eager loading to 3 levels max
**Reason:** Beyond 3 levels, JOIN chains become complex, queries slow, and it suggests a design issue.
