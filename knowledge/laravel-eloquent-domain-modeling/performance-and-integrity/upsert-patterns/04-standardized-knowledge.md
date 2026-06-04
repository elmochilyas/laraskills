# Upsert Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Upsert Patterns |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

`upsert()` enables atomic "insert or update" operations on multiple records in a single query. Unlike looping over individual `updateOrCreate()` calls — which execute N queries for N records — `upsert()` translates to a single `INSERT ... ON DUPLICATE KEY UPDATE` (MySQL) or `INSERT ... ON CONFLICT DO UPDATE` (PostgreSQL) statement. This is the most efficient way to synchronize bulk data, handle API feed imports, and manage unique key conflicts at scale.

## Core Concepts

- **`upsert($values, $uniqueBy, $update)`**: Attempts to insert `$values`. If a record exists matching `$uniqueBy`, updates the columns in `$update` instead.
- **`$uniqueBy`**: Column(s) identifying a record uniquely. Must have a unique index or primary key constraint.
- **`$update`**: Columns to update when a matching record exists. If omitted, acts as "insert if not exists."
- **Batch operation**: Accepts an array of arrays — all records processed in one query.
- **Database-specific SQL**: Laravel generates `ON DUPLICATE KEY UPDATE`, `ON CONFLICT DO UPDATE`, or `MERGE` per driver automatically.

## When To Use

- Bulk data synchronization (API feed imports, ETL pipelines)
- Periodically syncing external system data (CRM contacts, subscription statuses)
- Idempotent queue job processing — reflect processed state without creating duplicates
- Any operation that would otherwise be a loop over `updateOrCreate()`

## When NOT To Use

- Operations that depend on model lifecycle events (`upsert()` bypasses them entirely)
- Small datasets (1-5 records) where the complexity of `upsert()` is not justified
- When you need the resulting model instances (`upsert()` returns affected row count, not models)
- Tables without a unique constraint on the `$uniqueBy` columns

## Best Practices

- **Always create a unique constraint before using `upsert()`**: The `$uniqueBy` parameter only tells Laravel which columns to reference in the ON DUPLICATE KEY clause. Without a database-level unique index on those columns, `upsert()` silently inserts duplicate rows. Add the constraint in a migration before deploying `upsert()` code.
- **Chunk large datasets into batches of 500–1000**: A single `upsert()` with 100k records generates an enormous SQL statement that may exceed MySQL's `max_allowed_packet` (default 64MB) or cause query timeouts. Breaking into chunks also limits the blast radius of failures — one chunk fails, the rest succeed.
- **Always include `updated_at` in `$update`**: `upsert()` does not automatically update `updated_at` on matched rows unless explicitly included. If you rely on timestamp tracking, add `'updated_at' => now()` to the update columns.
- **Handle model events separately**: `upsert()` operates at the query builder level, bypassing `creating`, `created`, `updating`, `updated`, `saving`, and `saved` events. If you have event listeners (logging, cache invalidation, webhooks), process them separately — either by querying for changed records post-upsert or using individual model operations.

## Architecture Guidelines

- Use `upsert()` for ETL, feed import, and bulk synchronization tasks
- Combine with chunking for datasets larger than 1000 records
- Use a dedicated job class for upsert operations — makes event-handling and error recovery explicit
- Monitor binlog size and replication lag for high-throughput upsert jobs
- Use `$update` selectively — only specify columns that actually change to reduce write load

## Performance Considerations

- `upsert()` is dramatically faster than looping `updateOrCreate()`: 1 query vs N queries, all round trips eliminated
- For 10,000 records in chunks of 1000: ~100ms vs 2–10 seconds for `updateOrCreate()` loop
- Conflict detection uses the unique index — no SELECT preceding INSERT, eliminating the race window
- Chunk size tuning: 500–1000 is recommended; too large risks packet limits and timeouts

## Security Considerations

- `upsert()` bypasses model attribute casting and accessors — raw data goes to the database
- Validate all incoming data before passing to `upsert()` — no Eloquent attribute protection
- If `$uniqueBy` includes sensitive columns, ensure the incoming data is trusted or sanitized

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Omitting unique constraint | Assuming $uniqueBy is enough | Duplicate rows inserted silently | Add unique index in migration |
| Assuming model events fire | Not reading documentation | Missing logging, cache invalidation, webhooks | Handle events separately |
| Including PK in $update | Not excluding auto-increment | Unexpected PK behavior | Exclude auto-increment PK from $update |
| Not chunking large datasets | Straightforward syntax | Query exceeds max_allowed_packet | Chunk to 500-1000 per call |
| Forgetting updated_at | Expecting auto-handling | Stale updated_at on matched rows | Include 'updated_at' in $update |

## Anti-Patterns

- **upsert-without-constraint**: Using `upsert()` without a database unique constraint. Rows are inserted as duplicates because the database has no mechanism to detect conflicts.
- **upsert-for-all-sync**: Using `upsert()` when model events are critical (e.g., cache invalidation per row). If per-row events matter, use individual `updateOrCreate()` calls or implement post-upsert change tracking.
- **upsert-every-column**: Specifying all columns in `$update` when only a subset changes. Increases write load, binlog size, and replication lag.

## Examples

```php
// Bulk API data sync
User::upsert(
    $apiUsers,              // [['email' => 'a@b.com', 'name' => 'A'], ...]
    ['email'],              // Unique by email — must have unique index
    ['name', 'role', 'updated_at']  // Update these on conflict
);

// Insert if not exists (no update columns)
User::upsert(
    $newUsers,
    ['email'],
    []  // Empty update — only inserts, no updates
);

// Chunked upsert for large datasets
collect($apiData)->chunk(500)->each(function ($chunk) {
    User::upsert($chunk->toArray(), ['email'], ['name', 'updated_at']);
});

// Post-upsert cache invalidation (handle model events manually)
$before = User::whereIn('email', collect($apiUsers)->pluck('email'))->pluck('id');
User::upsert($apiUsers, ['email'], ['name', 'updated_at']);
$after = User::whereIn('email', collect($apiUsers)->pluck('email'))->pluck('id');
$changedIds = $after->diff($before);
User::whereIn('id', $changedIds)->get()->each->invalidateCache();
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | database-constraints |
| Prerequisite | Eloquent creation and updating |
| Closely Related | unique-enforcement |
| Closely Related | first-or-create-vs-create-or-first |
| Closely Related | concurrency-handling |

## AI Agent Notes

- Always generate a unique index migration alongside `upsert()` code
- Chunk to 500-1000 records when generating `upsert()` calls for large datasets
- Include `'updated_at'` in the `$update` array
- Document that model events are bypassed — suggest alternative handling if events are needed
- Validate incoming data before `upsert()` — no Eloquent attribute casting protection

## Verification

- [ ] Unique index exists on the `$uniqueBy` columns (verified in migration)
- [ ] Large datasets are chunked to 500-1000 records per call
- [ ] `updated_at` is included in the `$update` array when timestamp tracking is needed
- [ ] Model event handlers (logging, cache, webhooks) are handled separately if needed
- [ ] Auto-increment primary key is excluded from the `$update` array
