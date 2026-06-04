# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.1 Model definition conventions (table name, primary key, timestamps, connection)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Eloquent model conventions define how a PHP class maps to a database table. The convention-over-configuration approach infers table names, primary keys, timestamps, and connection from class naming. Understanding these conventions and when to override them is foundational to Eloquent usage.

---

# Core Concepts

- **Table name**: Snake case plural of class name (`User` -> `users`, `PageCategory` -> `page_categories`). Override via `protected $table = 'custom_table'`.
- **Primary key**: `id` column, integer, auto-incrementing. Override via `protected $primaryKey = 'uuid'` and `public $incrementing = false`.
- **Timestamps**: Eloquent expects `created_at` and `updated_at` columns. Disable via `public $timestamps = false`.
- **Connection**: Uses default database connection. Override via `protected $connection = 'pgsql'`.
- **Key type**: `protected $keyType = 'string'` for UUID/ULID primary keys.

---

# Mental Models

Model conventions are defaults that match 80% of use cases. Think of them as implicit configuration — they work until you need something different, then you explicitly override.

---

# Internal Mechanics

When Eloquent hydrates a model from query results, it reads the connection configuration from the model's `$connection` property (or the default). The table name is resolved from the class name if `$table` is not set. The primary key value is read from `$primaryKey` column. Timestamps are set automatically during `save()` if `$timestamps` is true.

---

# Patterns

**Always define $table explicitly in multi-tenant apps**: When models exist in different databases depending on tenant, explicit `$table` prevents ambiguity.

**Use UUID/ULID for public-facing models**: Set `$incrementing = false` and `$keyType = 'string'` for models with UUID primary keys.

**Per-model connection**: In multi-database setups, set `$connection` per model rather than relying on the default.

---

# Architectural Decisions

| Convention | Override When |
|------------|--------------|
| Snake case plural table | Legacy table names, multi-tenant prefix |
| Auto-incrementing integer PK | UUID, ULID, composite keys |
| Timestamps auto-managed | Non-entity tables (pivot, logs, aggregates) |
| Default connection | Multi-database, per-tenant databases |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Convention reduces boilerplate | Implicit behavior can surprise | New team members may not know conventions
Explicit override is clear | More verbose model definitions | Documentation for the model

---

# Common Mistakes

**Forgetting to disable incrementing for UUIDs**: `Model::create()` tries to insert with `id = 0` because Eloquent expects an auto-incrementing integer. Error or silent wrong insertion.

**Timestamps on non-entity tables**: Pivot tables, log tables, and aggregate tables don't need `created_at`/`updated_at`. Disable timestamps to avoid unnecessary columns.

---

# Ecosystem Usage

Laravel's core models follow these conventions. Spatie packages set `$table` explicitly for their internal models. Stancl/tenancy dynamically overrides `$connection` per tenant.

---

# Related Knowledge Units

2.10 Query builder methods | 2.17 Casts | 2.18 Model serialization
## Failure Modes

N+1 query problems occur when relationships are lazy-loaded in loops. Mass assignment vulnerabilities arise when fillable/guarded are misconfigured. Serialization failures happen when models with relationships are queued without proper eager loading. Memory exhaustion occurs with chunking without chunkById.

## Performance Considerations

Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subquery selects in addSelect avoid N+1 count queries. lazy() and cursor() use generators to reduce memory for large result sets.

## Production Considerations

Enable preventLazyLoading in production to catch N+1 issues early. Use Telescope or Debugbar to monitor query counts. Set strict mode to catch missing attributes. Configure query logging carefully as enableQueryLog retains queries in memory.

## Research Notes

Laravel 11 introduced new strict mode features. The once() method prevents duplicate relationship loads. Model casting to enums reduces validation code. The community trend is toward lighter models with dedicated action classes.

