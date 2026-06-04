## Polymorphic vs Direct Relationship

Choosing between polymorphic (MorphOne/MorphMany) and direct (HasOne/HasMany) relationships.

---

## Decision Context

When a child model can belong to multiple parent types, you must decide whether to use polymorphic relationships or separate direct relationships with individual FK columns.

---

## Decision Criteria

* number of potential parent types
* need for database-level foreign key constraints
* whether the child always belongs to the same parent type
* financial/audit data requiring referential integrity

---

## Decision Tree

Modeling a relationship where a child belongs to a parent?

↓

Does the child always belong to the same parent type?

YES → Use `HasOne`/`HasMany` + `BelongsTo` (simpler, FK constraints possible)

NO → Can the child belong to multiple parent types?

    Does the data require foreign key constraints (financial, audit-critical)?

    YES → Use separate join tables per parent type (FK constraints required)

    NO → Use polymorphic `MorphOne`/`MorphMany`

---

## Rationale

Polymorphic relationships trade referential integrity for flexibility. Without FK constraints, data integrity depends entirely on application code. For financial or compliance-critical data, this is unacceptable. For non-critical attachments (images, comments, likes), the flexibility benefits outweigh the integrity trade-off.

---

## Recommended Default

**Default:** Use direct `HasOne`/`HasMany` when the parent type is fixed; use polymorphic for genuinely multi-type children
**Reason:** Direct relationships preserve FK constraints; polymorphic adds flexibility at the cost of integrity

---

## Risks Of Wrong Choice

Unnecessary complexity for single-type relationships, lost referential integrity for critical data, orphaned children.

---

## Related Rules

- Polymorphic-Not-For-Single-Type (polymorphic-morph-one-morph-many/05-rules.md)
- Polymorphic-Not-For-Financial-Data (polymorphic-morph-one-morph-many/05-rules.md)

---

## Related Skills

- Configure MorphOne/MorphMany with morph map and cascade cleanup (polymorphic-morph-one-morph-many/06-skills.md)

---

## Morph Map Strategy (Aliases vs FQCNs)

Choosing between registered morph map aliases and raw FQCNs in the `*_type` column.

---

## Decision Context

When storing polymorphic type information, you must decide whether to use short morph aliases or full class names in the type column.

---

## Decision Criteria

* refactoring resilience
* readability in the database
* migration complexity for existing data
* environment (development vs production)

---

## Decision Tree

Configuring polymorphic type storage?

↓

Is this a new project with no existing polymorphic data?

YES → Register morph map + enable `enforceMorphMap()` immediately

NO → Is there existing data with FQCNs in the type column?

    YES → Create morph map with aliases, write migration to update existing rows

    ↓

Is this production?

YES → Always enforce morph map with `Relation::enforceMorphMap()`

NO (development) → Test both enforcement and rollback scenarios

---

## Rationale

Without a morph map, renaming a model class (`App\Models\Post` → `App\Models\BlogPost`) breaks all existing polymorphic rows. Short aliases (`'post'`) never change regardless of class location. `enforceMorphMap()` prevents any unmapped type from being stored, providing both safety and data integrity.

---

## Recommended Default

**Default:** Register morph map + `Relation::enforceMorphMap()` in production
**Reason:** Prevents class rename breakage, ensures data consistency, provides queryable short aliases

---

## Risks Of Wrong Choice

Production outages on model rename, corrupt type column data from unvalidated input, hard-to-debug polymorphic query failures.

---

## Related Rules

- Polymorphic-Register-MorphMap (polymorphic-morph-one-morph-many/05-rules.md)
- Polymorphic-Validate-Type-Input (polymorphic-morph-one-morph-many/05-rules.md)

---

## Related Skills

- Configure MorphOne/MorphMany with morph map and cascade cleanup (polymorphic-morph-one-morph-many/06-skills.md)

---

## Cascade Cleanup Strategy for Polymorphic Children

Choosing between model event cleanup and scheduled orphan detection for polymorphic child records.

---

## Decision Context

Polymorphic relationships cannot use database cascade deletes. You must decide how to clean up child records when parent models are deleted.

---

## Decision Criteria

* reliability of model events
* whether all parent models have cleanup handlers
* total dataset size and orphan accumulation rate
* operational tolerance for scheduled cleanup

---

## Decision Tree

Need to clean up polymorphic children when parent is deleted?

↓

Do all parent models have `deleting` event handlers that delete children?

YES → Primary cleanup is covered

    Do you also need scheduled orphan detection as a safety net?

    YES → Add scheduled command to detect/delete orphaned children

    NO → Event-based cleanup alone is acceptable

NO → Add `deleting` event handlers to parent models first

    If not possible (legacy code), use scheduled orphan detection only

---

## Rationale

Model events are the primary cleanup mechanism, but they can fail (if a model is deleted via bulk operation or raw query). Scheduled orphan detection provides a safety net. For critical data, use both. For non-critical data with well-controlled code, events alone may suffice.

---

## Recommended Default

**Default:** Model event cleanup on all parent models + scheduled orphan detection
**Reason:** Events handle the normal case; scheduled detection catches edge cases and bulk operations

---

## Risks Of Wrong Choice

Orphaned children accumulating without detection, storage bloat, stale data exposure, query performance degradation.

---

## Related Rules

- Polymorphic-Cascade-Delete-Via-Events (polymorphic-morph-one-morph-many/05-rules.md)
- Polymorphic-Orphan-Detection (polymorphic-morph-one-morph-many/05-rules.md)

---

## Related Skills

- Configure MorphOne/MorphMany with morph map and cascade cleanup (polymorphic-morph-one-morph-many/06-skills.md)
