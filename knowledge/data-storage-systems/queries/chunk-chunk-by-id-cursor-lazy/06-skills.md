# Skill: Process Large Datasets with Chunk and Cursor

## Purpose

Iterate large Eloquent result sets without exhausting memory — using `chunkById` for stable production batch processing, `cursor` for memory-efficient single-pass exports, and `lazy` for complex collection pipelines — selecting the appropriate strategy based on dataset size and processing requirements.

## When To Use

- Processing thousands to millions of Eloquent models
- Memory-constrained environments for data exports
- Data migrations and backfills on production tables
- Large collection pipelines (map, filter, reduce)

## When NOT To Use

- Small datasets that fit in memory (< 1000 records)
- Real-time request-response cycles (use pagination)

## Prerequisites

- Understanding of memory management and PHP memory limits
- Knowledge of OFFSET-based vs cursor-based pagination

## Inputs

- Dataset size and growth rate
- Processing operation per record
- Memory constraints
- Concurrent modification risk

## Workflow

1. Estimate dataset size and memory requirement
2. For stable batch processing: use `Model::chunkById(100, fn($records) => ...)`
3. For memory-efficient exports: use `Model::cursor()` with a generator
4. For collection pipelines: use `Model::lazy()` or `Model::lazyById()`
5. For simple pagination on read-only tables: use `Model::chunk(100, fn($records) => ...)`

## Validation Checklist

- [ ] chunkById used instead of chunk for production tables with writes/deletes
- [ ] cursor not used inside long-running queue jobs (holds connection open)
- [ ] Exception handling ensures cursor resources are freed
- [ ] chunk size is tuned (100-500 records per chunk)

## Common Failures

### Using chunk on tables being modified
Rows shift between chunks due to OFFSET. Use chunkById instead.

### Using cursor inside a queued job
Holding the database cursor for a long time while other queue workers compete for connections. Use chunkById for queued jobs.

### Not freeing cursor resources
If an exception occurs mid-iteration, the cursor is not properly closed.

## Decision Points

### chunk vs chunkById?
Use chunkById for all production tables where records are modified/deleted during processing. Use chunk only for append-only tables.

### cursor vs chunkById?
Cursor uses less memory (one model at a time) but holds the connection. chunkById uses more memory per chunk but releases the connection between chunks.

## Performance Considerations

chunkById avoids OFFSET drift. Cursor is most memory-efficient but can be slow on network-latent connections. lazy() and lazyById() add collection method overhead.

## Security Considerations

Process one chunk at a time to avoid locking large portions of the table. For sensitive data exports, ensure output is properly secured.

## Related Rules

- Use chunkById for production batch processing
- Use cursor for memory-efficient single-pass processing
- Not for long-running queue jobs

## Related Skills

- Perform Atomic Upsert Operations
- Use Insert Or Ignore for Conditional Inserts
- Hydrate Eloquent Models from Raw Data

## Success Criteria

- chunkById used in all production batch processing
- Memory usage stays within limits for large datasets
- Cursor operations properly handle exceptions and cleanup
- Appropriate strategy chosen based on dataset characteristics
