# Skill: Implement Mutation-Safe Batch Processing with chunkById

## Purpose
Process large Eloquent result sets in batches that are stable under concurrent mutations, avoiding offset drift that causes skipped or duplicate rows.

## When To Use
- Processing 100k+ rows where memory must be bounded
- Running batch updates, deletes, or migrations on live tables
- Data export jobs where the dataset may change during iteration
- Queue jobs that need resumability on failure

## When NOT To Use
- Result sets fit in memory (use `get()`)
- Dataset is static and read-only (use `chunk()` for simplicity)
- Table has no monotonically increasing unique key
- You need eager-loaded relationships per row (use `lazy()`)

## Prerequisites
- Monotonically increasing unique column (typically primary key)
- Database index on the key column
- Understanding of transactions

## Inputs
- Model class or query builder instance
- Chunk size (100-1000)
- Callback receiving each chunk's Collection
- Optional: checkpoint cache key for resumability

## Workflow
1. Determine the key column (defaults to primary key; pass custom column if needed)
2. Verify the key column has a database index
3. Set batch size between 100-1000 based on model complexity
4. Wrap callback body in `DB::transaction()` when performing writes
5. Call `Model::chunkById($size, $callback, $column)`
6. For resumability: save the last processed ID before each iteration ends
7. For chunked deletes: use `chunkById()` to avoid offset drift

## Validation Checklist
- [ ] `chunkById()` used instead of `chunk()` when dataset may mutate
- [ ] Key column is indexed
- [ ] Chunk size between 100 and 1000
- [ ] Callback wrapped in `DB::transaction()` for write operations
- [ ] Key column is never modified inside callback
- [ ] Checkpoint mechanism exists for batch jobs
- [ ] Processing runs in queue/CLI, not web request

## Common Failures
- Using `chunk()` for destructive operations — deletions shift offset causing missed rows
- Missing unique constraint on key column — infinite loop if duplicates exist
- Modifying the key column inside callback — breaks cursor for next batch
- No transaction around writes — partial state on failure
- Running in web request — timeout on large datasets

## Decision Points
- `chunk()` vs `chunkById()`: if the dataset is truly read-only (no concurrent writes), `chunk()` is acceptable. Default to `chunkById()`.
- Batch size: 100-500 for models with relations, 1000-5000 for simple models
- Custom key column: use when primary key is not the desired pagination column

## Performance Considerations
- `chunkById()` uses indexed key lookups — constant O(log n) per batch regardless of page
- `chunk()` with large offsets degrades: `OFFSET 100000` still scans 100k rows
- N chunks = N queries — monitor query volume
- Batch size tuning: smaller batches reduce per-query memory but increase round trips

## Security Considerations
- No direct security implications — chunking is a memory management strategy
- Ensure exported data respects authorization boundaries

## Related Rules
- Default to chunkById for Mutable Datasets (performance-and-integrity/chunk-chunk-by-id)
- Wrap Chunk Callbacks in Transactions (performance-and-integrity/chunk-chunk-by-id)
- Store Checkpoints for Resumability (performance-and-integrity/chunk-chunk-by-id)
- Never Modify the Key Column Inside chunkById (performance-and-integrity/chunk-chunk-by-id)
- Ensure the Key Column Is Indexed (performance-and-integrity/chunk-chunk-by-id)
- Set Batch Size Between 100 and 1000 (performance-and-integrity/chunk-chunk-by-id)
- Do Not Run Chunked Processing in Web Requests (performance-and-integrity/chunk-chunk-by-id)
- Never Use chunkById on Non-Unique Columns (performance-and-integrity/chunk-chunk-by-id)

## Related Skills
- Implement Memory-Efficient Streaming with cursor
- Implement Batch Processing with lazyById
- Implement Bulk Upsert Operations

## Success Criteria
- Batch job processes every row exactly once, even under concurrent writes
- Memory usage stays bounded by chunk size × model size
- Job can resume from checkpoint after failure
- No duplicate or skipped rows in output
