# JSON Casting — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | json-casting |

## Rules

### Rule 1: Cast JSON as array by default
Use `'array'` as the default cast type for JSON columns. It returns a PHP associative array — the most versatile and performant representation.

### Rule 2: Prefer collection for array operations
Use `'collection'` cast when the attribute requires map, filter, reduce, or other Collection API operations. Convert with `collect($model->attr)` if needed.

### Rule 3: Reassign modified JSON attributes, don't mutate in-place
Modifying the returned array in-place does NOT mark the model dirty. Always reassign: `$model->metadata = $modified;` to persist changes.

### Rule 4: Handle null JSON columns gracefully
A null JSON column should return an empty array or Collection on read, never null. This prevents null pointer errors when accessing keys.

### Rule 5: Validate JSON shape at domain boundaries
The JSON cast does not validate the shape of the data. Validate at the point of input (FormRequest, custom cast set()) or when the data is used in domain logic.
