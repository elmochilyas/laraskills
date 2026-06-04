# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Eloquent ORM / Query Builder
**Knowledge Unit:** 2-23 Chunk / ChunkById / Cursor / Lazy
**Generated:** 2026-06-03

---

# Decision Inventory

* chunk vs chunkById
* cursor vs lazy vs chunk
* Memory profile vs stability requirements

---

# Architecture-Level Decision Trees

---

## Large Dataset Iteration Strategy

---

## Decision Context

Choosing the optimal method to process thousands to millions of Eloquent models without memory exhaustion.

---

## Decision Criteria

* performance: memory usage, query count, connection duration
* architectural: offset drift risk, data mutation during iteration
* maintainability: connection management in queue jobs
* security: cursor holds connection open longer

---

## Decision Tree

Processing a large dataset?
↓
Will rows be modified during iteration?
YES → Use chunkById or lazyById (stable ordering, no offset drift)
    ↓
    Processing in a queue job?
    YES → Use chunkById (releases connection between chunks)
    NO → Use lazyById (lower memory, but holds connection)
NO → Is memory the primary concern?
    YES → Use cursor or lazy (generator, one model at a time)
        ↓
        Need collection methods (map, filter, reduce)?
        YES → Use lazy() (LazyCollection API)
        NO → Use cursor() (raw generator, lowest overhead)
    NO → Use chunk (simplest, but risk of offset drift)

---

## Rationale

chunkById is the safest choice for production data processing because it eliminates the offset drift problem that affects chunk. cursor/lazy provide the lowest memory footprint but hold database connections open, making them unsuitable for long-running queue jobs.

---

## Recommended Default

**Default:** chunkById() for production data migrations
**Reason:** Stable ordering prevents missed/duplicate rows. Releases connection between chunks, making it safe for queue jobs.

---

## Risks Of Wrong Choice

* Using chunk on mutable data: rows are skipped or duplicated due to OFFSET drift
* Using cursor in queue jobs: connection held for entire job duration, causing connection pool exhaustion
* Not catching exceptions in cursor iteration: connection not properly released

---

## Related Rules

* Always use chunkById for data migrations and backfills
* Avoid cursor in queued jobs — use chunkById instead

---

## Related Skills

* Process large datasets with chunkById
* Export data with cursor for memory efficiency
