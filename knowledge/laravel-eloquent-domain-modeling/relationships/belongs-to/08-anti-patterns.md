# Anti-Patterns: BelongsTo

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** BelongsTo

## Anti-Patterns

### Loading Parent for FK Check
Loading the entire parent model just to compare its ID in authorization gates. Accessing `$post->user->id === $user->id` triggers a full database query to hydrate the User model when only the foreign key value is needed.

**Problem:** N+1 queries on list pages; unnecessary model hydration; slower authorization checks.

**Solution:** Use direct foreign key comparison: `$post->user_id === $user->id`. This is zero-query and reads the raw column value from the already-loaded child model.

### Missing Inverse
Defining `BelongsTo` on the child without defining the corresponding `HasMany` or `HasOne` on the parent. The relationship becomes one-directional — code cannot navigate from parent to children without additional queries.

**Problem:** Incomplete domain model; missing navigation paths; additional query overhead from workarounds.

**Solution:** Always define the inverse relationship on the parent model to enable bidirectional navigation.

### Wrong Direction
Defining `BelongsTo` on the model that does not hold the foreign key column. The foreign key location determines relationship direction — `BelongsTo` belongs on the model whose table has the FK column.

**Problem:** Broken join SQL, runtime errors, data integrity confusion.

**Solution:** Check which table has the `{related}_id` column. The model with the FK defines `BelongsTo`; the other defines `HasMany`/`HasOne`.

### Associate Without Save
Calling `associate()` or `dissociate()` on a BelongsTo relationship without calling `save()` on the child model. These methods modify the foreign key in memory only — the change is never persisted.

**Problem:** Silent data loss — the relationship change never reaches the database.

**Solution:** Always call `save()` on the child model after `associate()` or `dissociate()`.

### Unvalidated Nullable BelongsTo
Allowing a nullable foreign key without null protection when accessing the relationship. Accessing `$post->author->name` when `author_id` is null throws a fatal error.

**Problem:** Runtime crashes, 500 errors, degraded user experience.

**Solution:** Use PHP 8+ nullsafe operator (`$post->author?->name`) or `->withDefault()` on the relationship definition.

### Missing Index on FK
Creating the foreign key column without an index. The FK is used in `WHERE`, `JOIN`, and `IN` clauses during eager loading — without an index, every relationship query performs a full table scan.

**Problem:** Slow eager loading queries, degraded join performance, scalability issues.

**Solution:** Always chain `->index()` on the foreign key column in the migration.

### Touches on Wrong Model
Defining `$touches` on the parent (HasMany side) model instead of the child (BelongsTo side). The `$touches` property only works on the model holding the foreign key.

**Problem:** Unchanged parent timestamps, broken cache invalidation, stale data.

**Solution:** Define `$touches = ['parent_relation']` on the child (BelongsTo side) model, not the parent.
