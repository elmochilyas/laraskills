## MorphToMany vs BelongsToMany

Choosing between polymorphic many-to-many (MorphToMany/MorphedByMany) and standard many-to-many (BelongsToMany).

---

## Decision Context

When a shared model (e.g., Tag) can be associated with multiple different parent types (Posts, Videos, Products), you must decide between MorphToMany and BelongsToMany.

---

## Decision Criteria

* number of distinct parent types
* whether a single pivot table can serve all types
* need for foreign key constraints on the parent side
* complexity of having separate pivot tables per type

---

## Decision Tree

Need a many-to-many relationship?

↓

Does the related model (e.g., Tag) associate with only one parent type?

YES → Use `BelongsToMany` (simpler, FK constraints possible)

NO → Can the pivot table handle all parent types with the same schema?

    YES → Use `MorphToMany` + `MorphedByMany` (single pivot table)

    NO → Create separate pivot tables per parent type with `BelongsToMany`

---

## Rationale

BelongsToMany is simpler and supports foreign key constraints. When a model like Tag associates with Posts, Videos, and Products, MorphToMany allows a single `taggables` pivot table. If different parent types require different pivot columns, separate BelongsToMany pivot tables are cleaner despite the duplication.

---

## Recommended Default

**Default:** Use `MorphToMany` for genuinely multi-type associations with uniform pivot schemas
**Reason:** Single pivot table, reduced schema complexity, cleaner migration management

---

## Risks Of Wrong Choice

Unnecessary pivot table proliferation, lost referential integrity on polymorphic columns, overly complex reverse navigation.

---

## Related Rules

- MorphToMany-Use-MorphedByMany-Inverse (polymorphic-morph-to-many/05-rules.md)
- MorphToMany-Not-FK-Constraints-Awareness (polymorphic-morph-to-many/05-rules.md)

---

## Related Skills

- Configure MorphToMany with morph map and cascade cleanup (polymorphic-morph-to-many/06-skills.md)

---

## Inverse Method Selection (morphToMany vs morphedByMany)

Choosing the correct inverse method on the shared model side of a polymorphic many-to-many.

---

## Decision Context

When defining the reverse navigation on the shared model (e.g., Tag accessing Posts), you must use the correct method — confusing `morphToMany` and `morphedByMany` breaks the relationship.

---

## Decision Criteria

* which side of the relationship is being defined
* query generation difference between the two methods
* bidirectional navigation requirements

---

## Decision Tree

Defining a polymorphic many-to-many relationship?

↓

Which model are you on?

Parent model (e.g., Post has Tags) → Use `morphToMany(Tag::class, 'taggable')`

Shared model (e.g., Tag has Posts) → Use `morphedByMany(Post::class, 'taggable')`

↓

Are both sides defined with the same morph name?

YES → Bidirectional access works

NO → Fix morph name to be consistent

---

## Rationale

`morphToMany` and `morphedByMany` generate different SQL. The shared model side (`morphedByMany`) must add the type constraint to the join query to correctly filter by the specific parent type. Using `morphToMany` on both sides generates incorrect joins and returns empty or wrong results.

---

## Recommended Default

**Default:** `morphToMany` on parent models, `morphedByMany` on the shared model
**Reason:** Each method generates correct SQL for its direction; swapping them breaks the relationship

---

## Risks Of Wrong Choice

Empty relationships on the inverse side, incorrect join SQL, bidirectional navigation completely broken.

---

## Related Rules

- MorphToMany-Use-MorphedByMany-Inverse (polymorphic-morph-to-many/05-rules.md)
- MorphToMany-MorphName-Consistency (polymorphic-morph-to-many/05-rules.md)

---

## Related Skills

- Configure MorphToMany with morph map and cascade cleanup (polymorphic-morph-to-many/06-skills.md)

---

## Custom Pivot Model Base Class (MorphPivot vs Pivot)

Choosing the correct base class when creating custom pivot models for polymorphic many-to-many relationships.

---

## Decision Context

When a MorphToMany relationship uses a custom pivot model, the pivot class must extend `MorphPivot` instead of `Pivot` to correctly handle the type constraint.

---

## Decision Criteria

* whether the pivot has behavior (events, casts, methods)
* whether write operations (delete, save) on the pivot respect the type constraint
* risk of data corruption on write

---

## Decision Tree

Need a custom pivot model for a polymorphic many-to-many?

↓

Does the pivot need behavior (casts, events, custom methods)?

YES → Create custom pivot model

    Which class should it extend?

    Polymorphic many-to-many → Extend `MorphPivot`

    Standard many-to-many → Extend `Pivot`

NO → Default pivot model is sufficient (no custom class needed)

---

## Rationale

`MorphPivot` overrides `delete()` and `save()` to include the type constraint in the WHERE clause. Extending `Pivot` directly ignores the type column during these operations, potentially deleting or updating the wrong rows when multiple parent types are involved.

---

## Recommended Default

**Default:** Extend `MorphPivot` for any custom pivot in a polymorphic many-to-many
**Reason:** Type constraint is preserved during write operations; extending `Pivot` risks data corruption

---

## Risks Of Wrong Choice

Data corruption on pivot write operations, deleting pivot rows from wrong parent types, hard-to-diagnose bugs.

---

## Related Rules

- MorphToMany-CustomPivot-Extend-MorphPivot (polymorphic-morph-to-many/05-rules.md)

---

## Related Skills

- Configure MorphToMany with morph map and cascade cleanup (polymorphic-morph-to-many/06-skills.md)
