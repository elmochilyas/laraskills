# Decomposition: lazy / lazyById — Lazy Collection Streaming

## Boundary Analysis
This KU covers the `lazy()`, `lazyById()`, and `lazyByIdDesc()` methods on the Eloquent builder for memory-efficient streaming of hydrated Eloquent models. It excludes `chunk()`/`chunkById()` (callback-based approach), `cursor()` (non-hydrated streaming), and general `LazyCollection` usage outside of Eloquent queries.

## Atomicity Assessment
**Status:** ✅ Atomic
The lazy collection streaming pattern is a single cohesive concept with three method variants. The key-based vs offset-based distinction mirrors chunk-chunk-by-id, confirming both belong in the same KU.

## Dependency Graph
- **Depends on:** `chunk-chunk-by-id` (underlying mechanics)
- **Depends on:** PHP generators and `LazyCollection` fundamentals
- **Referenced by:** `cursor` (as an alternative approach)
- **Referenced by:** Data export, import, and batch processing implementations
- **Referenced by:** `select-constraints` (optimizing per-chunk payload)

## Follow-up Opportunities
- Custom lazy loading strategies for deeply nested relations
- Concurrent chunk processing with lazy collections and parallel jobs
- Lazy collection integration with queue workers for streaming job dispatch
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization