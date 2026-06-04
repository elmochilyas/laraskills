# Decomposition: Index-Aware Queries — Leveraging Database Indexes

## Boundary Analysis
This KU covers the practice of writing Eloquent queries that utilize database indexes effectively: composite index design, covering indexes, `EXPLAIN` analysis, and index hints. It excludes general database index fundamentals (assumed prerequisite), schema-level index definition (`index()` in migrations), and query optimization beyond index usage (`subquery-optimization`, `select-constraints`).

## Atomicity Assessment
**Status:** ✅ Atomic
Index-aware query writing is a single, cohesive practice: structuring queries to match existing or planned indexes. The various techniques (column ordering, covering indexes, hinting) are facets of the same principle.

## Dependency Graph
- **Depends on:** Database index fundamentals (B-tree, composite, covering)
- **Depends on:** Eloquent SQL generation understanding
- **Referenced by:** `select-constraints` (covering index design)
- **Referenced by:** `subquery-optimization` (indexing subquery WHERE clauses)
- **Referenced by:** `database-constraints` (unique indexes, FK indexes)
- **Referenced by:** All query-heavy features (as foundational optimization)

## Follow-up Opportunities
- Automated index recommendation based on query log analysis
- CI integration for `EXPLAIN` assertion testing
- Database-specific index guides (MySQL vs PostgreSQL vs SQLite Indexing)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization