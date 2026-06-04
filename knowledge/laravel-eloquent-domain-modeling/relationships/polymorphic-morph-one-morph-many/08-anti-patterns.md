# Anti-Patterns: Polymorphic (MorphOne / MorphMany)

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** Polymorphic (MorphOne / MorphMany)

## Anti-Patterns

### Polymorphic for Everything
Using polymorphic relationships for data that always belongs to a single parent type. This sacrifices referential integrity (no FK constraints) and adds type column overhead unnecessarily.

**Problem:** Lost database-level referential integrity; unnecessary complexity for single-type relationships.

**Solution:** Use standard `HasOne`/`HasMany` when the child always belongs to one parent type.

### No Morph Map in Production
Storing FQCNs in the `*_type` column instead of using `Relation::enforceMorphMap()`. Model renames break existing rows.

**Problem:** FQCNs in type column break on refactoring; runtime errors from unmapped types.

**Solution:** Register `Relation::enforceMorphMap()` in production with stable type aliases.

### No Orphan Cleanup
Never cleaning up polymorphic children after parent deletion. Since no FK constraint enforces cascade, orphaned children accumulate indefinitely.

**Problem:** Orphaned children accumulating over time; stale data exposure; table bloat.

**Solution:** Add `deleting` event handlers on parent models to delete polymorphic children.

### Missing Composite Index
Creating the child table without a composite index on `(morph_id, morph_type)`. All polymorphic queries filter on both columns — without the composite index, queries perform full scans.

**Problem:** Slow queries on every polymorphic operation; full table scans.

**Solution:** Use `$table->morphs('imageable')` which creates both columns with a composite index.

### Accepting User Input as Morph Type
Accepting arbitrary class names from user input and passing them as the `*_type` value. This allows injection of arbitrary model types.

**Problem:** Security vulnerability — users can associate children with any model type.

**Solution:** Validate that the type value is in the morph map before allowing writes. Never accept raw class names from user input.

### Polymorphic for Critical Financial Data
Using polymorphic relationships for financial transactions or other data requiring referential integrity. Polymorphic columns cannot have foreign key constraints, so the database cannot enforce integrity.

**Problem:** No referential integrity guarantee; orphaned financial records possible without detection.

**Solution:** Use separate dedicated foreign key columns with FK constraints for critical financial data.

### Missing Inverse morphTo
Defining `morphOne()`/`morphMany()` on parent models without defining the inverse `morphTo()` on the child. The child cannot navigate back to its parent.

**Problem:** Child cannot access its parent; incomplete domain model.

**Solution:** Always define `return $this->morphTo();` on the child model as the inverse.
