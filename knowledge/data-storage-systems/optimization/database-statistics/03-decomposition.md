# Decomposition: 4.29 Database statistics, cardinality estimates and optimizer decisions

## Topic Overview
The query optimizer relies on table statistics (row count, cardinality, data distribution) to choose execution plans. Stale or inaccurate statistics cause poor plan selection: full table scans when an index would be faster, nested loops when hash join is better. Regular `ANALYZE` (MySQL) or `ANALYZE` (PostgreSQL) keeps statistics fresh.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-29-database-statistics/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.29 Database statistics, cardinality estimates and optimizer decisions
- **Purpose:** The query optimizer relies on table statistics (row count, cardinality, data distribution) to choose execution plans. Stale or inaccurate statistics cause poor plan selection: full table scans when an index would be faster, nested loops when hash join is better.
- **Difficulty:** Advanced
- **Dependencies:** 3.9 Query optimizer internals, 4.28 EXPLAIN output interpretation

## Dependency Graph
**Depends on:** "3.9 Query optimizer internals", "4.28 EXPLAIN output interpretation"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Cardinality**: Number of distinct values in a column. High cardinality (e.g., id) makes range scans efficient. Low cardinality (e.g., status) may not benefit from an index.; - **Histograms**: PostgreSQL and MySQL 8.0 create histograms for non-uniform data distributions. Enables better estimates for range predicates.; - **ANALYZE vs optimize**: ANALYZE updates statistics only. OPTIMIZE TABLE rebuilds the table + updates stats. ANALYZE is sufficient for most optimizer issues..
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