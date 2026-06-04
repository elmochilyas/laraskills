# Anti-Patterns: Morph Pivot

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Morph Pivot

## Anti-Patterns

### Extending Pivot Instead of MorphPivot
Creating a custom morph pivot model that extends `Pivot` instead of `MorphPivot`. The `delete()` and `save()` methods on the base `Pivot` class miss the type constraint, potentially corrupting data across types.

**Problem:** Data corruption risk on write operations — delete/save may affect wrong polymorphic type rows.

**Solution:** Custom morph pivot models MUST extend `MorphPivot`, not `Pivot`.

### No Morph Map in Production
Storing fully-qualified class names (FQCNs) in the `*_type` column instead of using a morph map with short aliases. Model renames break existing rows.

**Problem:** FQCNs stored in type column break on refactoring, causing runtime errors.

**Solution:** Register `Relation::enforceMorphMap()` in production with stable type aliases.

### No Orphan Cleanup
Never removing polymorphic pivot rows when parent or shared models are deleted. Without FK constraints on polymorphic columns, orphans accumulate indefinitely.

**Problem:** Pivot rows accumulating when parent models are deleted; stale relationship data exposure.

**Solution:** Add cascade cleanup via `deleting` events on both parent and shared models.

### Wrong Morph Name Between Models
Using different morph names in `morphToMany()` on the parent and `morphedByMany()` on the shared model. The morph name must match across both sides and the pivot table columns.

**Problem:** Relationship resolution fails; incorrect join SQL; no related records returned.

**Solution:** Ensure `morphToMany()` and `morphedByMany()` use the exact same morph name string.

### Missing Composite Index
Creating the pivot table without a composite index on `(morph_type, morph_id, related_id)`. Queries filter by type first — without the composite index, every query scans the table.

**Problem:** Slow queries on every polymorphic pivot operation; full table scans.

**Solution:** Add a composite index on `(morph_type, morph_id, related_id)` in the pivot migration.

### Morph Pivot for Non-Polymorphic Data
Using a morph pivot pattern for a simple many-to-many relationship that is not polymorphic. This adds unnecessary type column overhead when `BelongsToMany` with a regular pivot suffices.

**Problem:** Unnecessary complexity, type column overhead, no FK constraint benefit.

**Solution:** Use standard `BelongsToMany` with regular pivot for non-polymorphic many-to-many.
