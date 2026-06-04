## MorphPivot vs Pivot for Polymorphic Many-to-Many

Choosing between extending `MorphPivot` vs `Pivot` for custom pivot models in polymorphic many-to-many relationships.

---

## Decision Context

When creating a custom pivot model for a `morphToMany`/`morphedByMany` relationship, you must extend the correct base class.

---

## Decision Criteria

* whether the relationship is polymorphic (`morphToMany`/`morphedByMany`) or standard (`belongsToMany`)
* whether the pivot needs custom behavior (casts, accessors)
* whether foreign key constraints exist on polymorphic columns
* whether a morph map is registered

---

## Decision Tree

Creating a custom pivot model?

↓

Is the relationship polymorphic (uses `morphToMany`/`morphedByMany`)?

YES → The pivot model MUST extend `MorphPivot` (not `Pivot`)

    Is a morph map registered for production?

    YES → `Relation::enforceMorphMap()` — stable type aliases

    NO → Register one — prevents FQCNs in type column

    Is there a composite index on `(type, id, related_id)`?

    YES → Good — query performance

    NO → Add one — mandatory for performance

    Does the parent model deletion cascade to pivot rows?

    NO → Add `deleting` event handler — no FK constraint on polymorphic columns

NO → The relationship is standard `belongsToMany` — extend `Pivot` (or use generic)

---

## Rationale

`MorphPivot` adds type constraint handling on writes and deletes that `Pivot` does not. Using `Pivot` for a morph pivot can corrupt data because `delete()` and `save()` won't include the type in their WHERE clauses.

---

## Recommended Default

**Default:** `MorphPivot` for polymorphic many-to-many; `Pivot` for standard many-to-many
**Reason:** Wrong base class (Pivot for morph) causes write operations to miss the type constraint, risking cross-type data corruption

---

## Risks Of Wrong Choice

Using `Pivot` instead of `MorphPivot` for polymorphic pivots — `delete()` and `save()` miss type constraint; no morph map — FQCNs in database break on model rename; missing composite index — full table scans per query.

---

## Related Rules

- Always use `Relation::enforceMorphMap()` in production (from morph-pivot standardized knowledge)

---

## Related Skills

- Morph pivot model creation (relationships/06-skills.md)
- Morph map registration (relationships/06-skills.md)
- Composite index creation for polymorphic pivots (relationships/06-skills.md)
