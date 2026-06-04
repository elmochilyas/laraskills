# Model Configuration Properties

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Design
- **Knowledge Unit:** Model Configuration Properties
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary
Eloquent models expose a set of public properties that control table mapping, primary key behaviour, timestamp handling, date serialisation, and database connection routing. These properties represent the explicit configuration layer layered on top of Laravel's naming conventions. Misconfiguring these properties is one of the most common sources of subtle, hard-to-debug Eloquent bugs.

---

## Core Concepts

### Table Mapping
- **`$table`** — Explicitly sets the database table name. Overrides the convention-based pluralised snake_case name.
- **`$connection`** — Specifies the database connection from `config/database.php`. Essential for multi-database applications (replicas, shards, external services).

### Primary Key Configuration
- **`$primaryKey`** — The column name used as the primary key. Defaults to `id`. Can be set to any string column (e.g., `uuid`, `slug`, `code`).
- **`$incrementing`** — Boolean; whether the primary key is auto-incrementing. Defaults to `true`. Set to `false` for UUID, ULID, or manually assigned keys.
- **`$keyType`** — The PHP type that the primary key is cast to. Defaults to `int` for auto-incrementing keys, `string` for non-incrementing.

### Timestamp Configuration
- **`$timestamps`** — Boolean; whether the model automatically manages `created_at` and `updated_at`. Defaults to `true`.
- **`CREATED_AT`** / **`UPDATED_AT`** — Constants (or `$createdAt` / `$updatedAt` properties) that rename the timestamp columns. Set to `null` to disable individual columns.
- **`$dateFormat`** — The format string used to serialise timestamp columns to the database (e.g., `U` for Unix timestamps, `Y-m-d H:i:s`). Defaults to `'Y-m-d H:i:s'`.

### Primary Key Strategies
| Strategy | `$incrementing` | `$keyType` | Typical `$primaryKey` | Use Case |
|----------|----------------|-----------|----------------------|----------|
| Auto-increment | `true` | `int` | `id` | Default CRUD, small-medium apps |
| UUID v4 | `false` | `string` | `uuid` | Distributed systems, microservices |
| ULID | `false` | `string` | `ulid` | Sortable UUIDs, event sourcing |
| UUID v7 | `false` | `string` | `uuid` | Time-ordered UUIDs (v7 is sortable) |
| Custom string | `false` | `string` | `code`, `slug` | Domain-driven keys, natural identifiers |

---

## Mental Models

### The Configuration Matrix
Think of `$connection`, `$table`, `$primaryKey`, `$incrementing`, and `$keyType` as a 5-cell configuration vector. Every model has a complete vector — either explicitly set or convention-derived. When debugging a query, mentally trace this vector to verify the model is pointing at the right table, with the right key type, on the right connection.

### Timestamps as a Couple
`CREATED_AT` and `UPDATED_AT` are a coupled pair — disabling one but not the other can work but is unusual. `$timestamps = false` disables both. To disable only one, set its constant to `null`.

---

## Internal Mechanics

### Connection Resolution
`Model::getConnectionName()` returns `$this->connection` if set, otherwise defers to `Model::resolveConnectionName()` which checks the default connection from the database config.

### Primary Key Routing
When Eloquent builds a `WHERE` clause for `find()`, `findOrFail()`, or relationship matching, it uses `$this->getKeyName()` (wraps `$primaryKey`) and `$this->getKeyType()` (wraps `$keyType`). The query builder casts the key value according to `$keyType`.

### Timestamps Auto-Setting
On `creating`, the model calls `setCreatedAt($value)` which writes to `$this->{$this->getCreatedAtColumn()}`. The column name is resolved by checking `defined('CREATED_AT')` first, then `isset($this->createdAt)`, then defaults to `'created_at'`.

---

## Patterns

### UUID / ULID Boot Method
Use a `boot` method on a custom base model or trait to auto-generate primary keys:

```php
protected static function booted()
{
    static::creating(function ($model) {
        if (empty($model->{$model->getKeyName()})) {
            $model->{$model->getKeyName()} = (string) Str::uuid();
        }
    });
}
```

For Laravel 11+, use the `HasUuids` or `HasUlids` trait:
```php
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class User extends Model
{
    use HasUuids;
    
    protected $incrementing = false;
    protected $keyType = 'string';
}
```

### Multi-Connection Routing
```php
class AnalyticsEvent extends Model
{
    protected $connection = 'analytics';
    protected $table = 'events';
}
```

---

## Architectural Decisions

### Decision: Auto-Increment vs. UUID vs. ULID
- **Auto-increment** — Simplest, smallest index, best for monoliths with a single database writer. Sequential IDs leak entity count.
- **UUID v4** — Globally unique without coordination. Index bloat on large tables. Random ordering hurts B-tree performance.
- **ULID** — Sortable, URL-safe, 26 chars. Better index locality than UUID v4. Slightly larger than auto-increment.
- **UUID v7** — Time-ordered, database-index-friendly. Newer standard (RFC 9562). Requires library support in PHP.

### Decision: Explicit `$table` vs. Convention-Only
- Explicit `$table` eliminates surprises from class renames. Recommended for all production models.
- Convention-only keeps the model file shorter. Acceptable when models rarely change name.
- See **Model Conventions** for full tradeoffs.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Auto-increment: simple, fast, small index | Leaks entity count, hard to merge databases | Use UUID for multi-source systems |
| UUID: globally unique, no coordination needed | Index bloat, random inserts hurt InnoDB | Use ULID or UUID v7 when DB performance matters |
| HasUuids trait: zero-boilerplate UUIDs | Tight coupling to Laravel's trait | Acceptable — easily replaced if needed |
| Explicit `$connection`: clear data routing | More boilerplate per model | Use custom base model to centralise |

---

## Performance Considerations

- **`$keyType = 'string'`** with UUID/ULID on InnoDB: random primary key inserts cause page splits and index fragmentation. ULID and UUID v7 mitigate this via time-ordered values. Monitor `SHOW INDEX FROM table` for fragmentation.
- **`$dateFormat = 'U'`** stores timestamps as integers (4 bytes) rather than strings (~19 bytes). Faster comparisons and smaller indexes. Cannot store fractional seconds without custom handling.
- **`$connection`** switching per-query incurs a connection resolution cost — negligible for single queries but measurable in loops. Cache the connection instance if querying the same model hundreds of times in a single request.

---

## Production Considerations

- **Never change `$incrementing` or `$keyType` on a table with existing data** — foreign key constraints and app code expecting `int` will break. Migration path: add a new UUID column, backfill, switch reads, drop old key.
- **Consistent `$dateFormat` across models on the same table** — if two models share a table (single-table inheritance), mismatched `$dateFormat` causes incorrect timestamp hydration.
- **Connection routing for read replicas** — models used primarily for reads should point to the read replica connection. Use `$connection` or dynamic `getConnectionName()` to route writes separately via the `onWriteConnection()` method.
- **ULID/UUID generation in tests** — avoid relying on `Str::uuid()` order in test assertions. Use `Str::orderedUuid()` (UUID v7-like) when test order matters.

---

## Common Mistakes

**Mistake: Setting `$incrementing = false` without setting `$keyType = 'string'`.**
Why it happens: Developers focus on disabling auto-increment but forget the key type.
Why it's harmful: `find($uuid)` casts the query parameter to `int`, producing `find(0)` which returns `null`. Queries silently fail.
Better approach: Always pair `$incrementing = false` with `$keyType = 'string'`.

**Mistake: Forgetting `$timestamps = false` on a non-timestamped table.**
Why it happens: The default `$timestamps = true` is assumed but the table has no `updated_at` column.
Why it's harmful: Every update generates a `Column not found: 1054 Unknown column 'updated_at'` SQL error.
Better approach: Add `$timestamps = false` on models backed by tables without timestamp columns, or add the columns to the schema.

**Mistake: Using `$dateFormat` that doesn't match the actual column type.**
Why it happens: Copying config from an example or assuming the format.
Why it's harmful: Carbon serialises dates in the wrong format; the database stores incorrect strings.
Better approach: Match `$dateFormat` exactly to the column type. Use `datetime` for `Y-m-d H:i:s`, `date` for `Y-m-d`, `U` for Unix timestamps.

**Mistake: Overriding `$primaryKey` without updating foreign key references.**
Why it happens: Developer changes the primary key column on the parent model but forgets to update child `belongsTo` calls or migration foreign key constraints.
Why it's harmful: Relationships resolve using the wrong column name; joins fail or join on incorrect columns.
Better approach: After changing `$primaryKey`, run a full relationship audit across all related models and adjust foreign key references.

---

## Failure Modes

1. **Wrong Connection Resolution** — Model without `$connection` defaults to `mysql` (or whatever the default is). In multi-connection apps, this causes writes to the wrong database silently. Mitigation: enforce `$connection` via a custom base model or static analysis.
2. **Key Type Mismatch** — `$keyType = 'int'` with string UUID leads to `find('abc-123')` being cast to `find(0)`, returning `null`. Mitigation: always verify `$keyType` matches `$incrementing`.
3. **Timestamp Hijack** — A third-party trait or base class overrides `CREATED_AT` / `UPDATED_AT` constants, changing timestamp behaviour on models that expected the defaults. Mitigation: avoid inheritance chains; declare timestamp constants on leaf model classes.
4. **Serialisation Cascade Failure** — `$dateFormat` mismatch causes Carbon to throw exceptions when hydrating model attributes from the database. Mitigation: run `php artisan model:show` after schema changes to verify format alignment.

---

## Ecosystem Usage

- **Laravel Jetstream** — Its `Team` model sets `$incrementing = false` and uses `HasUuids` trait for team IDs, with `$keyType = 'string'`.
- **Spatie Laravel Permission** — The `Permission` model uses auto-increment by default but documents how to switch to UUID by overriding `$incrementing` and `$keyType`.
- **Laravel Telescope** — Uses a dedicated `$connection = 'telescope'` for its monitoring models to isolate telescope data from application data.
- **Laravel Pulse** — Similar to Telescope, Pulse models use `$connection = 'pulse'` and `$table` overrides to write to a separate database.

---

## Related Knowledge Units
### Prerequisites
- **Base Model Class** — Understanding that properties are read by the base class
- **Model Conventions** — Understanding what these properties override

### Related Topics
- **Migration Schema Design** — Column types that match `$keyType` and `$dateFormat`
- **UUID / ULID Strategies** — Performance characteristics of different key strategies
- **Database Connection Configuration** — Multi-database setup in `config/database.php`

### Advanced Follow-up Topics
- **Composite Primary Keys** — Eloquent's lack of native composite key support and workarounds
- **Sharded Database Models** — Dynamic `$connection` resolution per-record

---

## Research Notes
### Source Analysis
The `Model` class defines `$table` as `protected ?string $table = null`. All other configuration properties (`$primaryKey`, `$incrementing`, `$keyType`, `$timestamps`) are defined with their default values directly on the class. The `$dateFormat` property defaults to `'Y-m-d H:i:s'` and is consumed by `freshTimestampString()` and `serializeDate()`.

### Key Insight
Laravel 11's `HasUuids` and `HasUlids` traits significantly reduce boilerplate for non-incrementing key models, but the underlying `$incrementing = false` and `$keyType = 'string'` must still be set manually. The traits only handle the generation logic, not the configuration.

### Version-Specific Notes
- Laravel 8.x: `HasUuids` and `HasUlids` traits added (originally in Laravel 9.x, backported).
- Laravel 9.x: `HasUuids` uses `Str::uuid()` by default; `HasUlids` uses `Str::ulid()`.
- Laravel 10.x: `HasUuids` can be customised via `newUniqueId()` method override.
- Laravel 11.x: No significant changes to configuration properties; `shouldBeStrict()` added as a convenience.
