# Anti-Patterns: BelongsToMany

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** BelongsToMany

## Anti-Patterns

### Missing Composite Unique Constraint
Creating a pivot table without a composite primary key or unique constraint on both foreign key columns. Duplicate relationship pairs silently accumulate, corrupting the relationship and causing incorrect query results.

**Problem:** Duplicate relationship rows, incorrect query results, data integrity corruption.

**Solution:** Always add a composite primary key: `$table->primary(['role_id', 'user_id'])` or a unique constraint on both FK columns.

### Missing Inverse BelongsToMany
Defining `belongsToMany` on only one side of a many-to-many relationship. Many-to-many relationships are inherently bidirectional — missing the inverse breaks domain navigation.

**Problem:** Incomplete domain model, additional query overhead from workarounds.

**Solution:** Define `belongsToMany` on both models for bidirectional access.

### Using sync() When syncWithoutDetaching() Is Needed
Calling `sync()` for additive-only operations, which removes existing IDs not in the provided array. This unintentionally deletes existing relationships.

**Problem:** Unintentional data loss, removed relationships, hard-to-detect bugs.

**Solution:** Use `syncWithoutDetaching()` when adding new relationships should not remove existing ones.

### Sync in a Loop
Calling `sync()` or `attach()`/`detach()` for each parent individually in a loop instead of batching. This generates multiple database round trips and race conditions.

**Problem:** Multiple database round trips, race conditions, partial updates on failure.

**Solution:** Use a single `sync()` call with all IDs for atomic bulk updates.

### No Cascade on Pivot
Creating pivot table foreign keys without `ON DELETE CASCADE`. Deleting either side leaves orphaned pivot rows that pollute query results.

**Problem:** Orphaned pivot rows, data bloat, incorrect query results.

**Solution:** Chain `->cascadeOnDelete()` on both foreign keys in the pivot migration.

### Missing withPivot for Extra Columns
Accessing extra pivot columns without whitelisting them via `->withPivot()`. Without it, extra columns are not hydrated onto the pivot model — accessing them returns `null` silently.

**Problem:** Silent null returns from pivot attribute access, broken application logic, difficult debugging.

**Solution:** Always call `->withPivot('col1', 'col2')` to whitelist extra pivot columns.

### Auto-Increment ID Without Unique Constraint
Using an auto-increment ID as the primary key on a pivot table without a unique constraint on the two FK columns. This allows duplicate (user_id, role_id) pairs silently.

**Problem:** Duplicate relationship rows silently accumulate without detection.

**Solution:** Use a composite primary key on both FKs, or add a unique constraint on the FK pair.

### Unvalidated Sync Input
Passing user input directly to `sync()` or `attach()` without validating that the IDs reference real existing records. This creates phantom pivot rows.

**Problem:** Phantom pivot rows, broken queries, data integrity corruption.

**Solution:** Always validate: `'role_ids.*' => 'exists:roles,id'` before passing to sync.
