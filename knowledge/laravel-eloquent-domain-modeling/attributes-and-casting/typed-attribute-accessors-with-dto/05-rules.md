# Typed Attribute Accessors with DTOs — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | typed-attribute-accessors-with-dto |

## Rules

### Rule 1: Use typed accessors for structured data
When an attribute represents structured data with named fields (address, coordinates, contact info), use a typed accessor returning a DTO instead of a raw array or string.

### Rule 2: Make DTOs immutable with readonly properties
DTO properties must be `readonly` to enforce value semantics and prevent accidental mutation after construction.

### Rule 3: Cache DTO accessor results with shouldCache
Enable `shouldCache: true` on DTO accessor attributes since construction involves deserialization, validation, and object allocation.

### Rule 4: Mutator maps DTO back to flat columns
The set closure should accept the DTO type and return an array of column-value pairs that Eloquent can persist.

### Rule 5: Handle null stored values gracefully
If the underlying database columns are null, the accessor must handle this case — either return null, throw a descriptive exception, or return a default DTO with all empty/null values.
