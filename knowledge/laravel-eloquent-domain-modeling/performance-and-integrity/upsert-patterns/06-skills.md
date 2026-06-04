# Skill: Implement Atomic Bulk Upsert Operations

## Purpose
Perform atomic "insert or update" on multiple records in a single query using `upsert()`, dramatically outperforming loops of `updateOrCreate()` for bulk data synchronization.

## When To Use
- Bulk data synchronization (API feed imports, ETL pipelines)
- Periodically syncing external system data (CRM contacts, subscription statuses)
- Idempotent queue job processing
- Any operation that would otherwise be a loop over `updateOrCreate()`

## When NOT To Use
- Operations depending on model lifecycle events (`upsert()` bypasses them entirely)
- Small datasets (1-5 records) where complexity is not justified
- When you need resulting model instances (`upsert()` returns affected row count)
- Tables without a unique constraint on the `$uniqueBy` columns

## Prerequisites
- Database unique constraint on `$uniqueBy` columns
- Understanding of model event bypass behavior
- Data validation strategy (no Eloquent attribute casting protection)

## Inputs
- Values array (array of arrays to insert/update)
- `$uniqueBy` columns (must have unique index)
- `$update` columns (columns to update on conflict)
- Optional: chunk size for large datasets

## Workflow
1. Add a database unique index on the `$uniqueBy` columns
2. Validate and sanitize all incoming data (Eloquent attribute casting is bypassed)
3. For large datasets: chunk into batches of 500-1000
4. Call `Model::upsert($values, $uniqueBy, $update)`
5. Include `'updated_at' => now()` in `$update` (bypassed otherwise)
6. Exclude auto-increment primary key from `$update`
7. Handle model events separately — query for changed records post-upsert

## Validation Checklist
- [ ] Unique index exists on the `$uniqueBy` columns (verified in migration)
- [ ] Large datasets chunked to 500-1000 records per call
- [ ] `updated_at` included in the `$update` array when timestamp tracking needed
- [ ] Model event handlers handled separately if needed
- [ ] Auto-increment primary key excluded from `$update`
- [ ] Incoming data validated and sanitized before `upsert()`

## Common Failures
- Omitting unique constraint — assuming `$uniqueBy` is enough, duplicates inserted silently
- Assuming model events fire — logging, cache, webhooks never execute
- Including PK in `$update` — unexpected auto-increment behavior
- Not chunking large datasets — query exceeds `max_allowed_packet`
- Forgetting `updated_at` — stale timestamps on matched rows

## Decision Points
- `upsert()` vs `updateOrCreate()` loop: use `upsert()` for bulk operations (1 query vs N queries); use `updateOrCreate()` when model events are critical
- Chunk size: 500-1000 is recommended; smaller for wide rows, larger for narrow rows
- `$update` columns: specify only columns that actually change to reduce write load and binlog size

## Performance Considerations
- `upsert()` is dramatically faster than looping `updateOrCreate()`: 1 query vs N queries
- For 10k records in chunks of 1000: ~100ms vs 2-10 seconds for `updateOrCreate()` loop
- Conflict detection uses the unique index — no SELECT preceding INSERT
- Chunk size tuning: too large risks packet limits and timeouts

## Security Considerations
- `upsert()` bypasses model attribute casting and accessors — raw data goes to database
- Validate all incoming data before passing to `upsert()` — no Eloquent attribute protection
- If `$uniqueBy` includes sensitive columns, ensure incoming data is trusted or sanitized

## Related Rules
- Always Create a Unique Constraint Before Using upsert (performance-and-integrity/upsert-patterns)
- Chunk Large Datasets to 500-1000 Records per Call (performance-and-integrity/upsert-patterns)
- Always Include updated_at in $update (performance-and-integrity/upsert-patterns)
- Handle Model Events Separately (performance-and-integrity/upsert-patterns)
- Never Include Auto-Increment PK in $update (performance-and-integrity/upsert-patterns)
- Validate All Incoming Data Before upsert (performance-and-integrity/upsert-patterns)

## Related Skills
- Implement Concurrent-Safe Find-Or-Create with createOrFirst
- Enforce Uniqueness with Database Constraints
- Implement Pessimistic Locking for Concurrency

## Success Criteria
- Bulk sync completes in seconds instead of minutes
- No duplicate rows inserted (unique constraint verified)
- `updated_at` correctly maintained on matched rows
- Model events handled via separate post-upsert logic
- All incoming data validated before reaching database
