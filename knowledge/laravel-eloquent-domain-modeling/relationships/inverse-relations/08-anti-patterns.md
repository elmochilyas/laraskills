# Anti-Patterns: Inverse Relations

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** inverse-relations

## Anti-Patterns

### Trait on Only One Side
Adding `SupportsInverseRelations` to only the parent or only the child model, not both. This gives partial consistency — one direction is updated but the other remains stale.

**Problem:** Stale in-memory relation state, inconsistent model data within a request.

**Solution:** Add `use SupportsInverseRelations` to both sides of the relationship for full bidirectional in-memory consistency.

### No Explicit Inverse Declaration
Relying on convention-based inverse name inference when the relationship has a non-standard name. The inferred name may not match the actual relationship, causing silent failure to set the inverse.

**Problem:** Silent failure to set inverse relations, stale in-memory data, debugging confusion.

**Solution:** Use `->inverse('name')` explicitly when the convention-based guess may be wrong.

### Assuming DB Sync
Relying on inverse relations for database-level consistency or transaction guarantees. Inverse relations are purely an in-memory optimization — they do not affect persistence.

**Problem:** False sense of data consistency, incorrect assumptions about persistence.

**Solution:** Use inverse for in-memory consistency only; rely on database transactions for persistence guarantees.

### Using in Laravel Below 11
Attempting to use `SupportsInverseRelations` in Laravel 10 or below. The trait does not exist in versions below 11.

**Problem:** Fatal runtime error, broken deployment.

**Solution:** Only use `SupportsInverseRelations` in Laravel 11+ projects.

### Applying to BelongsToMany
Expecting inverse relations to work with `BelongsToMany` or polymorphic relationships. Inverse relation support is limited to `BelongsTo`, `HasOne`, and `HasMany`.

**Problem:** Runtime exception, broken relationship definition.

**Solution:** Only apply the trait to supported relationship types (`BelongsTo`, `HasOne`, `HasMany`).

### Ignoring Memory in Long-Running Processes
Using inverse relations extensively in queue workers and CLI commands without clearing references. Inverse relations hold model references in memory, preventing garbage collection.

**Problem:** Memory leaks, OOM crashes in queue workers and long-running processes.

**Solution:** Explicitly clear references with `unsetRelation()` when done, or use fresh model instances per chunk.
