# Skill: Implement Memory-Efficient Read-Only Streaming with cursor

## Purpose
Iterate over massive result sets (millions of rows) with constant memory usage by streaming one row at a time using PHP generators.

## When To Use
- Read-only processing of datasets too large to fit in memory
- Stateless data export (CSV, JSON streaming)
- One-pass aggregations (summing, counting) without materializing full result set
- CLI commands or queue jobs that process rows sequentially

## When NOT To Use
- You need eager-loaded relationships (use `lazy()` with `with()`)
- Dataset is small enough to fit in memory (use `get()`)
- You need mutation safety during iteration (use `chunkById()`)
- Iteration runs in a web request — cursor holds the connection
- Processing involves writes that must be atomic per batch

## Prerequisites
- PHP generators and PDO statement fetching
- CLI or queue context (not web request)
- Database connection timeout configuration

## Inputs
- Eloquent query builder with constraints applied
- Iteration callback for each row

## Workflow
1. Build the query with all WHERE, ORDER BY, and SELECT constraints
2. Do NOT add `with()` — cursor silently ignores eager loading
3. Call `->cursor()` to get a LazyCollection
4. Iterate with `foreach` — never call `->toArray()` or `->all()`
5. Optionally set `READ UNCOMMITTED` isolation to prevent deadlocks
6. Configure generous connection timeout for long-running jobs
7. Process rows — access only scalar columns, never relationships

## Validation Checklist
- [ ] Cursor used only in CLI commands or queue jobs, not web controllers
- [ ] No `with()` calls precede the `cursor()` call
- [ ] No relationship access inside the iteration loop
- [ ] LazyCollection is not materialized via `->toArray()` or `->all()`
- [ ] Connection timeout configured for long-running cursor jobs
- [ ] `READ UNCOMMITTED` isolation set for read-only processing

## Common Failures
- Accessing relationships in cursor loop — triggers N+1 (eager loading silently ignored)
- Using cursor in web controller — holds connection for HTTP duration, pool exhaustion
- Materializing the LazyCollection — memory spikes to full dataset size
- Not handling connection disconnect — partial processing without checkpoint
- Assuming server-side cursor — PDO still buffers all rows in driver

## Decision Points
- `cursor()` vs `lazy()`: use cursor when memory is at absolute premium and no relationships needed; use `lazy()` when eager loading is required
- `cursor()` vs `chunkById()`: use cursor for read-only streaming; use chunkById for mutation-safe batch processing

## Performance Considerations
- `cursor()` uses less PHP memory than `lazy()` — one model at a time vs one chunk at a time
- Entire result set still buffered at PDO driver level — 10M+ rows may cause database-side memory issues
- Per-row hydration overhead higher than `lazy()` — benchmark before choosing
- No eager loading — any relationship access triggers N+1 cascade

## Security Considerations
- Long-running cursor processes hold database credentials in memory for extended periods
- Export cursors should not expose data the caller is not authorized to see

## Related Rules
- Never Access Relationships Inside a Cursor Loop (performance-and-integrity/cursor)
- Only Use Cursor in CLI or Queue Contexts (performance-and-integrity/cursor)
- Do Not Materialize the LazyCollection (performance-and-integrity/cursor)
- Set a Generous Connection Timeout for Cursor Jobs (performance-and-integrity/cursor)
- Use READ UNCOMMITTED for Read-Only Cursor Processing (performance-and-integrity/cursor)
- Never Add with() Before cursor() (performance-and-integrity/cursor)

## Related Skills
- Implement Batch Processing with chunkById
- Implement Memory-Efficient Iteration with lazyById
- Implement Read-Only Export with toBase

## Success Criteria
- Memory usage stays constant regardless of dataset size
- Single query executed — no N+1
- Connection timeout prevents mid-iteration failures
- No deadlocks with concurrent writes
