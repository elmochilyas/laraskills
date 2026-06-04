# Date/Time Casts

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Last Updated:** 2026-06-02

## Executive Summary
Date/time casts transform database date/time values into `Carbon` (or `CarbonImmutable`) objects in PHP, providing a rich API for date manipulation, formatting, and timezone handling. Laravel supports `date`, `datetime`, `immutable_date`, `immutable_datetime`, and `timestamp` casts. The `serializeDate()` method on models controls how dates are formatted when the model is serialized to JSON or arrays. This cast family is essential for consistent timezone handling, date arithmetic, and serialization control across the application.

## Core Concepts
- **`date` cast:** Converts stored date string to `Carbon` instance. Only preserves date portion (no time).
- **`datetime` cast:** Converts stored datetime string to `Carbon` instance. Preserves date and time.
- **`immutable_date` / `immutable_datetime`:** Same as above but returns `CarbonImmutable` instances, preventing mutation of the model's internal date objects.
- **`timestamp` cast:** Converts Unix timestamp (integer) to `Carbon` instance on read; converts `Carbon` back to integer on write.
- **`serializeDate(CarbonInterface $date)`:** Override on the model to control date format in JSON/array serialization. Returns a string.
- **`$dateFormat` property:** Specifies the storage format for date columns in the database (e.g., `'Y-m-d H:i:s'`, `'U'` for Unix timestamps).
- **`$timestamps`:** Enables/disables automatic `created_at`/`updated_at` management. These columns use `datetime` cast by default.

## Mental Models
- **Immutable by Default vs. Mutable Opt-In:** `datetime` returns mutable `Carbon` objects. Any modification to the object (e.g., `->addDay()`) mutates the model's internal date without marking the attribute as dirty. Use `immutable_datetime` to prevent this.
- **Timezone Sandwich:** The database stores dates in UTC (or the configured timezone). Laravel converts to the `app.timezone` config on access. The application works in the configured timezone. Serialization converts to `'Y-m-d\TH:i:sP'` (ISO 8601) by default.
- **Serialization Gateway:** `serializeDate()` is the single control point for all date serialization output. Every `toArray()` or `toJson()` call on the model passes through this method.

## Internal Mechanics
1. On read (`Model::getAttribute`), date-cast columns pass through `Model::asDateTime($value)`.
2. `asDateTime()` attempts `Carbon::createFromFormat($dateFormat, $value)` first, then falls back to `new Carbon($value, $timezone)`.
3. If the cast is `immutable_date` or `immutable_datetime`, the `CarbonImmutable` variant is used instead.
4. On write, `Model::fromDateTime($value)` converts the Carbon instance to a string matching `$dateFormat` (default `'Y-m-d H:i:s'`).
5. For `timestamp` cast, `asDateTime()` recognizes `$value` as integer and uses `Carbon::createFromTimestamp($value)`.
6. `serializeDate()` is called by `Model::serializeDate()` which is used in `Model::toArray()` for each date-cast attribute.
7. Laravel's `$dateFormat` defaults to `'Y-m-d H:i:s'` for MySQL/MariaDB/PostgreSQL and `'Y-m-d H:i:sO'` for SQLite.

## Patterns
- **API ISO 8601 Serialization:** `protected function serializeDate(\DateTimeInterface $date): string { return $date->format('Y-m-d\TH:i:s\Z'); }` — consistent UTC ISO 8601 for API responses.
- **Immutable Dates for Safety:** Use `immutable_datetime` for all date columns unless mutation is explicitly needed. Prevents accidental date shifts from method chaining.
- **Custom Date Format per Column:** Override `getDateFormat()` on a per-model basis, or use a custom cast for columns that need non-standard formats.
- **Date Scopes with Carbon:** `scopeFromDate($query, $date) { $query->where('created_at', '>=', $date); }` — use Carbon instances in query scopes for consistent timezone handling.
- **Computed Date Accessors:** `Attribute::make(get: fn ($value) => $value?->diffForHumans())` — an accessor on a date-cast attribute that returns a human-readable string.

## Architectural Decisions
- **Decision:** Dates are cast to Carbon by default for `created_at`/`updated_at`/`deleted_at`.
  - **Rationale:** Carbon is the de facto PHP date library. Automatic casting ensures all Eloquent dates are immediately usable with Carbon's API without manual casting.
- **Decision:** `serializeDate` is a model-level method, not per-attribute.
  - **Rationale:** Most applications use a single date format for all serialized dates. Per-attribute formatting would add complexity without proportional benefit.
- **Decision:** `immutable_date`/`immutable_datetime` are explicit opt-in casts.
  - **Rationale:** Backward compatibility — existing code expects mutable Carbon objects. Immutability is a safer default for new projects but would break existing applications.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Rich Carbon API for all date operations | Mutable Carbon objects cause subtle mutation bugs | Use `immutable_datetime` for all date casts |
| Automatic timezone conversion | Two timezone conversions (DB → app → serialization) | Ensure `app.timezone` and DB timezone are consistent |
| `serializeDate` centralizes format control | Single format applies to all dates in the model | Create a base model with `serializeDate` for project-wide consistency |
| Timestamp cast works with Unix integer columns | Timestamp range limited to 32-bit on older MySQL | Use `datetime` cast for modern applications |

## Performance Considerations
- Carbon instantiation adds ~2-5µs per date attribute read. Models with many date columns (e.g., 10+ timestamps) incur measurable overhead.
- Carbon objects are relatively heavy (~200 bytes each). Date-heavy models consume more memory.
- In Octane, Carbon instances persist in model attributes across requests. Immutable dates are safer to avoid cross-request state leaks.
- For read-heavy endpoints that only display dates as strings, consider using accessors that format the date string once and cache it via `shouldCache`.

## Production Considerations
- Set `app.timezone` to `'UTC'` in production and store all dates in UTC. Convert to user timezone in presentation (Blade, Vue, etc.), not in the model.
- Override `serializeDate` in a base model class to ensure all API responses use a consistent date format.
- If using `timestamp` cast, ensure the column is `INT(11)` or `BIGINT` for Unix timestamps. The 2038 problem affects 32-bit integers.
- For GDPR/right-to-erasure compliance, ensure date casts don't leak soft-deleted timestamps in serialized output.
- Test date casting with different database drivers (SQLite in CI vs. MySQL in production) — date format handling varies.

## Common Mistakes
- **Mutating a `datetime`-cast Carbon and expecting the model to detect dirtiness:** `$model->created_at->addDay()` mutates the Carbon object in-place, but `$model->isDirty('created_at')` returns `false`. Use `$model->created_at = $model->created_at->copy()->addDay()` to trigger dirty detection.
- **Assuming dates are always Carbon:** If the column value is `null`, the cast returns `null`, not a Carbon instance. Always handle nullable date columns with `?Carbon` type hints.
- **Timezone mismatch between app and DB:** If the DB stores dates in a different timezone than `app.timezone`, dates appear shifted. Store all dates in UTC in the DB.
- **Using `date` cast when `datetime` is needed:** `date` cast strips the time component. Use `datetime` if time matters (e.g., `created_at`).
- **Forgetting to call `parent::serializeDate()` in overrides:** The base `serializeDate` uses Carbon's default format. Omitting the parent call changes the format for all date columns.

## Failure Modes
- **Invalid date string in DB:** A malformed date string (e.g., `'2026-13-01'`) causes Carbon to throw `\Carbon\Exceptions\InvalidFormatException`. Validate dates before persistence.
- **Year 2038 problem with `timestamp` cast:** 32-bit systems cannot represent timestamps after 2038-01-19. Use `datetime` cast or ensure 64-bit integer columns.
- **Carbon mutation leak:** Copying a model with `$model->replicate()` shares mutable Carbon object references. The clone shares the same Carbon instance.
- **Timezone ambiguity:** Storing dates without timezone info (e.g., `'2026-06-02 11:00:00'`) treats them as `app.timezone`. If the server timezone changes, existing dates are reinterpreted.

## Ecosystem Usage
- **Laravel Nova:** Date fields in Nova use the `serializeDate` format. Nova's `DateTime` field can override the format per-field.
- **Laravel API Resources:** `toArray()` calls `serializeDate` for each date attribute. Resources can override `toArray()` to format dates differently for specific endpoints.
- **Laravel LiveWire:** LiveWire's date serialization uses `Carbon`'s JSON serialization format. Ensure dates round-trip correctly between LiveWire and the backend.
- **Laravel Horizon / Telescope:** Display dates using the application's timezone. Check that your `serializeDate` format is readable in monitoring tools.
- **Spatie / Laravel-Data:** DTOs created from models may serialize dates differently. Configure date serialization in the DTO mapping.

## Related Knowledge Units

### Prerequisites
- [Primitive Casts](../primitive-casts/02-knowledge-unit.md) — date/time casts build on the same `$casts` resolution mechanism.
- [Carbon Usage in Laravel](../../../laravel-execution-lifecycle/application-bootstrap/carbon-configuration/02-knowledge-unit.md) — how Laravel configures Carbon's locale and timezone.

### Related Topics
- [Accessor Patterns](../accessor-patterns/02-knowledge-unit.md) — accessors on date-cast columns for custom date formatting.
- [Encrypted Casts](../encrypted-casts/02-knowledge-unit.md) — encrypted date columns combine encryption with date casting.

### Advanced Follow-up Topics
- [Custom Value Object Casts](../../domain-modeling-patterns/custom-casts/02-knowledge-unit.md) — creating custom date casts with specific behavior (e.g., Jira timestamps, Unix millisecond timestamps).
- [Model Serialization](../../serialization/model-serialization/02-knowledge-unit.md) — how `toArray()` and `toJson()` handle date serialization.

## Research Notes
- `asDateTime()` in `Illuminate\Database\Eloquent\Concerns\HasAttributes` contains the core date parsing logic, handling:
  - Integer values (timestamps) via `Carbon::createFromTimestamp()`
  - String values matching `$dateFormat` via `Carbon::createFromFormat()`
  - Instances of `DateTimeInterface` (passed through directly)
  - Null values (returned as null)
- `serializeDate()` was introduced in Laravel 5.5 and remains the canonical serialization hook through Laravel 11+.
- The `$dateFormat` property defaults to `'Y-m-d H:i:s'` but can be set to `'U'` for Unix timestamp storage or custom formats.
- Laravel 11 added support for `CarbonImmutable` via explicit cast types (`immutable_date`, `immutable_datetime`), reflecting the broader PHP ecosystem shift toward immutable datetime handling.
