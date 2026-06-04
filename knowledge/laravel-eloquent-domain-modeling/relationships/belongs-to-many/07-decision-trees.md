## Sync Variant Selection

Choosing between `sync()`, `syncWithoutDetaching()`, `toggle()`, and `attach()`/`detach()` for pivot operations.

---

## Decision Context

When updating many-to-many pivot records, you must choose the correct method based on whether you need full replacement, additive-only updates, or toggling.

---

## Decision Criteria

* whether existing relationships should be removed
* operation semantics (replace vs add vs toggle)
* atomicity requirements
* whether different pivot attributes per ID are needed

---

## Decision Tree

Need to update pivot records?

↓

Is the input array the complete desired set (replace all)?

YES → `sync($ids)` — full replacement, removes unlisted IDs

NO → Do you want to add without removing existing ones?

    YES → `syncWithoutDetaching($ids)` — additive only

    NO → Do you want to toggle each ID (add if absent, remove if present)?

        YES → `toggle($ids)`

        NO → Are you operating on a single pivot row?

            YES → `attach($id)` or `detach($id)`

---

## Rationale

`sync()` computes the diff between current and desired state, executing minimal INSERT/DELETE operations atomically. `syncWithoutDetaching()` is for additive-only scenarios like adding tags to a post without removing existing tags. `toggle()` is for binary states (like/unlike). Using the wrong variant causes unintended data loss (using `sync()` when `syncWithoutDetaching()` was intended) or excessive queries.

---

## Recommended Default

**Default:** `sync()` for form submissions where the user selects the complete set
**Reason:** Atomic, minimal queries, single method call replaces all existing

---

## Risks Of Wrong Choice

Unintentional removal of existing relationships (using `sync()` instead of `syncWithoutDetaching()`), unintended duplicate relationships, race conditions.

---

## Related Rules

- Sync-Not-Loop-Attach (belongs-to-many/05-rules.md)
- SyncWithoutDetaching-For-Additive (belongs-to-many/05-rules.md)

---

## Related Skills

- Sync pivot records with proper validation (belongs-to-many/06-skills.md)

---

## Pivot Table Structure

Choosing between composite primary key and auto-increment ID for pivot tables.

---

## Decision Context

When creating a pivot table for a BelongsToMany relationship, you must choose between a composite primary key on both FKs and an auto-increment ID with a unique constraint.

---

## Decision Criteria

* whether the pivot table has extra attributes beyond FKs
* whether the pivot represents a domain entity
* query patterns (both-FK lookups vs single-FK lookups)
* framework convention

---

## Decision Tree

Designing a pivot table?

↓

Does the pivot need to be a full domain entity with its own identity?

YES → Use auto-increment ID + unique constraint on both FKs
    (Promote to a dedicated model if behavior is complex)

NO → Use composite primary key on both foreign keys

    Do you need extra pivot columns?

    YES → Add them alongside the composite PK, whitelist via `->withPivot()`

    NO → Composite PK alone is sufficient

---

## Rationale

Composite primary key on both FKs is the conventional Laravel approach — it naturally prevents duplicate pairs. Auto-increment ID is only needed when the pivot has its own identity (referenced by other tables) or complex behavior. Extra columns are added alongside the composite PK, not as a replacement.

---

## Recommended Default

**Default:** Composite primary key on both foreign key columns
**Reason:** Prevents duplicates by design, follows Eloquent convention, no unnecessary ID column

---

## Risks Of Wrong Choice

Duplicate pivot rows without a unique constraint, unnecessary auto-increment overhead, complex migration management.

---

## Related Rules

- Composite-Unique-Pivot (belongs-to-many/05-rules.md)
- Pivot-Column-Indexing (belongs-to-many/05-rules.md)

---

## Related Skills

- Configure a BelongsToMany relationship with pivot table migration (belongs-to-many/06-skills.md)

---

## Pivot Data Access Strategy

Choosing between `withPivot()`, custom pivot models (`using()`), and direct pivot queries for accessing pivot data.

---

## Decision Context

When a BelongsToMany relationship has extra pivot columns, you must decide how to access that data — through the relationship, through a custom pivot model, or through direct queries.

---

## Decision Criteria

* number of extra pivot columns
* whether the pivot has behavior (events, casts, methods)
* whether pivot access needs a custom name
* performance requirements

---

## Decision Tree

Need to access pivot data beyond foreign keys?

↓

Does the pivot have behavior (events, casts, custom methods)?

YES → Use custom pivot model: `->using(CustomPivot::class)`

NO → Does the pivot have extra columns to whitelist?

    YES → `->withPivot('col1', 'col2')` to whitelist

        Does the model have multiple BelongsToMany relations?

        YES → `->as('customName')` for clear naming

        NO → Default `pivot` accessor is fine

    NO → No pivot configuration needed (just FKs)

---

## Rationale

`withPivot()` is the simplest approach — it whitelists extra columns for hydration on the default pivot model. Custom pivot models (`using()`) are needed when the pivot itself has behavior, events, or complex casting. `->as('customName')` prevents ambiguity when a model has multiple BelongsToMany relationships.

---

## Recommended Default

**Default:** `->withPivot('col1', 'col2')` for simple column access
**Reason:** Simple, no additional classes needed, framework-native approach

---

## Risks Of Wrong Choice

Silent null returns from unregistered pivot columns, ambiguous `pivot` property naming, missing behavior when pivot is treated as a plain relationship.

---

## Related Rules

- Pivot-WithPivot-Whitelist (belongs-to-many/05-rules.md)
- Pivot-As-Custom-Name (belongs-to-many/05-rules.md)

---

## Related Skills

- Configure a BelongsToMany relationship with pivot table migration (belongs-to-many/06-skills.md)
- Read and display many-to-many relationships with pivot data (belongs-to-many/06-skills.md)
