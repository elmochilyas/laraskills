# Decomposition: 8.5 Partition pruning (how the optimizer eliminates irrelevant partitions)

## Topic Overview
Partition pruning is the optimizer's ability to scan only relevant partitions for a query. `WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01'` on a range-partitioned table scans 1 partition instead of all 12. Pruning requires the WHERE clause to reference the partition key with simple comparisons (>, <, BETWEEN, IN, =).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-5-partition-pruning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.5 Partition pruning (how the optimizer eliminates irrelevant partitions)
- **Purpose:** Partition pruning is the optimizer's ability to scan only relevant partitions for a query. `WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01'` on a range-partitioned table scans 1 partition instead of all 12.
- **Difficulty:** Advanced
- **Dependencies:** 8.1 Range partitioning, 4.5 EXPLAIN

## Dependency Graph
**Depends on:** "8.1 Range partitioning", "4.5 EXPLAIN"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Static pruning**: Constant expression in WHERE: `created_at = '2024-01-15'` — optimizer knows exact partition at query plan time.; - **Dynamic pruning**: `WHERE user_id = ?` with parameter — pruning happens at execution time.; - **Conditions that prevent pruning**: Functions on the partition key (`YEAR(created_at)` in MySQL RANGE COLUMNS prevents pruning), OR conditions, subqueries..
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