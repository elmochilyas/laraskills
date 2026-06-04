# Decomposition: 4.28 Database-specific execution plan analysis (EXPLAIN output interpretation)

## Topic Overview
EXPLAIN output differs significantly between MySQL/MariaDB and PostgreSQL. MySQL shows join type, key, rows examined, and Extra. PostgreSQL shows node type, startup cost, total cost, rows, width, and actual timing with ANALYZE.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-28-explain-output-interpretation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.28 Database-specific execution plan analysis (EXPLAIN output interpretation)
- **Purpose:** EXPLAIN output differs significantly between MySQL/MariaDB and PostgreSQL. MySQL shows join type, key, rows examined, and Extra.
- **Difficulty:** Advanced
- **Dependencies:** 4.5 EXPLAIN/EXPLAIN ANALYZE, 3.10 Index types

## Dependency Graph
**Depends on:** "4.5 EXPLAIN/EXPLAIN ANALYZE", "3.10 Index types"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **MySQL EXPLAIN columns**: `select_type`, `table`, `type` (const/ref/range/index/ALL), `possible_keys`, `key`, `ref`, `rows`, `Extra` (Using index, Using where, Using filesort, Using temporary).; - **PostgreSQL EXPLAIN**: `Seq Scan` vs `Index Scan` vs `Index Only Scan`, `cost=startup..total`, estimated rows, `width`. With `ANALYZE`, shows actual rows and timing.; - **Red flags in MySQL**: `type=ALL` (full table scan), `Extra=Using filesort` (no sort index), `Extra=Using temporary` (temp table for GROUP BY), `rows >> actual` (bad cardinality estimate).; - **Red flags in PostgreSQL**: `Seq Scan` on large table, `Sort Method: external merge Disk` (sort exceeds work_mem), large row count mismatch between estimate and actual..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization