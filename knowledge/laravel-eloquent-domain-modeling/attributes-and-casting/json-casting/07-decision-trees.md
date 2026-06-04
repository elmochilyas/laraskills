# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** JSON Casting
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: JSON Cast (`array`) vs Normalized Relationship
* Decision 2: `array` Cast vs `collection` Cast vs `json` Cast
* Decision 3: Mutate In-Place vs Reassign Modified JSON Attribute

---

# Architecture-Level Decision Trees

---

## Decision 1: JSON Cast (`array`) vs Normalized Relationship

---

## Decision Context

Choose between storing structured data as a JSON column with an `array` cast or normalizing it into a related database table.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the data have a fixed, known schema?
↓
YES → Normalized Relationship (schema enforcement, queryable, indexable)
NO → Is the structure genuinely dynamic per record (metadata, settings, flexible config)?
    YES → JSON `array` Cast
    NO → Normalized Relationship

---

## Rationale

JSON columns sacrifice queryability, constraints, and schema enforcement for schema flexibility. Use them only when the data structure varies per record and individual field querying is not required. For fixed-schema data, normalized tables are always preferable.

---

## Recommended Default

**Default:** Normalized relationship. JSON `array` cast only for genuinely dynamic or denormalized data.
**Reason:** Normalized tables provide referential integrity, query performance, and schema evolution support that JSON columns cannot match.

---

## Risks Of Wrong Choice

* JSON for fixed schema: no query performance, migration complexity, no integrity constraints
* Normalized for dynamic data: schema changes for every new field, sparse columns, ORM overhead

---

## Related Skills

* Cast a JSON Column to an Array or Collection (`06-skills.md` Skill 1)

---

## Decision 2: `array` Cast vs `collection` Cast vs `json` Cast

---

## Decision Context

Choose the appropriate built-in cast type for a JSON column — `array`, `collection`, or `json`.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Do you need the Laravel Collection API (map, filter, reduce) on the returned value?
↓
YES → `collection` cast
NO → Do you need a native associative array?
    YES → `array` cast (most common, lightweight)
    NO → Do you need the raw JSON string preserved?
        YES → `json` cast (no decode/encode)
        NO → `array` cast (default)

---

## Rationale

`array` returns a native PHP associative array — the most versatile and lightweight option. `collection` wraps the array in Laravel's `Collection` for richer manipulation. `json` returns the raw JSON string without decoding.

---

## Recommended Default

**Default:** `array` cast for most JSON columns. `collection` when Collection API is needed. `json` only when raw string access is required.
**Reason:** `array` is the most performant and universally compatible. Upgrade to `collection` only when the higher-level API is needed.

---

## Risks Of Wrong Choice

* `collection` when array sufficient: unnecessary abstraction, cannot use `[]` syntax directly
* `array` when collection needed: no map/filter/reduce, manual conversion
* `json` for structured access: every read requires manual `json_decode`

---

## Related Skills

* Cast a JSON Column to an Array or Collection (`06-skills.md` Skill 1)

---

## Decision 3: Mutate In-Place vs Reassign Modified JSON Attribute

---

## Decision Context

Choose whether to modify a JSON cast attribute in-place (without reassignment) or reassign the entire array to the model.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the model track dirty state for this attribute?
↓
YES → Reassign modified value (`$model->attr = $modified;`) to mark as dirty
NO → Is the attribute an `AsArrayObject` (mutable by reference)?
    YES → In-place mutation is tracked (ArrayObject detects changes)
    NO → Is the attribute a regular `array` cast?
        YES → Reassign modified value (in-place changes don't mark dirty)
        NO → Depends on cast type

---

## Rationale

Regular `array` cast returns a new array on each read — mutations to the returned array do not affect the model's internal state. The modified array must be reassigned to the model to persist changes. `AsArrayObject` tracks mutations internally and marks the model dirty automatically.

---

## Recommended Default

**Default:** Reassign the modified array to the model attribute. Don't assume in-place mutations are tracked.
**Reason:** Regular array casts return copies. Explicit reassignment makes the mutation visible to the dirty tracking system.

---

## Risks Of Wrong Choice

* In-place mutation without reassignment: changes silently lost on save, debugging confusion
* Unnecessary reassignment of unchanged data: minor performance overhead, no functional impact

---

## Related Rules

* Reassign modified JSON attributes, don't mutate in-place (`05-rules.md`)

---

## Related Skills

* Cast a JSON Column to an Array or Collection (`06-skills.md` Skill 1)
