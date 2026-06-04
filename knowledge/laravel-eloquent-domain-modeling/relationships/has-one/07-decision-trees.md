## Relationship Direction Selection

Choosing between HasOne and BelongsTo for one-to-one relationships.

---

## Decision Context

When modeling a one-to-one relationship, you must decide which model defines HasOne and which defines BelongsTo based on where the foreign key resides.

---

## Decision Criteria

* foreign key location determines direction
* child table must have UNIQUE constraint for HasOne
* bidirectional navigation requires both sides be defined
* cascading behavior varies by direction

---

## Decision Tree

Need to model a one-to-one relationship?

↓

Does the foreign key column exist on this model's table?

YES → Define `BelongsTo` here (child side)

NO → Define `HasOne` here (parent side)

    ↓

Have you defined both sides?

YES → Bidirectional access works

NO → Add the inverse relationship

---

## Rationale

The model holding the foreign key is always the child and must define `BelongsTo`. The parent model defines `HasOne`. This is non-negotiable — Eloquent's join logic depends on it. Without both sides, you cannot navigate in both directions without additional queries.

---

## Recommended Default

**Default:** Pair `HasOne` on parent with `BelongsTo` on child
**Reason:** Ensures bidirectional access and follows Eloquent's foreign key convention

---

## Risks Of Wrong Choice

Broken queries, runtime errors, inability to navigate the relationship in one direction, or silent data corruption.

---

## Related Rules

- HasOne-Inverse-BelongsTo (has-one/05-rules.md)
- HasOne-Unique-Constraint (has-one/05-rules.md)

---

## Related Skills

- Configure HasOne with unique constraint and cascade delete (has-one/06-skills.md)

---

## Child Creation Strategy

Choosing between `$parent->child()->create()` vs `Child::create()` for creating related records.

---

## Decision Context

When creating a child record in a HasOne relationship, you must decide how to set the foreign key.

---

## Decision Criteria

* foreign key auto-assignment reliability
* risk of orphaned records
* code clarity and intent
* idempotency requirements

---

## Decision Tree

Need to create a child record?

↓

Is the parent model already available in context?

YES → Use `$parent->child()->create($data)`

Do you need idempotent creation (avoid duplicates)?

YES → `$parent->child()->firstOrCreate()`

NO → `$parent->child()->create()`

NO (parent not available) → Route through parent first, or use `Child::create()` with explicit FK

---

## Rationale

Creating through the parent relationship auto-assigns the foreign key, eliminating the most common cause of orphaned records. `firstOrCreate()` adds a SELECT to check for existing records before INSERT, which is necessary in concurrent environments to prevent duplicate children.

---

## Recommended Default

**Default:** `$parent->child()->create($data)`
**Reason:** Auto-assigns FK, prevents orphans, expresses intent clearly

---

## Risks Of Wrong Choice

Orphaned child records with null foreign keys, silent duplication in concurrent requests, debugging difficulty when FK is missing.

---

## Related Rules

- HasOne-Create-Through-Parent (has-one/05-rules.md)

---

## Related Skills

- Create child records through HasOne parent relationship (has-one/06-skills.md)

---

## Cascade Delete Strategy

Choosing database-level cascade vs model event-based cleanup for HasOne child records.

---

## Decision Context

When a parent model is deleted, you must decide how to handle the associated child record.

---

## Decision Criteria

* data integrity requirements
* database-level guarantees vs application-level logic
* soft-delete compatibility
* audit/archival requirements

---

## Decision Tree

Need to handle child deletion when parent is deleted?

↓

Should children be deleted when parent is deleted?

YES → Use `cascadeOnDelete()` in migration

    Do you also need to perform side effects (logging, notifications)?

    YES → Add model event (`deleting`) alongside cascade

    NO → Cascade alone is sufficient

NO (children should survive) → Use `nullOnDelete()` for nullable FK

    Or handle in model events for soft-delete + archival patterns

---

## Rationale

Database-level cascade delete is the safest and most performant approach — the database guarantees integrity without PHP intervention. Model events are needed when cascade must trigger application-level side effects (email notifications, cache invalidation, logging). Nullable FKs with `nullOnDelete()` preserve child records when parent is soft-deleted or archived.

---

## Recommended Default

**Default:** `->constrained()->cascadeOnDelete()` in the migration
**Reason:** Database-level guarantee, zero application overhead, prevents orphaned records

---

## Risks Of Wrong Choice

Orphaned child records accumulating in the database, foreign key constraint violations on delete, silent data corruption.

---

## Related Rules

- HasOne-Cascade-Delete (has-one/05-rules.md)

---

## Related Skills

- Configure HasOne with unique constraint and cascade delete (has-one/06-skills.md)

---

## Loading Strategy (Eager vs Lazy)

Choosing between eager loading and lazy loading for HasOne relationships.

---

## Decision Context

When accessing a HasOne relationship on multiple parent models, you must decide whether to eager-load the relationship upfront or rely on lazy loading.

---

## Decision Criteria

* number of parent models being iterated
* performance impact of N+1 queries
* serialization context (API vs view)
* certainty that the relationship will be accessed

---

## Decision Tree

Need to access HasOne relationship on a set of models?

↓

Are you iterating more than 5 parent models?

YES → Use eager loading: `Parent::with('child')->get()`

Is this in an API resource or Blade view?

YES → Always use eager loading (serialization = N+1 risk)

NO → Are all parent models in a single query context?

    YES → Eager load

    NO → Consider `load()` on the collection

NO (fewer than 5) → Lazy loading is acceptable (marginal impact)

---

## Rationale

N+1 is the most common performance problem in Eloquent applications. Eager loading reduces queries from N+1 to exactly 2, regardless of parent count. The threshold of 5 is heuristic — the cost of an extra query for fewer than 5 parents is negligible.

---

## Recommended Default

**Default:** Always eager-load HasOne in loops and serialization
**Reason:** Prevents N+1, query count is fixed at 2, cost is minimal compared to risk of lazy loading

---

## Risks Of Wrong Choice

N+1 query explosion, database connection exhaustion, slow page loads, OOM under load.

---

## Related Rules

- HasOne-Eager-Load-Serialization (has-one/05-rules.md)
- HasOne-Avoid-As-Lazy-Crutch (has-one/05-rules.md)

---

## Related Skills

- Configure HasOne with unique constraint and cascade delete (has-one/06-skills.md)
