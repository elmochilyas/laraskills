# Anti-Patterns: withExists / loadExists

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** with-exists

## Anti-Patterns

### withCount for Existence
Using `withCount('relation') > 0` when only a boolean existence check is needed. `withCount()` scans all matching rows to produce a count — `withExists()` short-circuits after the first match.

**Problem:** Wasteful full count when EXISTS short-circuit is faster; unnecessary database work.

**Solution:** Use `withExists()` for yes/no existence checks — it's inherently more efficient.

### Redundant withExists and withCount
Annotating both `withExists()` and `withCount()` on the same relationship in the same query. The existence check is redundant because `count > 0` already tells you whether records exist.

**Problem:** Redundant subquery; unnecessary database overhead.

**Solution:** Use `withExists()` for boolean checks or `withCount()` for cardinality — not both on the same relation.

### Unindexed FK with EXISTS
Using `withExists()` on a relationship without an index on the foreign key. Without an index, `EXISTS` does a full table scan per parent row, negating the short-circuit benefit.

**Problem:** Full table scan per parent row; slow existence checks.

**Solution:** Index the foreign key column for optimal `EXISTS` short-circuit performance.

### Missing Constraint for Soft Deletes
Using `withExists()` on a soft-deletable relationship without excluding trashed records. Trashed records are included in the existence check unintentionally.

**Problem:** False positives — trashed records count as "existing."

**Solution:** Add `->whereNull('deleted_at')` in the constraint callback for soft-deleted relations.

### Expecting Integer Instead of Boolean
Treating the `{relation}_exists` attribute as an integer. `withExists()` returns a boolean — checking `> 0` or other numeric operations may produce unexpected results.

**Problem:** Type errors; unexpected comparisons between boolean and integer.

**Solution:** Cast the existence attribute to boolean or use direct boolean checks.

### withExists for Parent Filtering
Using `withExists()` when the query needs to filter parents by existence (not just annotate). `withExists()` annotates results — `whereHas()` filters the parent query itself.

**Problem:** All parents returned regardless of existence; filtering needs a separate query.

**Solution:** Use `whereHas()` for filtering parents by existence; use `withExists()` only for annotation.
