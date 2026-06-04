# Upsert Patterns — Bulk Unique Conflict Handling

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Performance & Data Integrity
- **Knowledge Unit:** Upsert Patterns
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

`upsert()` enables atomic "insert or update" operations on multiple records in a single query. Unlike looping over individual `updateOrCreate()` calls — which execute N queries for N records — `upsert()` translates to a single `INSERT ... ON DUPLICATE KEY UPDATE` (MySQL) or `INSERT ... ON CONFLICT DO UPDATE` (PostgreSQL) statement. This makes it the most efficient way to synchronize bulk data, handle API feed imports, and manage unique key conflicts at scale.

---

## Core Concepts

- **`upsert($values, $uniqueBy, $update)`:** Attempts to insert `$values`. If a record exists matching the `$uniqueBy` columns, it updates the columns specified in `$update` instead.
- **`$uniqueBy`:** The column(s) that uniquely identify a record. Must have a unique index or primary key constraint on the database. Can be a single column name or an array of columns for composite keys.
- **`$update`:** The columns to update when a matching record already exists. If omitted, nothing is updated on conflict — effectively an "insert if not exists" (INSERT IGNORE / ON CONFLICT DO NOTHING).
- **Batch operation:** `upsert()` accepts an array of arrays (multiple records) in a single call. All records are processed in one query — no individual row processing.
- **Database-specific SQL generation:** Laravel generates the appropriate SQL for each database driver automatically. No raw SQL required.

---

## Mental Models

### The Merge Lane Metaphor
Imagine two lanes of traffic merging into one. `upsert()` is a perfectly designed merge — cars from either lane slot into their correct positions without stopping. Looping `updateOrCreate()` is like each car coming to a complete stop at the merge point, checking if their spot is taken, then proceeding — one at a time.

### The Mail Merge Analogy
Like a mail merge that matches spreadsheet rows to database records by a key column, `upsert()` matches incoming data to existing rows by the unique key and updates the matching columns, all in a single pass.

---

## Internal Mechanics

- Laravel's query builder generates the appropriate upsert syntax for each database:
  - MySQL: `INSERT INTO ... VALUES (...) ON DUPLICATE KEY UPDATE ...`
  - PostgreSQL: `INSERT INTO ... VALUES (...) ON CONFLICT (unique_by) DO UPDATE SET ...`
  - SQLite: `INSERT INTO ... VALUES (...) ON CONFLICT (unique_by) DO UPDATE SET ...` (SQLite 3.24+)
  - SQL Server: `MERGE` statement
- The `upsert()` method strips `created_at`/`updated_at` from the update columns — timestamps are handled automatically.
- Each batch of upserted records is processed as a single statement. Very large arrays may exceed database parameter limits.

---

## Patterns

- **Bulk data synchronization:**
```php
User::upsert(
    $apiUsers, // Array of user data from external API
    ['email'], // Unique by email
    ['name', 'role', 'updated_at'] // Update these columns
);
```
- **Feed import / ETL:** Import product catalog, inventory, or pricing feeds with a single `upsert()` call per batch.
- **Idempotent queue processing:** When a queue job may be retried, use `upsert()` to ensure the processed state is reflected without creating duplicates.
- **Periodic sync with external systems:** Sync CRM contacts, SaaS user accounts, or subscription statuses using `upsert()` in a scheduled task.

---

## Architectural Decisions

- **Chunking upserts:** For very large datasets (100k+ rows), break into chunks of 500–1000 records per `upsert()` call. Database parameter limits (e.g., MySQL's `max_allowed_packet`) may be exceeded with oversized single queries.
- **Timestamps:** `upsert()` does not automatically update `updated_at` for matched rows unless explicitly included in the `$update` array. Always include `'updated_at'` if you need timestamp tracking on updates.
- **Selective update vs. full update:** Only specify the columns that actually change in `$update`. Updating all columns adds unnecessary write load and increases binlog size.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Single query for N records | Requires unique key constraint | Migration must add unique index |
| Atomic — all-or-nothing execution | Database-specific SQL generation | Edge case behavior differs per driver |
| Far faster than looped `updateOrCreate()` | Parameter limit on batch size | Must chunk for large datasets |
| Clean API without raw SQL | Silent on zero-affected-rows | Cannot easily detect "real" updates vs no-ops |
| Works with composite unique keys | No model events per row | `upsert()` bypasses `creating`/`updating` events |

---

## Performance Considerations

- `upsert()` is dramatically faster than looping `updateOrCreate()`: 1 query vs N queries, with all network round trips eliminated.
- For 10,000 records, `upsert()` in chunks of 1000 takes ~100ms on a typical MySQL instance. The same operation with `updateOrCreate()` would take 2–10 seconds, depending on network latency.
- The database handles conflict detection via the unique index — no `SELECT` preceding the `INSERT`, eliminating the race window entirely.
- Chunk size tuning: 500–1000 records per chunk is recommended. Too large (>5000) risks exceeding packet limits and causing query timeouts.

---

## Production Considerations

- **Bypasses model events:** `upsert()` does not fire `creating`, `created`, `updating`, `updated`, `saving`, or `saved` events. If you rely on event listeners (logging, cache invalidation, webhooks), you must handle them separately.
- **Does not increment auto-increment on update:** Some database engines increment the auto-increment counter even on update conflicts. Monitor the auto-increment sequence if it's used for ordering.
- **No returning clause:** `upsert()` returns the number of affected rows, not the models themselves. If you need the resulting models, fetch them separately after the upsert.
- **Binary logging impact:** Upserts generate more binlog entries than simple inserts. For high-throughput sync jobs, monitor replication lag.

---

## Common Mistakes

- **Omitting unique constraint:** `upsert()` silently inserts duplicate rows without a unique constraint. The `$uniqueBy` parameter only tells Laravel which columns to use in the ON DUPLICATE KEY clause — the database must enforce the uniqueness.
- **Assuming model events fire:** `upsert()` uses the query builder directly, not Eloquent model instances. No events, no accessors, no mutators. If you need model lifecycle hooks, use individual `updateOrCreate()` calls.
- **Including primary key in `$update`:** Updating the primary key column in the ON DUPLICATE KEY UPDATE clause can cause unexpected behavior. Exclude auto-increment primary keys from `$update`.
- **Not chunking large datasets:** A single `upsert()` with 100k records generates an enormous SQL statement that may exceed `max_allowed_packet` or cause a query timeout.
- **Forgetting `updated_at`:** `upsert()` does not auto-set `updated_at` on matched rows unless explicitly included in `$update`.

---

## Failure Modes

- **Query too large:** A single `upsert()` with 10,000 records may generate a SQL statement exceeding MySQL's `max_allowed_packet` (default 64MB). Chunk to 500–1000 per call.
- **Unique constraint violation on non-conflict column:** If the inserted data violates a unique constraint on a column not in `$uniqueBy`, the `INSERT` fails entirely. Validate data before upsert.
- **Silent data corruption:** If the wrong `$uniqueBy` columns are specified, `upsert()` may update records it should not, or insert duplicates. Audit the `$uniqueBy` definition carefully.
- **Type mismatch in `$values`:** Inconsistent data types across rows in the same `upsert()` call (int vs string for the same column) may cause driver-level errors.

---

## Ecosystem Usage

- **Laravel Spark / Cashier:** Uses `upsert()` for syncing subscription statuses from Stripe webhooks.
- **Laravel Horizon:** Updates job statistics using upsert patterns to minimize query count on high-traffic queues.
- **Spatie packages:** Several Spatie packages use `upsert()` for bulk permission and role synchronization.
- **Laravel Nova:** Action batch processing uses chunked upsert for applying actions to large result sets.

---

## Related Knowledge Units

### Prerequisites
- Database unique constraints and indexes
- Eloquent model creation and updating

### Related Topics
- `unique-enforcement` (single-record alternative)
- `first-or-create-vs-create-or-first` (race-condition patterns)
- `database-constraints` (unique constraint definition)

### Advanced Follow-up Topics
- Database-specific upsert behavior differences
- ETL pipeline design with upsert patterns
- Binary log replication impact of bulk upserts

---

## Research Notes

### Source Analysis
`Illuminate\Database\Query\Builder::upsert()` at `src/Illuminate/Database/Query/Builder.php`. The method delegates to `Grammar::compileUpsert()` which generates database-specific SQL. MySQL grammar at `src/Illuminate/Database/Query/Grammars/MySqlGrammar.php`.

### Key Insight
Upsert bypasses the entire Eloquent model lifecycle. This is both its greatest performance advantage and its most surprising failure mode. Developers accustomed to model events must remember that `upsert()` operates at the query builder level, not the model level.

### Version-Specific Notes
- Laravel 8: `upsert()` introduced.
- Laravel 9: Support for `updated_at` auto-handling improved.
- Laravel 10: PostgreSQL-specific `ON CONFLICT` optimization for composite unique keys.
- Laravel 11: SQLite upsert support (SQLite 3.24+).
