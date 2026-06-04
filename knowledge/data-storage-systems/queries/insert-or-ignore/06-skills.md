# Skill: Use Insert Or Ignore for Conditional Inserts

## Purpose

Use `insertOrIgnore` to insert rows while silently skipping any that would cause duplicate key violations — for idempotent seed data, log deduplication, and batch inserts where existing rows should be left unchanged.

## When To Use

- Idempotent reference/seed data inserts
- Log deduplication (insert by unique hash, skip duplicates)
- Bulk inserts where some rows may already exist

## When NOT To Use

- Operations requiring feedback on which rows were skipped
- Operations requiring model events (insertOrIgnore doesn't fire them)
- When existing rows should be updated (use upsert)

## Prerequisites

- Unique index or primary key on the columns checked for duplicates
- Understanding that skipped rows provide no feedback

## Inputs

- Array of rows to insert
- Unique constraint columns for duplicate detection

## Workflow

1. Ensure unique constraints exist on the deduplication columns
2. Call `Model::insertOrIgnore([$row1, $row2, ...])`
3. Verify the count of actually inserted rows if needed
4. Handle the case where some rows were silently skipped

## Validation Checklist

- [ ] Unique constraints exist on the deduplication columns
- [ ] No model events expected (insertOrIgnore bypasses them)
- [ ] Batch size is reasonable (100-500 rows to avoid parameter limits)
- [ ] Silent skip behavior is acceptable for the use case

## Common Failures

### Assuming insertOrIgnore succeeds for all rows
insertOrIgnore silently skips duplicate rows without feedback. Always verify row counts when data consistency is critical.

### Mixing insertOrIgnore with model events
Unlike create() or save(), insertOrIgnore does not fire Eloquent model events (retrieved, creating, created, etc.).

### Batch size imbalance
Very large batch inserts (>1000 rows) can exceed database parameter limits. Split into manageable batches.

## Decision Points

### insertOrIgnore vs upsert?
insertOrIgnore skips existing rows without updating. Upsert updates existing rows. Choose based on whether stale data should be refreshed.

### insertOrIgnore vs firstOrCreate loop?
insertOrIgnore is a single query. firstOrCreate loop is N+1. Use insertOrIgnore for batch inserts where updates are not needed.

## Performance Considerations

insertOrIgnore is faster than checking existence per row. However, very large batches should be split to avoid parameter limit issues.

## Security Considerations

insertOrIgnore bypasses mass-assignment protection. Ensure $fillable is configured on the model. The operation is atomic.

## Related Rules

- Verify row counts after insertOrIgnore
- Don't expect model events from insertOrIgnore
- Split large batches to avoid parameter limits

## Related Skills

- Perform Atomic Upsert Operations
- Use FirstOrCreate and UpdateOrCreate Semantics
- Process Large Datasets with Chunk and Cursor

## Success Criteria

- insertOrIgnore correctly skips existing rows without errors
- Unique constraints exist on the deduplication columns
- Row counts verified when data consistency is critical
- Batch sizes are within database parameter limits
