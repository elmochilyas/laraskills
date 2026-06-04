# Decomposition: Upsert Patterns — Bulk Unique Conflict Handling

## Boundary Analysis
This KU covers the `upsert()` method on Eloquent and Query builders for bulk "insert or update" operations. It includes chunking strategies, event bypass, and unique constraint requirements. It excludes single-record unique enforcement (`unique-enforcement`, `first-or-create-vs-create-or-first`), model lifecycle events, and general query builder optimization.

## Atomicity Assessment
**Status:** ✅ Atomic
Upsert is a single, well-defined pattern for handling bulk unique key conflicts. While it interacts with multiple concerns (events, constraints, performance), the core concept is atomic: INSERT with collision-resolution in one statement.

## Dependency Graph
- **Depends on:** `database-constraints` (unique index requirement)
- **Depends on:** Query builder fundamentals
- **Referenced by:** ETL, import, and data synchronization implementations
- **Referenced by:** `concurrency-handling` (as a strategy for bulk atomicity)

## Follow-up Opportunities
- Custom upsert with returning clause support
- Hybrid upsert + model event pattern
- Database-specific upsert optimization for high-throughput feeds
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization