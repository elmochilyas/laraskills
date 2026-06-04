# Anti-Patterns: Polymorphic MorphToMany

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** Polymorphic MorphToMany

## Anti-Patterns

### No Cascade Cleanup
Never removing pivot rows when parent or shared models are deleted. Without FK constraints on polymorphic columns, orphaned pivot rows accumulate and expose stale relationship data.

**Problem:** Orphaned pivot rows accumulating; stale relationship data exposure; table bloat.

**Solution:** Add `deleting` event handlers on both parent and shared models to remove associated pivot rows.

### Missing Composite Index
Creating the pivot table without a composite index on `(morph_type, morph_id, related_id)`. Queries filter by type first — without the composite index, every operation scans the table.

**Problem:** Slow queries on every polymorphic pivot operation; full table scans.

**Solution:** Add a composite index on `(morph_type, morph_id, related_id)` in the pivot migration.

### Polymorphic Pivot with Parent-Specific Columns
Using one polymorphic pivot table when different parent types need different extra columns. All parent types share the same column set, wasting space where columns are unused.

**Problem:** Wasted storage for unused columns per parent type; confusing schema.

**Solution:** Use separate pivot tables per parent type if columns differ significantly, or use a JSON column for variable metadata.

### Using FQCNs in Type Column
Storing `App\Models\Post` instead of a morph alias like `'post'` in the `*_type` column. Model renames break existing pivot rows.

**Problem:** FQCNs in type column break on refactoring; runtime errors from unmapped types.

**Solution:** Register `Relation::enforceMorphMap()` in production with stable type aliases.

### Using morphToMany Instead of morphedByMany
Calling `morphToMany()` on the shared model (e.g., `Tag`) instead of `morphedByMany()`. The two methods are distinct — `morphedByMany` is the correct inverse for `morphToMany`.

**Problem:** Incorrect relationship definition; wrong join SQL; broken reverse navigation.

**Solution:** Use `morphedByMany()` on the shared model as the inverse of `morphToMany()`.

### Extending Pivot Instead of MorphPivot
Creating a custom pivot model for a polymorphic `MorphToMany` that extends `Pivot` instead of `MorphPivot`. Write operations may corrupt data across types.

**Problem:** Data corruption risk — delete/save on the pivot misses the type constraint.

**Solution:** Custom polymorphic pivot models MUST extend `MorphPivot`, not `Pivot`.

### MorphToMany for Non-Polymorphic
Using `MorphToMany` when the relationship is many-to-many but not polymorphic (only one parent type). This adds unnecessary type column overhead.

**Problem:** Unnecessary type column overhead; no FK constraint benefit; added complexity.

**Solution:** Use standard `BelongsToMany` for non-polymorphic many-to-many relationships.
