# Skill: Execute Production Data Backfill with Progress Tracking

## Purpose

Run production data backfills using chunked ID-based batch processing with progress tracking, rate limiting, and verification — populating new columns or tables from existing data without degrading application performance or losing progress on failure.

## When To Use

- Backfilling new columns added during expand-contract migrations
- Populating new tables from existing data
- Transforming data between formats
- Any production data migration on tables > 100K rows

## When NOT To Use

- Tables < 10K rows (single UPDATE is acceptable)
- Data that can be computed on read rather than stored

## Prerequisites

- New column or table exists
- Source data is accessible
- Progress tracking mechanism (table or cache key)

## Inputs

- Source query
- Target column/table
- Transformation logic
- Batch size and throttle interval
- Progress tracking key

## Workflow

1. Design idempotent backfill query: `SET target = value WHERE target IS NULL` or `ON CONFLICT DO NOTHING`
2. Choose batch size: 500-1000 rows for general use
3. Implement progress tracking storing `last_processed_id` in a `backfill_progress` table
4. Use ID-based batch iteration: `WHERE id > $lastId ORDER BY id LIMIT $batchSize`
5. Add throttling: `usleep(100000)` between batches
6. For large tables, dispatch each batch as a separate queue job
7. Verify completion: compare row counts and checksums between source and target

## Validation Checklist

- [ ] Backfill query is idempotent and safe to retry
- [ ] ID-based batch iteration (not offset-based)
- [ ] Progress tracking saves the last processed ID
- [ ] Rate limiting prevents replication lag
- [ ] Queue jobs use a dedicated queue
- [ ] Verification confirms all rows processed correctly

## Common Failures

### No progress tracking
Backfill fails at 70%. Restart from beginning. Hours of work wasted. Always checkpoint progress in a `backfill_progress` table.

### Too large batch size
A single large UPDATE locks many rows and causes replication lag. Keep batches at 500-1000 rows and add sleep intervals between batches.

## Decision Points

### ID-based vs offset-based batching?
Always ID-based. Offset-based chunking skips or duplicates rows when data changes during iteration. ID-based is stable and resumeable.

### Direct UPDATE vs queued jobs?
Direct UPDATE for small tables (< 1M rows) where backfill completes in minutes. Queued jobs for larger tables — each batch is a separate job with retry and progress tracking.

## Performance Considerations

Each batch issues its own query — more queries but less per-query impact. Without throttling, batch sequences can cause replication lag spikes. Queue workers consume database connections — use a dedicated pool.

## Security Considerations

The `backfill_progress` table should not contain sensitive data. Use a dedicated database user with minimal privileges. Progress tracking data is operational — log it but don't expose it via APIs.

## Related Rules

- Always use ID-based batch iteration
- Make backfill queries idempotent
- Track progress for resumability

## Related Skills

- Execute Expand-Contract Pattern
- Verify Data Integrity During Migrations
- Execute Data Backfill Strategies

## Success Criteria

- All rows are backfilled with correct values
- Backfill is idempotent and can be retried safely
- No replication lag or performance degradation
- Progress tracking enables resume after failure
- Verification confirms 100% completion
