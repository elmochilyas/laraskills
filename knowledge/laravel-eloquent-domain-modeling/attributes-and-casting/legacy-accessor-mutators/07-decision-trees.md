# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Legacy Accessor/Mutators
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Migrate Legacy Accessor to `Attribute::make()` vs Keep Legacy Syntax
* Decision 2: Single Migration Per Model vs Incremental Migration Across Models
* Decision 3: Add `shouldCache` During Migration vs Defer Caching Decision

---

# Architecture-Level Decision Trees

---

## Decision 1: Migrate Legacy Accessor to `Attribute::make()` vs Keep Legacy Syntax

---

## Decision Context

Choose whether to migrate a legacy `get{Name}Attribute()` accessor to the modern `Attribute::make()` syntax or keep the legacy implementation.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the accessor expensive and called multiple times per request?
↓
YES → Migrate to `Attribute::make(get: ..., shouldCache: true)` (enables caching)
NO → Is the entire model being modernized in this sprint?
    YES → Migrate (consistent pattern across the model)
    NO → Does the model have test coverage to verify the migration?
        YES → Migrate (low risk with test verification)
        NO → Defer migration (schedule as technical debt with test coverage first)

---

## Rationale

`Attribute::make()` is the modern Laravel standard and enables per-instance caching via `shouldCache`. Legacy accessors lack this capability. Migration should be prioritized by performance impact and confidence from test coverage.

---

## Recommended Default

**Default:** Migrate when the accessor would benefit from caching or when the model is being modernized. Defer for untested, trivial accessors.
**Reason:** Migration unlocks caching but carries risk without test coverage. Prioritize by performance benefit and safety.

---

## Risks Of Wrong Choice

* Keeping legacy expensive accessors: no caching, redundant computation, slower responses
* Migrating untested accessors: silent behavior changes if migration introduces errors

---

## Related Skills

* Migrate a Legacy Accessor to `Attribute::make` (`06-skills.md` Skill 1)

---

## Decision 2: Single Migration Per Model vs Incremental Migration Across Models

---

## Decision Context

Choose between migrating all accessors in one model at once or migrating one accessor at a time across models.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the model have comprehensive test coverage?
↓
YES → Migrate all accessors in the model in one pass (faster, consistent)
NO → Is the model small (< 5 accessors)?
    YES → Migrate all in one pass (manually verify each)
    NO → Migrate one accessor at a time (incremental, lower risk)

---

## Rationale

Complete model migration in one pass is faster and ensures all accessors use consistent syntax. However, without test coverage, incremental migration per accessor reduces risk by allowing verification of each change before proceeding to the next.

---

## Recommended Default

**Default:** Migrate all accessors in one model per pass when the model has test coverage. Incremental migration per accessor when test coverage is lacking.
**Reason:** Test coverage provides the safety net for bulk migration. Without it, incremental changes with manual verification are safer.

---

## Risks Of Wrong Choice

* Bulk migration without tests: hard to identify which accessor broke if tests fail
* Incremental with good tests: slower, more commits, but functionally equivalent

---

## Related Skills

* Migrate a Legacy Accessor to `Attribute::make` (`06-skills.md` Skill 1)

---

## Decision 3: Add `shouldCache` During Migration vs Defer Caching Decision

---

## Decision Context

Choose whether to add `shouldCache: true` at the time of migration to `Attribute::make()` or defer the caching decision for later optimization.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Has profiling confirmed the accessor is a performance bottleneck?
↓
YES → Add `shouldCache: true` during migration
NO → Is the accessor called multiple times per request (Blade, serialization)?
    YES → Add `shouldCache: true` (likely benefit, low risk)
    NO → Defer `shouldCache` addition (profile first)

---

## Rationale

`shouldCache` is an optimization that should be driven by profiling data. However, accessors accessed multiple times per request are likely candidates even without formal profiling. For single-use accessors, caching adds overhead without benefit.

---

## Recommended Default

**Default:** Add `shouldCache: true` during migration only when profiling or usage patterns indicate benefit. Default to no caching for single-use accessors.
**Reason:** Caching is optimization. Optimize based on data, not speculation.

---

## Risks Of Wrong Choice

* Adding `shouldCache` without need: memory waste, cache-lookup overhead, stale value risk
* Not adding `shouldCache` when needed: redundant computation, slower responses

---

## Related Skills

* Migrate a Legacy Accessor to `Attribute::make` (`06-skills.md` Skill 1)
