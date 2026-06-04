# Enum Casting — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | attributes-and-casting |
| Knowledge Unit | enum-casting |

## Rules

### Rule 1: Cast to backed enums for string/int columns
Only backed enums (with string or int backing type) can be registered in `$casts`. Unit enums have no scalar backing value and cause runtime cast errors.

### Rule 2: Do not register unit enums in $casts
Unit enums without backing types cannot be serialized to database columns. Using them in `$casts` throws a `CastException` at runtime.

### Rule 3: Type-hint domain methods with enum classes
When a method accepts or returns an enum attribute, use the enum class as the type hint instead of raw string/int for compile-time safety.

### Rule 4: Compare using enum instances, not strings
Use `===` comparison with enum instances (`$post->status === PostStatus::Published`) to avoid typos and benefit from IDE autocompletion.

### Rule 5: Match database column type to enum backing value
A string-backed enum requires a VARCHAR/string database column. An int-backed enum requires an integer column. Mismatches cause silent data corruption.
