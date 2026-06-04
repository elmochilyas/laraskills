## Relationship Direction Verification

Determining which model defines BelongsTo based on foreign key location.

---

## Decision Context

When modeling any parent-child relationship, you must first identify which table holds the foreign key column. This single fact determines the entire relationship direction.

---

## Decision Criteria

* physical location of the foreign key column
* which model's table has `{related}_id` column
* Eloquent's join convention for BelongsTo vs HasOne/HasMany
* existing schema constraints

---

## Decision Tree

Need to define a relationship between two models?

↓

Which table has the foreign key column (`{other_model}_id`)?

The current model's table → Define `BelongsTo` here

The other model's table → Define `HasOne` or `HasMany` here, and `BelongsTo` there

↓

Have you defined the inverse (HasOne/HasMany) on the parent?

YES → Bidirectional access is available

NO → Add inverse relationship on parent model

---

## Rationale

The model with the foreign key column always defines `BelongsTo`. This is determined by the database schema, not by domain logic. Getting this wrong produces incorrect SQL joins. The inverse relationship on the parent (HasOne/HasMany) enables bidirectional navigation.

---

## Recommended Default

**Default:** Child model (with FK column) defines `BelongsTo`; parent defines `HasOne`/`HasMany`
**Reason:** Follows Eloquent's FK convention and join logic

---

## Risks Of Wrong Choice

Incorrect SQL joins, runtime errors, inability to access the relationship, data integrity confusion.

---

## Related Rules

- FK-BelongsTo-Direction (belongs-to/05-rules.md)

---

## Related Skills

- Configure a BelongsTo relationship with foreign key conventions (belongs-to/06-skills.md)

---

## Authorization Approach (Direct FK vs Relationship Load)

Choosing between zero-query FK comparison and loading the entire parent model for ownership checks.

---

## Decision Context

When authorizing access to a child resource, you must decide whether to check the FK directly on the model or load the relationship.

---

## Decision Criteria

* performance requirements for list pages
* whether parent attributes beyond the ID are needed
* authorization context (Gate vs policy vs middleware)
* existing eager loading in the query context

---

## Decision Tree

Need to check if a user owns a resource?

↓

Do you need any parent attributes beyond the ID for authorization?

YES → Load the relationship (perform additional checks on parent state)

NO (just need ownership check) → Use direct FK comparison

    Is the child model loaded with the parent relationship already?

    YES → Using the relationship is acceptable (no extra query)

    NO → Always use direct FK comparison

---

## Rationale

Direct FK access (`$post->user_id === $user->id`) is zero-query — it reads the raw column value from the already-loaded model. Loading the entire relationship just to compare `id` values is wasteful, especially in list views where this check runs for every row.

---

## Recommended Default

**Default:** Use direct FK comparison for ownership authorization
**Reason:** Zero-query, no unnecessary model hydration, safe and fast

---

## Risks Of Wrong Choice

N+1 queries on list pages, unnecessary database load, slower authorization checks.

---

## Related Rules

- Prefer-Direct-FK-For-Auth (belongs-to/05-rules.md)

---

## Related Skills

- Authorize access using direct foreign key checks (belongs-to/06-skills.md)

---

## Parent Timestamp Propagation

Choosing between `$touches` property and manual timestamp updates for propagating child changes.

---

## Decision Context

When a child record is updated, you may need the parent's `updated_at` timestamp to reflect the change. You must decide how to propagate this.

---

## Decision Criteria

* whether parent timestamp should reflect child activity
* number of BelongsTo relationships on the child
* write frequency of child records
* cache invalidation requirements

---

## Decision Tree

Should parent `updated_at` reflect child changes?

YES → Add `$touches = ['parent_relation']` on the child model

    Are there multiple parent relationships to touch?

    YES → `protected $touches = ['user', 'post'];` — list all

    NO → Single entry is sufficient

NO → Do not use `$touches` (avoids unnecessary write amplification)

---

## Rationale

`$touches` is efficient because it issues a single `UPDATE ... SET updated_at = NOW() WHERE id IN (...)` query per parent, regardless of how many children changed. It must be defined on the child (BelongsTo side) model, not the parent. Overuse causes write amplification on high-frequency updates.

---

## Recommended Default

**Default:** Define `$touches` when parent caches or UI depends on child activity timestamps
**Reason:** Automatic, efficient batch update with no application code overhead

---

## Risks Of Wrong Choice

Placing `$touches` on the parent model (silently fails — HasMany side ignores `$touches`), excessive write amplification on high-frequency child updates.

---

## Related Rules

- Touches-On-Child (belongs-to/05-rules.md)

---

## Related Skills

- Configure a BelongsTo relationship with foreign key conventions (belongs-to/06-skills.md)
