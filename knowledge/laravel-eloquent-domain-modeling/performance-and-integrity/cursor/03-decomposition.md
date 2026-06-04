# Decomposition: cursor — Memory-Efficient Single-Query Streaming

## Boundary Analysis
This KU covers the `cursor()` method on the Eloquent and Query builders for single-query, row-by-row streaming of results. It includes its memory characteristics, limitations (no eager loading, open connection), and appropriate use cases. It excludes `lazy()`/`lazyById()` (chunked hydration with eager loading support) and `chunk()`/`chunkById()` (callback-based multi-query batching).

## Atomicity Assessment
**Status:** ✅ Atomic
Cursor-based streaming is a single, distinct approach to large dataset iteration. Its unique characteristics (no eager loading, single query, open connection) set it apart from chunking and lazy collection alternatives.

## Dependency Graph
- **Depends on:** PHP generators and PDO fetch mechanics
- **Depends on:** Eloquent model hydration basics
- **Referenced by:** `lazy-lazy-by-id` (as alternative approach with eager loading)
- **Referenced by:** `chunk-chunk-by-id` (as alternative batching approach)
- **Referenced by:** Data export and reporting implementations

## Follow-up Opportunities
- True server-side cursor support in Laravel (PostgreSQL DECLARE CURSOR, MySQL unbuffered queries)
- Hybrid approach: cursor-like streaming with batched relationship loading
- Database driver-specific cursor optimization guides
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization