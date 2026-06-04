# Skill: Execute Throttled Data Backfill for Large Tables

## Purpose

Populate existing rows with values for newly added columns or tables using chunked, idempotent, and throttled batch processing via `chunkById` or queued jobs, ensuring production performance is not degraded and the operation can resume after interruption.

## When To Use

- Backfilling data for new columns added during expand-contract migrations
- Populating new tables from existing data sources
- Migrating data between columns with transformation
- Any production data migration on tables > 100K rows

## When NOT To Use

- Tables < 10K rows (single UPDATE is acceptable)
- Data that can be computed on read rather than stored
- Non-production environments with small datasets

## Prerequisites

- New column or table exists and is compatible with existing data
- Understanding of chunking methods (chunkById vs cursor vs chunk)
- Progress tracking mechanism

## Inputs

- Source data query
- Target column or table
- Transformation logic
- Chunk size and throttle interval
- Progress tracking key

## Workflow

1. Design the backfill query: idempotent — `SET target = value WHERE target IS NULL` or `ON CONFLICT DO NOTHING`
2. Choose chunk size: 500-1000 rows for general use, smaller for write-heavy tables
3. Implement progress tracking: store last processed ID in a `backfill_progress` table or cache key
4. Use `chunkById` for stable cursor-based iteration that doesn't skip rows
5. Add throttling: `usleep(100000)` (100ms) between chunks to control load
6. For large tables, dispatch each chunk as a separate queue job for parallel processing
7. Verify completion: compare row counts and checksums between source and target

## Validation Checklist

- [ ] Backfill query is idempotent and safe to retry
- [ ] `chunkById` is used instead of offset-based chunking
- [ ] Progress tracking saves the last processed key
- [ ] Chunk size and throttle interval prevent replication lag
- [ ] Queue jobs use a dedicated queue to avoid starving app workers
- [ ] Verification confirms all rows are processed

## Common Failures

### Not using chunkById
Offset-based `chunk()` skips or duplicates rows when data changes during iteration. Always use `chunkById` for production backfills.

### Non-idempotent backfill
Running the backfill again produces different results (appending instead of setting). Use `WHERE target IS NULL` or `ON CONFLICT DO NOTHING` for safe retry.

## Decision Points

### chunkById direct vs queued chunks?
Direct chunkById for tables < 1M rows where the backfill completes in minutes. Queued chunks for larger tables — each chunk is a separate job with built-in retry and failure isolation.

### Chunk size?
500-1000 for general use. 100 for write-heavy tables. 5000 for archive/slow tables. Monitor replication lag to find the optimal size.

## Performance Considerations

Each chunk issues its own query — smaller chunks = more queries but less per-query impact. Without throttling, chunked UPDATE sequences cause replication lag spikes. Queue workers consume database connections — use a dedicated connection pool.

## Security Considerations

Backfill operations should use a dedicated database user with minimal required privileges. Progress tracking data should not contain sensitive information.

## Related Rules

- Always use chunkById for production backfills
- Make backfill queries idempotent
- Throttle to prevent replication lag

## Related Skills

- Execute Expand-Contract Pattern
- Configure Data Backfill Best Practices
- Verify Data Integrity During Migrations

## Success Criteria

- All rows are backfilled with correct values
- Backfill is idempotent and can be retried safely
- No replication lag or performance degradation during backfill
- Progress tracking enables resume after interruption
- Verification confirms 100% completion
