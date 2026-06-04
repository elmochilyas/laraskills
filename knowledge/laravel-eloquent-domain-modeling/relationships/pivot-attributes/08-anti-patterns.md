# Anti-Patterns: Pivot Attributes

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Pivot Attributes

## Anti-Patterns

### Selecting All Pivot Columns
Using `withPivot('*')` or not filtering pivot columns when only a subset is needed. Every extra pivot column selected adds to the result set size, wasting memory and bandwidth.

**Problem:** Wasted memory and bandwidth from loading unused pivot columns; potential data leakage.

**Solution:** Whitelist only the pivot columns actually needed: `->withPivot('expires_at', 'level')`.

### Missing withPivot for Needed Columns
Accessing `$role->pivot->column` without calling `->withPivot('column')` on the relationship. Extra columns are not hydrated onto the pivot model without explicit whitelisting — accessing them returns `null`.

**Problem:** Silent null returns from pivot attribute access, broken application logic, difficult debugging.

**Solution:** Always call `->withPivot('col1', 'col2')` to whitelist every extra pivot column you read.

### sync() Losing Data
Using `sync()` without accounting for existing pivot attributes. `sync()` replaces the entire pivot set — any attributes on rows not in the provided array are lost.

**Problem:** Unintentional attribute data loss on existing pivot rows.

**Solution:** Include existing pivot attributes in the sync array, or use `syncWithoutDetaching()` for additive-only operations.

### No Casting on Pivot Dates
Accessing pivot timestamp attributes and expecting `Carbon` instances from the generic `Pivot` model. The default `Pivot` class does not cast attributes — dates are raw strings.

**Problem:** String dates instead of Carbon instances; broken date arithmetic and formatting.

**Solution:** Use custom pivot models with `$casts` for automatic type conversion of pivot attributes.

### Missing withTimestamps
Adding timestamp columns to the pivot migration but forgetting `->withTimestamps()` on the relationship. The timestamp columns exist in the DB but are never populated.

**Problem:** Timestamp columns in the database remain `NULL` forever; lost temporal data.

**Solution:** Call `->withTimestamps()` on the relationship if the pivot migration has timestamp columns.

### Nested Sync With Different Attributes
Calling `sync()` with different attributes per ID in a context where `syncWithPivotValues()` would suffice. When the same attribute values apply to all IDs, per-ID arrays add unnecessary verbosity.

**Problem:** Unnecessary verbosity and repetition when the same pivot attributes apply to all IDs.

**Solution:** Use `syncWithPivotValues($ids, $attributes)` (Laravel 10+) for setting the same attributes across multiple IDs.
