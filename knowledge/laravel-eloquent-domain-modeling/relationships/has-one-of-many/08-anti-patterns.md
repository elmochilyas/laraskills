# Anti-Patterns: HasOneOfMany

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** HasOneOfMany

## Anti-Patterns

### No Base HasMany for Writes
Defining only the `HasOneOfMany` relationship without a separate base `HasMany` for writes. `HasOneOfMany` is read-only — without a `HasMany`, there is no way to create new child records.

**Problem:** No way to create children through the model, forcing workarounds and breaking the relationship API.

**Solution:** Always keep a separate base `HasMany` relationship for writes alongside the `HasOneOfMany`.

### Unindexed Ordering Column
Using `HasOneOfMany` without a composite index on `(foreign_key, ordering_column)`. The correlated subquery performs a full scan per parent row.

**Problem:** Slow subqueries, degraded page load times, O(N) scan per parent row.

**Solution:** Create a composite database index on `(foreign_key, ordering_column)` for every `HasOneOfMany` relationship.

### Non-Deterministic Results
Using a single-column `ofMany()` without tiebreaker columns when the primary ordering column can have duplicate values. Different queries may return different "best" records.

**Problem:** Non-deterministic results, inconsistent application behavior, hard-to-debug bugs.

**Solution:** Use composite `ofMany()` with multiple columns as tiebreakers.

### HasOneOfMany for Truly Singular
Using `HasOneOfMany` when the relationship is genuinely one-to-one with a database unique constraint. The correlated subquery adds unnecessary complexity and overhead.

**Problem:** Unnecessary query complexity, potential for slower performance.

**Solution:** Use `HasOne` with a `UNIQUE` constraint for truly singular relationships.

### Applying to BelongsToMany
Applying `latestOfMany()` or `ofMany()` on a `BelongsToMany` or polymorphic relationship. `HasOneOfMany` is only supported on `HasMany`/`MorphMany`.

**Problem:** Runtime exceptions, broken application logic.

**Solution:** Only use `HasOneOfMany` on `HasMany` relationships.

### Generic Naming
Naming a `HasOneOfMany` relationship generically (e.g., `login`) instead of descriptively (e.g., `latestLogin`). This misleads consumers about cardinality and behavior.

**Problem:** Confusion about relationship cardinality, misuse of read-only constraints.

**Solution:** Name `HasOneOfMany` relationships descriptively: `latestLogin`, `bestScore`, `mostExpensiveProduct`.

### Undocumented Read-Only Constraint
Defining a `HasOneOfMany` relationship without documenting that it's read-only. Developers discover the limitation at runtime via exceptions.

**Problem:** Runtime exceptions, developer confusion, wasted debugging time.

**Solution:** Document the read-only constraint in the method DocBlock with the base `HasMany` name for writes.
