# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.21 upsert operation (upsert, upsert with unique keys)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

`upsert` inserts rows that don't exist and updates rows that do, in a single atomic operation. It uses unique indexes or primary keys to determine whether a row exists. Essential for idempotent imports, sync operations, and batch data ingestion.

---

# Core Concepts

- **upsert(array_values, unique_columns, update_columns)**: Insert new rows or update existing ones.
- **Atomic**: Single database transaction. No race condition between check and insert.
- **Unique key requirement**: The unique columns must have a unique index or primary key for conflict detection.
- **Batch upsert**: Multiple rows in one operation. `upsert([['email' => 'a@b.com', 'name' => 'A'], [...]], 'email', 'name')`.

---

# Mental Models

Upsert is "INSERT ... ON DUPLICATE KEY UPDATE" (MySQL) or "INSERT ... ON CONFLICT DO UPDATE" (PostgreSQL). It's the database's atomic "create or update" operation.

---

# Patterns

**Idempotent imports**: Upsert ensures that running an import job multiple times produces the same result (no duplicate rows, latest data wins).

**Sync from external API**: Upsert third-party data by their external ID as the unique key.

**Bulk update-or-create**: Instead of `firstOrCreate` in a loop (N+1 queries), use `upsert` in a single query.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Atomic, no race condition | Requires unique index | Insert fails if unique index is missing
Single query for batch operations | Limited to column values (no expressions) | Cannot do computed updates

---

# Common Mistakes

**Missing unique index**: upsert silently falls back to INSERT on PostgreSQL (no error, no update). On MySQL, it requires a unique/primary key.

**Not including all unique columns**: upsert identifies conflicts by ALL specified unique columns. Missing a column may cause unexpected insert or update.

**Model events not fired**: upsert does NOT fire model events (`saving`, `saved`, `creating`, `created`, `updating`, `updated`). Use `DB::table` upsert for event-less operations.

---

# Related Knowledge Units

2.22 insertOrIgnore | 2.26 updateOrCreate, firstOrCreate
## Ecosystem Usage

Laravel's Eloquent ORM is the dominant PHP ORM in the ecosystem. Community patterns are shared through Laracasts, Laravel News, and open-source packages. Features like eager loading and model events are used in virtually every Laravel project.

## Failure Modes

N+1 query problems occur when relationships are lazy-loaded in loops. Mass assignment vulnerabilities arise when fillable/guarded are misconfigured. Serialization failures happen when models with relationships are queued without proper eager loading. Memory exhaustion occurs with chunking without chunkById.

## Performance Considerations

Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subquery selects in addSelect avoid N+1 count queries. lazy() and cursor() use generators to reduce memory for large result sets.

## Production Considerations

Enable preventLazyLoading in production to catch N+1 issues early. Use Telescope or Debugbar to monitor query counts. Set strict mode to catch missing attributes. Configure query logging carefully as enableQueryLog retains queries in memory.

## Research Notes

Laravel 11 introduced new strict mode features. The once() method prevents duplicate relationship loads. Model casting to enums reduces validation code. The community trend is toward lighter models with dedicated action classes.

## Internal Mechanics

Eloquent models extend Illuminate\Database\Eloquent\Model. The query builder compiles Eloquent expressions into SQL. Relationships are resolved through lazy loading or eager loading. Model hydration converts database rows into PHP objects with type casting.

## Architectural Decisions

Decision: Eloquent ORM vs Query Builder vs Raw SQL. Use Eloquent for standard CRUD. Use Query Builder for complex queries. Use Raw SQL for database-specific optimizations.

