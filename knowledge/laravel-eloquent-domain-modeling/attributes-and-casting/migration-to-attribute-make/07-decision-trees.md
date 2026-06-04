# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Migration to Attribute::make
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: One-Pass Bulk Migration vs Per-Accessor Incremental Migration
* Decision 2: Separate Get/Set Attributes vs Combined Bidirectional `Attribute::make()`
* Decision 3: Keep Legacy Methods for Backward Compatibility vs Remove Immediately

---

# Architecture-Level Decision Trees

---

## Decision 1: One-Pass Bulk Migration vs Per-Accessor Incremental Migration

---

## Decision Context

Choose between migrating all legacy accessors and mutators in a model in a single pass or migrating them one at a time.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the model have test coverage for all its attributes?
↓
YES → One-Pass Bulk Migration (faster, ensures consistency across the model)
NO → Is the model large (> 10 accessors/mutators)?
    YES → Per-Accessor Incremental Migration (lower risk per change)
    NO → One-Pass Bulk Migration (small enough to manually verify)

---

## Rationale

Bulk migration is faster and ensures all accessors use consistent syntax simultaneously. Without test coverage, incremental migration reduces risk by isolating each change. Large models benefit from incremental migration regardless of test coverage.

---

## Recommended Default

**Default:** One-pass bulk migration for tested models under 10 accessors. Incremental migration for large or untested models.
**Reason:** Test coverage provides the safety net for bulk changes. Without it, smaller incremental changes are easier to verify and roll back.

---

## Risks Of Wrong Choice

* Bulk migration without tests: hard to identify the specific accessor causing regression
* Incremental migration for small models: unnecessarily slow, more commits, no tangible benefit

---

## Related Skills

* Bulk Migrate All Legacy Accessors in a Model (`06-skills.md` Skill 1)

---

## Decision 2: Separate Get/Set Attributes vs Combined Bidirectional `Attribute::make()`

---

## Decision Context

Choose between keeping `get` and `set` as separate `Attribute::make()` calls or combining them into a single bidirectional `Attribute::make(get: ..., set: ...)`.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the attribute have both a legacy accessor AND a legacy mutator?
↓
YES → Combine into single `Attribute::make(get: fn, set: fn)` (cleaner, one method)
NO → Does the attribute only have a legacy accessor?
    YES → `Attribute::make(get: fn)` only
    NO → Does the attribute only have a legacy mutator?
        YES → `Attribute::make(set: fn)` only
        NO → No migration needed

---

## Rationale

Combining bidirectional transformations in a single `Attribute::make()` call is the cleanest modern pattern. It keeps the get and set logic co-located and signals that the attribute has both read and write transformation.

---

## Recommended Default

**Default:** Combine get and set into a single `Attribute::make()`. Separate calls only when the attribute only has one direction.
**Reason:** Co-located get/set logic is easier to understand and maintain than two separate methods.

---

## Risks Of Wrong Choice

* Keeping separate: two methods to maintain, less cohesive, harder to see the full transformation at once
* Combining incorrectly: introducing a `set` closure that changes write behavior

---

## Related Skills

* Bulk Migrate All Legacy Accessors in a Model (`06-skills.md` Skill 1)

---

## Decision 3: Keep Legacy Methods for Backward Compatibility vs Remove Immediately

---

## Decision Context

Choose whether to keep legacy accessor/mutator methods after migration for backward compatibility or remove them immediately.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Are there any external callers (packages, other codebases) calling the legacy methods directly?
↓
YES → Keep legacy methods with `@deprecated` tag during a transition period
NO → Do internal tests or code still reference the legacy method name?
    YES → Update callers first, then remove legacy methods
    NO → Remove legacy methods immediately (no callers to break)

---

## Rationale

Legacy `get{Name}Attribute()` methods are public and could be called directly. Keeping them creates duplication and makes the migration meaningless. Removing them immediately is safe when no callers reference the legacy method signature.

---

## Recommended Default

**Default:** Remove legacy methods immediately after migration. Keep with `@deprecated` only if external callers exist.
**Reason:** Retaining legacy methods creates maintenance burden and defeats the purpose of migration. Clean break is preferred.

---

## Risks Of Wrong Choice

* Keeping legacy methods: continued maintenance, confusion about which definition is active, duplication
* Removing with external callers: breaking changes for third-party packages or other systems

---

## Related Skills

* Bulk Migrate All Legacy Accessors in a Model (`06-skills.md` Skill 1)
