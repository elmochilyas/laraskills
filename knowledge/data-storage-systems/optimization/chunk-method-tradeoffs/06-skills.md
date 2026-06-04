# Skill: Select Appropriate Chunk Method

## Purpose
Choose between `chunk`, `chunkById`, `cursor`, `lazy`, and `lazyById` based on data stability, connection duration tolerance, and memory constraints.

## When To Use
- When processing large datasets (exports, backfills, batch jobs)
- When memory limits prevent loading all rows at once

## When NOT To Use
- When the result set fits comfortably in PHP memory (<10K rows)
- When processing requires random access to the full dataset

## Prerequisites
- Understanding of each chunk method's internal behavior
- Knowledge of PHP memory limits and database connections

## Inputs
- Dataset size, mutation frequency, connection constraints

## Workflow
1. Assess dataset size and mutation frequency during processing
2. If table has concurrent writes: use `chunkById` or `lazyById` (key-based, stable)
3. If table is read-only during processing: `chunk` is acceptable
4. If memory is the primary constraint: use `cursor` or `lazy` (one row at a time)
5. If connection pool is limited: use `chunkById` (releases connection between chunks)
6. If collection pipeline needed: use `lazy` (supports map/filter/reduce)

## Validation Checklist
- [ ] Chunk method chosen matches data stability requirements
- [ ] No `chunk` on tables with concurrent modifications
- [ ] No `cursor` for long-running queue jobs (holds connection)
- [ ] Memory usage within PHP limits for chosen method

## Common Failures
- `chunk` on tables with concurrent modifications — rows skipped/duplicated
- `cursor` in long-running queue jobs — holds database connection for entire duration
- Using `chunk` when `chunkById` is more stable

## Decision Points
- Stable data + acceptable memory: `chunk`
- Concurrent writes: `chunkById` or `lazyById`
- Memory-constrained + short processing: `cursor` or `lazy`
- Queue job processing: `chunkById` (releases connection per chunk)

## Performance
- `chunk`: offset-based, degrades with page depth
- `chunkById`: key-based, stable O(log n) per chunk
- `cursor`: single query, streaming — low memory, holds connection
- `lazy`/`lazyById`: similar to cursor but with collection API

## Security
- Long-running connections from cursor/lazy may exceed db connection timeouts
- `chunkById` is safer for production batch processing

## Related Rules
- 4-19-1: Always EXPLAIN Before Optimizing
- 4-19-4: Review And Apply Core Concepts

## Related Skills
- Optimize Memory Usage
- Avoid Deep Offset Pagination

## Success Criteria
- Chunk method appropriate for data stability profile
- No memory exhaustion during processing
- No connection timeout or pool exhaustion
- No skipped or duplicated rows in production backfills
