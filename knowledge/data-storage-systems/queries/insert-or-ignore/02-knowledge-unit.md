# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.22 insertOrIgnore
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`insertOrIgnore` inserts rows and silently ignores any rows that would cause duplicate key violations. Unlike `upsert`, it does NOT update existing rows — it simply skips them. Useful for batch inserts where some rows may already exist and should not be updated.

---

# Core Concepts

- **Silent skip**: Rows that violate unique constraints are not inserted. No error thrown, no update performed.
- **Batch operation**: Accepts an array of rows. `Model::insertOrIgnore([...])`.
- **No model events**: Like `upsert`, does not fire model lifecycle events.

---

# Patterns

**Seed idempotent data**: Insert reference data without worrying about duplicates from previous runs.

**Log deduplication**: Insert log entries by a unique hash. Skip if already recorded.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
No error handling needed | No feedback on skipped rows | Don't know which rows conflicted
Faster than checking existence per row | No update capability | Must use upsert for update-or-create

---

# Related Knowledge Units

2.21 upsert | 2.26 updateOrCreate, firstOrCreate
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

## Mental Models

Eloquent models are active record representations of database rows. Each model instance maps to one row. Relationships are query builders that can be chained and constrained.

## Common Mistakes

- **Assuming insertOrIgnore succeeds for all rows**: insertOrIgnore silently skips duplicate rows without feedback. Developers often assume all rows were inserted, leading to data inconsistency. Always verify row counts or use upsert when feedback is needed.
- **Mixing insertOrIgnore with model events**: Unlike create() or save(), insertOrIgnore does not fire Eloquent model events (retrieved, creating, created, etc.). Relying on event-driven logic with insertOrIgnore leads to silent failures in observers and event listeners.
- **Batch size imbalance**: Very large batch inserts (>1000 rows) can exceed database parameter limits (max_allowed_packet, max_connections) or cause transaction log overflow. Split large inserts into manageable batches of 100-500 rows.
- **Ignoring query shape**: The structure of SQL queries (which tables, joins, filters, and sort orders) determines index effectiveness. Maintaining consistent query shapes enables index reuse and query plan stability. Drastic query shape changes between deploys can cause performance regressions.
- **Not profiling before optimizing**: Premature query optimization based on assumptions rather than profiling data leads to wasted effort. Always use EXPLAIN, query logs, and profiling tools to identify actual bottlenecks before rewriting queries.
- **Missing index maintenance**: Over time, heavily written indexes fragment and lose performance. Schedule regular index rebuilds for tables with high write volume.
