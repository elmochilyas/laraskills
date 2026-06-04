# Decomposition: 8.1 Range partitioning (BY RANGE, RANGE COLUMNS in MySQL)

## Topic Overview
Range partitioning divides a table into partitions by column value ranges. Most common for date-based partitioning: `PARTITION BY RANGE (YEAR(created_at)) (PARTITION p2023 VALUES LESS THAN (2024), ...)`. Enables partition pruning (querying only relevant partitions) and efficient old-data archival via partition drop.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-1-range-partitioning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.1 Range partitioning (BY RANGE, RANGE COLUMNS in MySQL)
- **Purpose:** Range partitioning divides a table into partitions by column value ranges. Most common for date-based partitioning: `PARTITION BY RANGE (YEAR(created_at)) (PARTITION p2023 VALUES LESS THAN (2024), ...)`.
- **Difficulty:** Advanced
- **Dependencies:** 8.5 Partition pruning, 8.6 Partition management, 8.15 Partition switching

## Dependency Graph
**Depends on:** "8.5 Partition pruning", "8.6 Partition management", "8.15 Partition switching"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Range definition**: Each partition has `VALUES LESS THAN (value)`. Rows go to the first partition whose range includes their value.; - **Partition pruning**: Query `WHERE created_at BETWEEN '2024-01-01' AND '2024-03-01'` scans only partition(s) containing that date range.; - **MySQL RANGE COLUMNS**: `PARTITION BY RANGE COLUMNS(created_at)` — allows string, date, or multiple columns in range definition..
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