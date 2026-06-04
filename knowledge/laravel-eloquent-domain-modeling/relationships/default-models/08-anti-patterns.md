# Anti-Patterns: Default Models

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** default-models

## Anti-Patterns

### withDefault as Data-Loss Cover-Up
Using `withDefault()` on a relationship where missing related records indicate data loss or application errors. The default silently hides the problem instead of surfacing it.

**Problem:** Masking missing data that should be investigated, hiding data integrity issues.

**Solution:** Only use `withDefault()` when null is a valid domain state, not as a band-aid for data problems.

### Heavy Callable Defaults
Performing expensive database queries or API calls inside the `withDefault()` callable. The callable runs every time the relationship is accessed without a real related record.

**Problem:** Slow relationship access, unexpected database queries in hot paths.

**Solution:** Use lightweight array defaults for simple fallback values. Reserve callables for cheap operations.

### Default on Both Sides
Using `withDefault()` on both `BelongsTo` and the inverse `HasOne`/`HasMany` simultaneously. This creates circular defaults where both relationship sides return placeholder instances.

**Problem:** Confusing application state where both sides of a relationship appear to exist but neither is real.

**Solution:** Apply `withDefault()` on only one side of a relationship, typically the side accessed from the child.

### No Exists Check When Needed
Relying on `=== null` checks that never trigger because `withDefault()` always returns a model instance. Code that differentiates between null and present breaks silently.

**Problem:** Logic that depends on null detection silently never executes the null path.

**Solution:** Use `$model->exists` to distinguish default models from real ones when needed.

### Applying to HasMany or BelongsToMany
Using `withDefault()` on a `HasMany` or `BelongsToMany` relationship. It only works on singular relationships (`BelongsTo`, `HasOne`, `MorphOne`).

**Problem:** Silent failure — the method has no effect on collection relationships.

**Solution:** Only apply `withDefault()` to singular relationship types.

### Default Model Save Surprise
Expecting `save()` on a default model to auto-associate the foreign key. Saving a default model creates a new record but does not update the foreign key on the parent.

**Problem:** Orphaned model creation without relationship linking.

**Solution:** After saving a default-model-returned instance, manually set the FK on the parent and save.
