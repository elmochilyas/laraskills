# Anti-Patterns: HasOne

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** HasOne

## Anti-Patterns

### Missing UNIQUE Constraint
Defining a `HasOne` relationship without a database `UNIQUE` constraint on the foreign key column. Eloquent does not enforce uniqueness for `HasOne` — duplicate children silently accumulate and `$parent->child` returns an arbitrary one.

**Problem:** Silent data corruption, duplicate children, unpredictable `$parent->child` results.

**Solution:** Always add `->unique()` on the child's foreign key column in the migration.

### Missing Inverse BelongsTo
Defining `HasOne` on the parent without defining the inverse `BelongsTo` on the child. The child cannot navigate back to the parent, breaking bidirectional access.

**Problem:** Broken domain navigation, missing child-to-parent access, incomplete model API.

**Solution:** Always define the inverse `BelongsTo` on the child model.

### HasOne for "Latest" Selection
Using `HasOne` when you need the "latest" or "best" record from a one-to-many set. `HasOne` returns an arbitrary first child (by primary key) when duplicates exist — not the latest.

**Problem:** Non-deterministic results, data integrity confusion, subtle bugs.

**Solution:** Use `HasOneOfMany` (`latestOfMany()` or `ofMany()`) for deterministic "latest" access from a has-many set.

### HasOne as Lazy-Load Crutch
Defining `HasOne` but never eager-loading, causing N+1 on every access in loops and serialization. Each access to `$user->profile` triggers a separate query.

**Problem:** N+1 query problem, performance degradation, database connection exhaustion.

**Solution:** Always eager-load `HasOne` relationships in loops and serialization contexts.

### Missing Cascade Delete
Deleting a parent without cascading to the child record. Since `HasOne` implies child existence depends on the parent, orphans represent corrupted data.

**Problem:** Orphaned children, database integrity violations, wasted storage.

**Solution:** Add `->cascadeOnDelete()` on the child's foreign key or handle deletion in model events.

### HasOne for Optional Metadata
Splitting a model into parent+child with `HasOne` when a single table with nullable JSON columns would suffice. Adds unnecessary query overhead and model complexity.

**Problem:** Extra database table, additional queries, unnecessary model class.

**Solution:** Consider nullable JSON columns on the parent table for truly optional, non-relational metadata.

### HasOne Without Index
Creating the child's foreign key column without an index. Both eager loading and existence checks rely on the FK — without an index, these perform full table scans.

**Problem:** Slow eager loading, slow existence queries, scalability bottlenecks.

**Solution:** Always add `->index()` on the child's foreign key column.
