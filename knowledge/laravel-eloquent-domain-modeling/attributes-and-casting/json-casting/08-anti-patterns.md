# JSON Casting — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | json-casting |

## Anti-Patterns

### Mutating JSON Array In-Place Without Reassignment
- **Severity:** High
- **Problem:** Modifying the returned array (e.g., `$model->metadata['key'] = 'value'`) does not mark the attribute dirty, so the change is silently lost on save.
- **Solution:** Always reassign the entire array: `$metadata = $model->metadata; $metadata['key'] = 'value'; $model->metadata = $metadata;`

### Using JSON Columns for Fixed-Schema Data
- **Severity:** High
- **Problem:** Storing data with a fixed, known schema in a JSON column sacrifices queryability, indexing, referential integrity, and schema enforcement.
- **Solution:** Use normalized database tables with proper columns, indexes, and constraints for fixed-schema data. Reserve JSON columns for genuinely dynamic schemas.

### Casting Large JSON Blobs as Objects
- **Severity:** Medium
- **Problem:** Using `'object'` cast for large JSON blobs forces callers to use `->` property access and `(array)` casts, which is less idiomatic in Laravel.
- **Solution:** Use `'array'` cast by default. Use `'object'` only when object-style access is a hard requirement.

### Assuming Null JSON Returns null
- **Severity:** Medium
- **Problem:** Null JSON columns return empty array/Collection by default when cast as `array` or `collection`. Code that checks `is_null($model->metadata)` will fail.
- **Solution:** Check `empty()` instead of `is_null()`, or use the `json` cast if null distinction matters.
