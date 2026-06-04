# Primitive Casts

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Last Updated:** 2026-06-02

## Executive Summary
Primitive casts in Laravel's `$casts` property coerce attribute values between database storage types and PHP types automatically. The supported primitive types — `int`, `bool`, `float`, `string`, `array`, `object`, `collection`, and `decimal:N` — handle the most common type-conversion scenarios without requiring custom accessors or mutators. Primitive casts are the simplest two-way attribute transformation mechanism: they run on both read and write, ensuring type consistency throughout the model lifecycle.

## Core Concepts
- **`int` cast:** Converts value to PHP `int` on read; truncates floats, parses numeric strings. Stored as-is in database.
- **`bool` cast:** Converts value to PHP `bool` on read; `1`, `'1'`, `'true'`, `true` become `true`; everything else becomes `false`. On write, `true` becomes `1` and `false` becomes `0` (or `'true'`/`'false'` depending on driver).
- **`float` cast:** Converts value to PHP `float` on read. Precision loss possible for very large numbers.
- **`string` cast:** Converts value to PHP `string` on read. JSON-encodes arrays/objects; type-coerces primitives.
- **`array` cast:** JSON-decodes stored string to PHP `array` on read; JSON-encodes array to string on write. Requires the stored value to be valid JSON.
- **`object` cast:** JSON-decodes stored string to PHP `stdClass` on read; JSON-encodes back to string on write.
- **`collection` cast:** JSON-decodes stored string to Laravel `Collection` on read; JSON-encodes to string on write.
- **`decimal:N` cast:** Converts value to PHP `string` with exactly `N` decimal places on read. Avoids float precision issues for monetary values. Does NOT round-trip through `float` — stays as string.

## Mental Models
- **Type Coercion Gateway:** Every attribute read/write passes through the cast system. Primitive casts are the simplest gates — they just change the type without adding business logic.
- **Serialization Boundary:** The JSON-based casts (`array`, `object`, `collection`) treat the database column as a serialized blob. The cast is the serialization/deserialization boundary between PHP and the database.
- **Precision Preservation:** `decimal:N` is the only cast that preserves exact precision by staying in string representation. All other numeric casts (`int`, `float`) may lose precision for edge-case values.

## Internal Mechanics
1. **Read path:** `Model::getAttribute($key)` → `Model::transformModelValue()` → `Castable::get()` (or inline cast logic for primitives).
2. **Write path:** `Model::setAttribute($key, $value)` → `Model::setAttributeValue()` → `Castable::set()`.
3. Primitive casts resolve via `Model::$cast` array → `Model::resolveCaster()` → `\Illuminate\Database\Eloquent\Casts\Cast` facade or the legacy `Castable` interface.
4. `int`/`bool`/`float`/`string` casts use simple PHP type-casting internally: `(int) $value`, `(bool) $value`, `(float) $value`, `(string) $value`.
5. `array`/`object`/`collection` casts use `json_decode($value, ...)` on read and `json_encode($value)` on write.
6. `decimal:N` uses `number_format($value, $decimals, '.', '')` on read to produce a string with fixed decimal places.

## Patterns
- **JSON Columns in MySQL:** Use `array` or `object` cast on a `JSON` database column for native read/write of structured data without manual serialization.
- **Monetary Precision:** Use `decimal:2` for price columns. Though stored as a string in PHP, the database column should be `DECIMAL(10,2)` for native precision.
- **Mixed-Type JSON Data:** For JSON columns that can contain arrays or objects, use `array` cast and access as an array consistently.
- **Immutable Collection:** Use `collection` cast for JSON columns that represent lists of items. The returned Collection is mutable by default — clone it if you need immutability.

## Architectural Decisions
- **Decision:** `decimal:N` returns a string, not a float.
  - **Rationale:** Float precision errors (0.1 + 0.2 = 0.30000000000000004) make floats unsuitable for monetary values. A string representation preserves exact decimal places.
- **Decision:** `array` cast uses `json_decode($value, true)` for associative arrays.
  - **Rationale:** Return type is always an associative array (never stdClass), providing a consistent API. Use `object` cast if stdClass is preferred.
- **Decision:** Boolean casting maps `true → 1` and `false → 0`.
  - **Rationale:** MySQL/MariaDB store booleans as `TINYINT(1)`. The integer representation is database-compatible. PostgreSQL uses `TRUE`/`FALSE` natively, and Laravel's PDO driver handles the conversion.
- **Decision:** JSON encode/decode errors throw exceptions.
  - **Rationale:** Silent data corruption is worse than a runtime exception. If the stored JSON is malformed, `json_decode()` returns `null` and `json_last_error()` is checked.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Zero-config type coercion for common types | `array`/`object`/`collection` casts require valid JSON in DB | Corrupted JSON causes null return or exception |
| `decimal:N` preserves precision as string | String comparison vs float comparison for sorting | Sort in DB using native DECIMAL type, not PHP |
| Transparent on both read and write | Casts run for every access, even when not needed | Negligible overhead (~0.5µs per cast) |
| Standardised across all models | Limited to primitive transformations | Use custom casts or accessors for business logic |

## Performance Considerations
- Primitive casts add ~0.3-0.5µs per attribute read/write for `int`/`bool`/`float`/`string`.
- JSON casts (`array`/`object`/`collection`) add ~1-5µs due to `json_encode`/`json_decode`.
- `decimal:N` uses `number_format()` which is ~0.5µs per call.
- For models with many cast attributes, the cumulative overhead is noticeable in hot loops. Avoid accessing cast attributes in tight loops; extract to local variables.
- In Octane, cast resolution is cached per worker process. Primitive cast classes are singletons in the container.

## Production Considerations
- Always validate JSON before storing in a cast-`array` column. A `null` value in the database causes `json_decode(null)` to return `null` (not an empty array).
- `decimal:N` returns a string. Ensure API responses, comparisons, and math operations handle string numbers correctly.
- MySQL `TINYINT(1)` columns auto-cast to `bool` in some drivers. Be explicit in `$casts` to avoid ambiguity.
- When migrating from `text`/`varchar` JSON storage to a native `JSON` column type, existing `array` casts continue to work as long as the stored data is valid JSON.

## Common Mistakes
- **Using `float` for monetary values:** `float` loses precision for values like `0.1 + 0.2`. Use `decimal:2` for all monetary columns.
- **Expecting `array` cast to handle nested object serialization:** `json_decode($value, true)` creates nested arrays for objects. Use `object` cast if stdClass is preferred.
- **Modifying `$model->cast_array['key'] = 'value'` without re-saving:** The modified array is not automatically marked as dirty. Call `$model->save()` after modification.
- **Assuming `bool` cast handles `'false'` string:** The string `'false'` is truthy in PHP. Only `'0'`, `'false'`, and empty strings are cast to `false` in Laravel's bool cast.
- **Forgetting `$casts` for pivot attributes:** Pivot models inherit `$casts` from the `Pivot` base class but not from the related model. Define `$casts` on the pivot model class.

## Failure Modes
- **JSON decode failure:** If a column cast as `array` contains malformed JSON (e.g., truncated during a failed write), `json_decode` returns `null` and a `\RuntimeException` is thrown in debug mode. In production, the value is silently `null`.
- **Decimal rounding mismatch:** If `decimal:N` is used on a column with more scale than `N`, the value is truncated by `number_format()`, not rounded. Use the database's native `DECIMAL(M,D)` for rounding.
- **Float overflow:** Casting a very large integer (e.g., > 2^53) to `float` loses precision. Use `decimal:N` or a custom cast for large numbers.
- **Boolean confusion across databases:** SQLite stores booleans as integers (`0`/`1`). PostgreSQL stores them as `t`/`f`. Laravel's bool cast normalizes these, but raw queries may return unexpected values.

## Ecosystem Usage
- **Laravel Nova:** Casts are honored in Nova fields. An `array`-cast attribute displays as JSON in Nova detail/update views.
- **Laravel API Resources:** `toArray()` applies casts before serialization. Casted attributes are type-consistent in JSON responses.
- **Laravel LiveWire:** Casts are applied during LiveWire model hydration. Ensure LiveWire can serialize cast values (especially Collection).
- **Laravel Telescope:** Telescope displays casted values in its model inspector, showing the post-cast PHP types.
- **Laravel Debugbar:** Shows casted attribute values in the model panel.

## Related Knowledge Units

### Prerequisites
- [Eloquent Model Attributes](../../model-design/attribute-definition/02-knowledge-unit.md) — how `$casts` is defined and resolved.

### Related Topics
- [Accessor Patterns](../accessor-patterns/02-knowledge-unit.md) — accessors receive post-cast values; they transform casted data further.
- [Mutator Patterns](../mutator-patterns/02-knowledge-unit.md) — mutators run before casts on set.
- [Enum Casts](../enum-casts/02-knowledge-unit.md) — casting to PHP 8 enums, a specialized form of type casting.

### Advanced Follow-up Topics
- [Custom Casts](../../domain-modeling-patterns/custom-casts/02-knowledge-unit.md) — creating custom value object casters beyond the primitive set.
- [Date/Time Casts](../date-time-casts/02-knowledge-unit.md) — specialized casts for date/time types with Carbon integration.

## Research Notes
- Primitive casts are resolved via `Model::resolveCaster()` which returns an inline closure for `int`, `bool`, `float`, `string` (not a dedicated cast class) for performance.
- `array`/`object`/`collection` casts use `\Illuminate\Database\Eloquent\Casts\AsArrayObjects`, `AsCollection` classes under the hood with `jsonSerialize` contract.
- `decimal:N` is implemented as a simple `sprintf('%.'.$decimals.'f', $value)` in the cast resolver in recent versions, replacing the older `number_format` approach for consistency.
- Laravel 11+ uses PHP 8.1's `BackedEnum` support in the enum cast, but primitive casts remain unchanged since Laravel 5.x.
