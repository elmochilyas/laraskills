# Anti-Patterns: whereBelongsTo

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** where-belongs-to

## Anti-Patterns

### whereBelongsTo for Non-BelongsTo
Using `whereBelongsTo()` on a relationship that is not `BelongsTo`. The method only works with `BelongsTo` relationships — using it with `HasMany` or `BelongsToMany` throws a `BadMethodCallException`.

**Problem:** Runtime exception from unsupported relationship type.

**Solution:** Only use `whereBelongsTo()` on `BelongsTo` relationships. Use `whereHas()` for other relationship types.

### Unpersisted Model Filtering
Passing a model that hasn't been persisted (no `id`) to `whereBelongsTo()`. The model has `null` as its primary key, generating a `WHERE FK IS NULL` clause.

**Problem:** Unintentional `WHERE FK IS NULL` clause; incorrect query results.

**Solution:** Ensure the passed model is persisted before using it with `whereBelongsTo()`.

### Hidden Relationship Resolution
Omitting the explicit relationship name when the model has multiple `BelongsTo` relations to the same related model. Eloquent infers the wrong relationship from ambiguous context.

**Problem:** Wrong foreign key used in the WHERE clause; incorrect query results.

**Solution:** Always pass the explicit relationship name when there's ambiguity.

### Over-Abstraction
Using `whereBelongsTo($user)` when the column name is stable, well-known, and used in a single location. The abstraction adds relationship resolution overhead without meaningful benefit.

**Problem:** Unnecessary indirection; additional relationship resolution per call.

**Solution:** Use direct FK `where('user_id', $user->id)` for simple, stable, single-use foreign key filters.

### whereBelongsTo Instead of Direct FK for Auth
Using `whereBelongsTo($user)` in authorization gates instead of direct FK comparison. Authorization often needs zero-query checks, and `whereBelongsTo` adds unnecessary relationship resolution.

**Problem:** Relationship resolution overhead in authorization hot paths.

**Solution:** Use direct FK comparison (`$post->user_id === auth()->id()`) for authorization gates.

### whereBelongsTo with whereHas
Using `whereBelongsTo()` when the query needs to filter by related model attributes (not just the FK). `whereBelongsTo` only filters by foreign key — it cannot filter by attribute values.

**Problem:** Cannot filter by related model attributes; incomplete query.

**Solution:** Use `whereHas()` when filtering by related model attributes is needed.
