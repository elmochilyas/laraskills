# Primitive Casting — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | primitive-casting |

## Rules

### Rule 1: Use correct primitive type strings in $casts
Use `'integer'` (not `'int'`), `'boolean'` (not `'bool'`), `'float'` (not `'real'` unless needed), and `'decimal:N'` for precision values. Incorrect strings are silently ignored by Laravel.

### Rule 2: Use casts for type coercion, not business logic
Primitive casts only coerce types — they do not validate, transform, or apply business rules. Do not use them as a substitute for validation or domain logic.

### Rule 3: Handle nullable columns with optional cast
A nullable column should return `null` when the database value is null, not `0`, `false`, or an empty string. Test null handling explicitly.

### Rule 4: Deliberately choose array vs object for JSON
JSON columns can be cast as `array` (associative, idiomatic in Laravel) or `object` (stdClass). Choose deliberately based on how consumers access the data.

### Rule 5: Combine primitive casts with accessors
Use primitive casting for raw type safety and accessors for derived/computed attributes. Do not use accessors to replicate type coercion that a cast already handles.
