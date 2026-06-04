# Skill: Perform Atomic Upsert Operations

## Purpose

Use `upsert` to insert rows that don't exist and update rows that do, in a single atomic operation — using unique indexes or primary keys for conflict detection — for idempotent imports, sync operations, and batch data ingestion.

## When To Use

- Idempotent data imports (run multiple times, same result)
- Syncing data from external APIs
- Replacing N+1 firstOrCreate calls with a single batch operation

## When NOT To Use

- Operations requiring model events (upsert doesn't fire them)
- Single-row find-or-create (use firstOrCreate or updateOrCreate)
- Tables without unique indexes on the match columns

## Prerequisites

- Unique index or primary key on the columns used for conflict detection
- Understanding that upsert does NOT fire model events

## Inputs

- Array of values to insert/update
- Column(s) for conflict detection (unique columns)
- Column(s) to update on conflict

## Workflow

1. Ensure a unique index exists on the identifier columns
2. Call `Model::upsert($values, $uniqueBy, $update)` where $values is an array of rows
3. Verify row counts to confirm expected behavior
4. For event-driven operations, use firstOrCreate in a transaction instead

## Validation Checklist

- [ ] Unique index exists on the conflict-detection columns
- [ ] Model events are not expected (upsert bypasses them)
- [ ] All unique columns are specified in $uniqueBy
- [ ] Update columns don't include the unique columns (no-op)

## Common Failures

### Missing unique index
Upsert silently falls back to INSERT on PostgreSQL (no error, no update). On MySQL, it requires a unique/primary key.

### Not including all unique columns
Upsert identifies conflicts by ALL specified unique columns. Missing a column may cause unexpected insert or update.

### Model events not fired
Upsert does NOT fire model events (saving, saved, creating, created, updating, updated). Use `DB::table` upsert for event-less operations.

## Decision Points

### Upsert vs firstOrCreate loop?
Upsert is a single query. firstOrCreate in a loop is N+1 queries. Use upsert for batch operations.

### Upsert vs insertOrIgnore?
Upsert updates existing rows. insertOrIgnore skips them. Choose based on whether existing data should be updated.

## Performance Considerations

Upsert is a single atomic query regardless of batch size. Much faster than firstOrCreate loops. However, it doesn't fire model events.

## Security Considerations

Upsert bypasses mass-assignment protection. Ensure $fillable is configured. The operation is atomic — no race condition between check and insert.

## Related Rules

- Ensure unique index exists before using upsert
- Don't expect model events from upsert
- Use upsert for batch, firstOrCreate for single row

## Related Skills

- Perform Atomic Upsert Operations
- Use Insert Or Ignore for Conditional Inserts
- Use FirstOrCreate and UpdateOrCreate Semantics

## Success Criteria

- Upsert correctly inserts new rows and updates existing ones
- Unique index exists on conflict-detection columns
- No model events expected from upsert operations
- Batch processing replaces firstOrCreate loops
