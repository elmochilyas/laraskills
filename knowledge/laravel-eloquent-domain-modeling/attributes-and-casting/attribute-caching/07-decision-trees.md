# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Attribute Caching
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Enable `shouldCache` vs Leave Uncached
* Decision 2: Cached Accessor vs Regular Method (for non-deterministic values)
* Decision 3: Legacy Accessor vs Migrate to `Attribute::make()` with Caching

---

# Architecture-Level Decision Trees

---

## Decision 1: Enable `shouldCache` vs Leave Uncached

---

## Decision Context

Choose whether to enable per-instance caching on an accessor via the `shouldCache` parameter of `Attribute::make()`.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the accessor's computation expensive (string formatting, relationship counting, JSON decoding)?
↓
YES → Is the accessor accessed multiple times per request (Blade views, serialization)?
    YES → Enable `shouldCache: true`
    NO → Profile first — caching adds overhead if rarely accessed
NO → Is the accessor trivial (simple typecast, null coalesce)?
    YES → Leave uncached — caching adds more overhead than the computation itself
    NO → Profile first, cache only if measurable benefit

---

## Rationale

`shouldCache` eliminates redundant computation for frequently-accessed expensive accessors but adds cache-lookup overhead and memory pressure. For trivial accessors, the caching overhead exceeds the computation cost. Profile before optimizing.

---

## Recommended Default

**Default:** Leave uncached for trivial accessors. Cache only when profiling confirms the accessor is a bottleneck and is accessed multiple times per request.
**Reason:** Premature caching adds complexity without measurable benefit. Cache invalidation and memory pressure are real costs.

---

## Risks Of Wrong Choice

* Caching trivial accessors: memory waste, cache-lookup overhead > computation cost, harder to reason about
* Not caching expensive accessors: redundant CPU, N+1 query patterns within a single request, slower response times

---

## Related Rules

* Use `shouldCache` for expensive or frequently-accessed accessors (`05-rules.md`)
* Profile before adding `shouldCache` (`05-rules.md`)

---

## Related Skills

* Add `shouldCache` to an Accessor (`06-skills.md` Skill 1)

---

## Decision 2: Cached Accessor vs Regular Method

---

## Decision Context

Choose between an attribute accessor with `shouldCache` and a regular PHP method for values that should not be cached.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the value deterministic (same result for same model state)?
↓
YES → Use `Attribute::make(get: ..., shouldCache: true)`
NO → Does the value depend on mutable model state that changes between reads?
    YES → Regular method — cache would return stale values
    NO → Is the value non-deterministic (random, current timestamp)?
        YES → Regular method — accessing as `$model->method()` signals non-cached behavior
        NO → Attribute with `shouldCache` (value is deterministic and stable)

---

## Rationale

Attribute accessors with `shouldCache` are appropriate for values that are deterministic and don't depend on mutable state. Regular methods are the right choice for non-deterministic values (random, time-based) or values depending on relationships that may be lazy-loaded.

---

## Recommended Default

**Default:** `Attribute::make(get: ..., shouldCache: true)` for deterministic computed values. Regular method for non-deterministic or state-dependent values.
**Reason:** The attribute syntax (`$model->attribute`) signals a cached, computed property. A method call (`$model->getRandomDiscount()`) signals computation happens on every call.

---

## Risks Of Wrong Choice

* Caching non-deterministic values: same "random" value returned every access, subtle bugs
* Using method instead of accessor: loses Blade-friendly `$model->attribute` syntax, inconsistent pattern with other computed properties

---

## Related Rules

* Do not use `shouldCache` for non-deterministic accessors (`05-rules.md`)
* Do not cache accessors dependent on mutable state (`05-rules.md`)

---

## Related Skills

* Add `shouldCache` to an Accessor (`06-skills.md` Skill 1)

---

## Decision 3: Legacy Accessor vs Migrate to `Attribute::make()` with Caching

---

## Decision Context

Choose whether to keep a legacy `get{Attribute}Attribute()` method or migrate it to the modern `Attribute::make()` syntax to enable caching.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the legacy accessor perform expensive computation accessed multiple times?
↓
YES → Does the value depend on mutable state or non-deterministic sources?
    YES → Keep legacy (cannot cache regardless of syntax)
    NO → Migrate to `Attribute::make(get: ..., shouldCache: true)` — enables caching
NO → Is the team actively refactoring legacy code?
    YES → Migrate during refactoring for consistency
    NO → Defer migration — schedule as technical debt task

---

## Rationale

Legacy accessors cannot use `shouldCache`, which means expensive computations run on every attribute read. Migrating to `Attribute::make()` unlocks per-instance caching. For cheap or non-deterministic legacy accessors, migration is a consistency improvement but not a performance necessity.

---

## Recommended Default

**Default:** Migrate legacy accessors that benefit from caching. Defer migration for trivial accessors or when actively shipping features.
**Reason:** `Attribute::make()` is the modern Laravel standard and enables caching. Migration should be prioritized by performance impact.

---

## Risks Of Wrong Choice

* Keeping legacy expensive accessors: no caching possible, redundant computation, slower responses
* Migrating all legacy accessors: unnecessary churn for trivial accessors with no caching benefit

---

## Related Rules

* Migrate legacy accessors to enable caching (`05-rules.md`)

---

## Related Skills

* Add `shouldCache` to an Accessor (`06-skills.md` Skill 1)
