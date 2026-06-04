# Skill: Implement Memory-Efficient Iteration with Eager Loading using lazy

## Purpose
Process large datasets with bounded memory while supporting eager-loaded relationships, bridging the gap between `chunk()` and `cursor()`.

## When To Use
- Processing 100k+ rows where memory must be bounded
- Iteration that needs eager-loaded relationships (use `lazy()` with `with()`)
- Mutation-safe iteration over live datasets (use `lazyById()`)
- Fluent collection-style processing on large datasets (map, filter, reduce)
- Replacement for most `chunk()` use cases — same mechanics with a better API

## When NOT To Use
- Datasets small enough to fit in memory (use `get()`)
- Memory is at absolute premium and eager loading is not needed (use `cursor()`)
- Dataset is static and read-only, prefer `chunk()` for simplicity

## Prerequisites
- Understanding of LazyCollection
- Knowledge of chunk vs key-based pagination
- Eager loading concepts

## Inputs
- Model class or query builder
- Chunk size (default 1000)
- Optional: key column for `lazyById()` or `lazyByIdDesc()`

## Workflow
1. Build the query with all WHERE constraints
2. Call `->with('relations')` before `lazy()` if relationships are needed in the loop
3. Call `->lazy($chunkSize)` or `->lazyById($chunkSize)` for mutation-safe iteration
4. Iterate with `foreach` or chain LazyCollection methods (map, filter, reduce)
5. Do NOT call `->toArray()` or `->all()` on the LazyCollection
6. For live tables with concurrent writes, default to `lazyById()`

## Validation Checklist
- [ ] `lazyById()` used for datasets that may be mutated during iteration
- [ ] Eager loading (`with()`) called before `lazy()` when relationships are accessed
- [ ] LazyCollection is not materialized via `->toArray()` or `->all()`
- [ ] Chunk size tuned for model complexity (smaller for heavy relations)
- [ ] Lazy iteration runs in CLI/queue context, not web request
- [ ] LazyCollection is not iterated twice (single-use generator)

## Common Failures
- Iterating a LazyCollection twice — generator rewind error
- Calling `->all()` or `->toArray()` — full dataset loaded into memory
- Expecting lazy relations to work — N+1 on relationships without prior `with()`
- Not using `lazyById()` for live tables — offset drift causes skipped/duplicate rows
- Using `lazy()` for tiny datasets — unnecessary complexity

## Decision Points
- `lazy()` vs `lazyById()`: use `lazyById()` for any dataset that may be mutated during iteration; use `lazy()` only for read-only datasets
- `lazy()` vs `cursor()`: use `lazy()` when eager loading is needed; use `cursor()` when memory is at absolute premium and relationships are not needed
- Chunk size: 50-200 for relation-heavy models, 1000-5000 for simple models

## Performance Considerations
- Memory usage proportional to chunk size × model size
- `lazy()` with eager loading executes one additional query per chunk per relation
- `lazyById()` is more efficient than `lazy()` for large datasets — avoids offset scan overhead
- LazyCollection pipeline processes one chunk at a time; memory stays bounded

## Security Considerations
- No direct security implications — lazy iteration is a memory management concern
- Ensure lazy-iterated data respects authorization boundaries

## Related Rules
- Use lazyById for Concurrent Scenarios by Default (performance-and-integrity/lazy-lazy-by-id)
- Use with() Before lazy() for Relationships (performance-and-integrity/lazy-lazy-by-id)
- Never Materialize the LazyCollection (performance-and-integrity/lazy-lazy-by-id)
- Size Chunks According to Model Complexity (performance-and-integrity/lazy-lazy-by-id)
- Place Lazy Iteration in CLI or Queue Contexts (performance-and-integrity/lazy-lazy-by-id)
- Never Iterate a LazyCollection Twice (performance-and-integrity/lazy-lazy-by-id)

## Related Skills
- Implement Mutation-Safe Batch Processing with chunkById
- Implement Memory-Efficient Streaming with cursor
- Implement Read-Only Export with toBase

## Success Criteria
- Memory usage stays bounded by chunk size
- Eager-loaded relationships available without N+1
- No skipped or duplicate rows when using `lazyById()` on live tables
- LazyCollection not materialized into memory
