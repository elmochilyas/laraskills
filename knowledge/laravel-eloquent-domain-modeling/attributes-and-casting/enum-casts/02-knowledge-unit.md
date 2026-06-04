# Enum Casts

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Last Updated:** 2026-06-02

## Executive Summary
Enum casts map database values (strings or integers) to PHP 8.1 native enums in Eloquent models, providing type-safe attribute access with built-in validation. Laravel supports both `backed` enums (string or int backed) and `unit` enums (non-backed). For backed enums, the cast automatically converts between the database scalar value and the PHP enum instance. For unit enums, the database stores a serialized enum index or name. Enum casts eliminate manual string comparison and switch statements, replacing them with typed enum comparisons and pattern matching.

## Core Concepts
- **Backed enum cast:** `protected $casts = ['status' => StatusEnum::class];` — the enum must implement `\BackedEnum` (string or int backed). The database stores the `value` (backing scalar). Eloquent returns the enum instance.
- **Unit enum cast (Laravel 11+):** Same syntax `StatusEnum::class` for unit enums (non-backed). The database stores the enum `name` (string). Eloquent returns the enum instance.
- **Enum validation at cast time:** If the database contains a value that does not match any enum case, `from()` throws a `\ValueError`. Laravel's cast catches this and returns `null` in production to avoid fatal errors.
- **Array/Collection of enums:** Use `AsEnumArrayObject` or `AsEnumCollection` casts for JSON columns containing multiple enum values.
- **Type safety in comparisons:** `$model->status === StatusEnum::Active` is a valid and type-safe comparison. No string constants needed.

## Mental Models
- **Type-Safe Constants:** Enums replace string or integer constants with a dedicated type. The cast ensures the attribute is always the correct enum type or null.
- **Finite State Machine:** An enum attribute represents a state in a finite set. Transitions between states can be validated using enum methods (e.g., `canTransitionTo()`).
- **Self-Documenting Schema:** The enum class in PHP defines all valid values. The database column stores the scalar representation. The cast bridges the two representations.

## Internal Mechanics
1. **Read path:** `Model::getAttribute()` → cast's `get()` → `$enum::from($value)` for backed enums, or `constant("$enum::$value")` for unit enums.
2. **Write path:** `Model::setAttribute()` → cast's `set()` → `$value instanceof \BackedEnum ? $value->value : $value->name` for unit enums.
3. If the value is already an enum instance, it's converted to its scalar on write. If it's a scalar, it's validated via `from()` on read.
4. Null values are handled transparently — if the DB value is null, the cast returns null (requires nullable column).
5. Invalid values in the DB trigger `\ValueError` from `from()`. Laravel catches this in `Illuminate\Database\Eloquent\Casts\Cast::get()` and returns null.
6. For `AsEnumArrayObject`/`AsEnumCollection`, the JSON array is decoded and each element is cast to the enum type via `from()`.

## Patterns
- **State Machine Enum:** Define transition methods on the enum class — `public function canTransitionTo(self $target): bool { return in_array($target, $this->transitions()); }`.
- **Enum with Labels:** Add a `label()` method to the enum for display purposes. Use in Blade via `$model->status->label()`.
- **Enum Validation Rule:** Laravel's `Rule::enum(StatusEnum::class)` validates that a request input is a valid enum case.
- **Default Enum Value:** Use a database default or model `$attributes` to set an initial enum value on new models.
- **Backed vs. Unit Decision:** Prefer `string` backed enums for database storage (readable in raw SQL). Use unit enums only when no backing value is meaningful.

## Architectural Decisions
- **Decision:** Enum cast class is specified directly in `$casts` array as `EnumClass::class`.
  - **Rationale:** Clean syntax — no separate cast type string. The cast mechanism detects whether the class is an enum via `is_enum()` check.
- **Decision:** Invalid enum values in DB return null (soft fail) rather than throwing.
  - **Rationale:** A corrupted database should not crash the entire page. Null allows graceful degradation (optional — `?? DefaultEnum::Fallback`).
- **Decision:** Array/Collection enum casts use dedicated cast classes (`AsEnumArrayObject`, `AsEnumCollection`) rather than generic `array` cast.
  - **Rationale:** Generic `array` cast returns raw values without enum conversion. Dedicated casts ensure each array element is properly cast to the enum type.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Type-safe attribute access eliminates string constants | Database stores scalar values, not enum names | Raw SQL queries lose type safety; always use Eloquent |
| Enum methods encapsulate enum-specific logic | Cannot add methods to database-level enums | Logic duplication if you need enum behavior in raw SQL |
| Validation via `Rule::enum()` is built-in | Invalid enum values in DB silently become null | Monitor for null enum attributes; they indicate data corruption |
| Backed enums provide readable scalar values backed by the DB | Changing the backing value breaks existing data | Treat backing values as immutable; add new cases, never change existing |
| Unit enums work without database schema changes | Unit enums store names in DB, making renames painful | Test DB migrations rename the enum class case carefully |

## Performance Considerations
- Enum cast resolution adds ~1µs per read for `from()` call. Negligible for typical usage.
- `AsEnumArrayObject`/`AsEnumCollection` iterate over each array element for casting. For arrays with many elements (100+), overhead is proportional to array size.
- Enum comparison (`===`) is significantly faster than string comparison (no string length or content check) — the engine compares pointers for singleton enum instances.
- Backed enum `from()` uses an internal hash map in PHP 8.1+, making it O(1) rather than O(n).

## Production Considerations
- **Never change an enum backing value.** If `StatusEnum::Active->value` changes from `'active'` to `'activated'`, existing database rows with `'active'` will fail to cast. Always add new cases instead.
- **Rename unit enum cases with a migration.** If a unit enum case is renamed from `Active` to `Activated`, update all rows in a data migration: `DB::table('orders')->where('status', 'Active')->update(['status' => 'Activated'])`.
- **Enum cases should be documented.** Each case's purpose and transition rules should be in the enum class docblock.
- **Use `tryFrom()` in custom accessors** only when you expect potentially invalid DB values. The built-in cast uses `from()` (strict).
- **Ensure the enum class is importable** in the model file. Autoloading failures cause cryptic errors.

## Common Mistakes
- **Using unit enum backed by database value that is not the name:** If the DB stores `'active'` but the unit enum case is `Active`, `constant("StatusEnum::active")` fails. Unit enums require the DB value to match the case name exactly.
- **Forgetting the database column is nullable:** If the enum cast is non-nullable but the column allows null, the cast returns null. Add a fallback: `$casts` with `StatusEnum::class` but handle null in accessors.
- **Adding a new enum case without a migration:** New cases work immediately in code, but existing DB rows without the new value are unaffected. Only code that expects the new case will execute on new writes.
- **Comparing enum with string:** `$model->status === 'active'` is always false when `status` is an enum instance. Use `$model->status === StatusEnum::Active`.
- **Using `array` cast instead of `AsEnumArrayObject`:** `array` cast produces plain arrays of raw values, not enum instances. Use the dedicated enum collection casts.
- **Assuming enum name stability for unit enums:** IDEs and refactoring tools rename enum cases but do not update database rows. Always pair case renames with data migrations.

## Failure Modes
- **ValueError from invalid backing value:** If a DB row contains `'expired'` but the enum has no matching `from()` value, `from()` throws `\ValueError`. Caught by the cast and returns null. The attribute silently becomes null.
- **Database constraint violation:** Enum casts do not enforce database-level constraints. If the schema is `VARCHAR(20)`, any string can be inserted via raw SQL. Add a `CHECK` constraint in the DB for defense in depth.
- **Unit enum serialization in queues:** Unit enums are serialized by name. If the enum class changes between queue push and processing, `unserialize()` fails. Use backed enums for queue-safe serialization.
- **Enum class autoloading failure:** If the enum class file is deleted or moved, all model reads for that attribute fail. Enum classes should be treated as stable, versioned code.

## Ecosystem Usage
- **Laravel Nova:** Nova fields for enum-cast attributes show a select dropdown populated from `StatusEnum::cases()`. The field value is stored as the backing value.
- **Laravel API Resources:** Enum-cast attributes serialize via `$model->status->value` (or `$model->status->name` for unit enums). Override `toArray()` if custom serialization is needed.
- **Laravel LiveWire:** LiveWire handles enum serialization natively. Enum instances are hydrated/dehydrated correctly in LiveWire component properties.
- **Laravel Data (Spatie):** Spatie's `laravel-data` package supports enum casting natively, mapping DTO enum properties to model enum attributes.
- **Laravel Validation:** `Rule::enum(StatusEnum::class)` ensures request input is a valid enum backing value. Use `Rule::in(StatusEnum::values())` for explicit value arrays.
- **Laravel Authorization:** Enum values can be used in `Gate` policies: `$user->role === RoleEnum::Admin`.

## Related Knowledge Units

### Prerequisites
- [Primitive Casts](../primitive-casts/02-knowledge-unit.md) — enum casts use the same `$casts` resolution mechanism.
- [PHP 8.1 Enums](../../../laravel-core-application-engineering/php-features/enum-fundamentals/02-knowledge-unit.md) — PHP enum fundamentals: backed, unit, methods, cases.

### Related Topics
- [Collection Casts](../collection-casts/02-knowledge-unit.md) — `AsEnumArrayObject` and `AsEnumCollection` for multiple enums in a JSON column.
- [State Machine Pattern](../../domain-modeling-patterns/state-machine/02-knowledge-unit.md) — using enum casts for state machine implementation.

### Advanced Follow-up Topics
- [Enum Database Migrations](../../../laravel-core-application-engineering/migrations/enum-migrations/02-knowledge-unit.md) — adding CHECK constraints and migrating enum values.
- [Enum Integration with API Resources](../../serialization/enum-serialization/02-knowledge-unit.md) — customizing how enums are serialized in JSON responses.

## Research Notes
- Enum cast detection in `Model::resolveCaster()` checks `is_enum($castType)` — any class that `is_enum()` returns true for is treated as an enum cast. No explicit registration needed.
- Backed enums use `$enum::tryFrom($value)` internally (Laravel 10+) which returns `null` on invalid values instead of throwing. This replaced the earlier `from()` approach for consistency with nullable handling.
- `AsEnumArrayObject` and `AsEnumCollection` were added in Laravel 10 alongside the general enum cast improvements, providing JSON-column enum storage.
- Laravel 11+ expanded enum cast support to unit enums (previously only backed enums were supported natively).
- Future direction: Laravel may introduce `native` enum support in database columns (PostgreSQL has native enum types; MySQL 8+ supports ENUM natively), but the backing-value approach remains the standard.
