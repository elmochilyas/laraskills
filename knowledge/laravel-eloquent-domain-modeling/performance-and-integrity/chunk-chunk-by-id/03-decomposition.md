# Decomposition: chunk vs chunkById — Mutation-Safe Chunking

## Boundary Analysis
This KU covers the two chunking methods `chunk()` and `chunkById()`, their mechanics, mutation safety characteristics, and appropriate use cases. It excludes lazy collection streaming (`lazy()`, `lazyById()` — separate KU), cursor-based single-query streaming (`cursor()` — separate KU), and general pagination for API responses (which uses `paginate()` / `simplePaginate()`).

## Atomicity Assessment
**Status:** ✅ Atomic
The comparison of offset-based vs key-based chunking is a single conceptual unit. The two methods are variants of the same pattern, not separate topics.

## Dependency Graph
- **Depends on:** Basic Eloquent querying
- **Depends on:** Database indexing concepts
- **Referenced by:** `lazy-lazy-by-id` (lazy collection alternative)
- **Referenced by:** `cursor` (streaming alternative)
- **Referenced by:** Data export/import tasks in applications

## Follow-up Opportunities
- Custom chunking for multi-column pagination (composite keys)
- Automatic chunk method selection based on table mutation analysis
- Chunking with cursor-like memory profile using server-side cursors
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization