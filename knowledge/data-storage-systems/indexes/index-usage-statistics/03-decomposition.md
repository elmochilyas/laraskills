# Decomposition: 3.25 Index usage statistics (pg_stat_user_indexes, MySQL performance_schema)

## Topic Overview
Index usage statistics reveal which indexes are used, which are unused, and how often they're scanned. PostgreSQL: `pg_stat_user_indexes` (idx_scan, idx_tup_read, idx_tup_fetch). MySQL: `performance_schema.table_io_waits_summary_by_index_usage`, `sys.schema_unused_indexes`.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-25-index-usage-statistics/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.25 Index usage statistics (pg_stat_user_indexes, MySQL performance_schema)
- **Purpose:** Index usage statistics reveal which indexes are used, which are unused, and how often they're scanned. PostgreSQL: `pg_stat_user_indexes` (idx_scan, idx_tup_read, idx_tup_fetch).
- **Difficulty:** Advanced
- **Dependencies:** 3.22 Index size estimation, 3.23 Over-indexing risks

## Dependency Graph
**Depends on:** "3.22 Index size estimation", "3.23 Over-indexing risks"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **idx_scan**: Number of index scans. 0 = unused index.; - **idx_tup_read / idx_tup_fetch**: Rows read from index vs fetched from heap. High fetch ratio suggests covering index improvement opportunity.; - **sys.schema_unused_indexes (MySQL)**: Identifies indexes never used since last server restart or stats reset..
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