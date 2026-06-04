# Decomposition: 8.8 Partition index design (local vs. global indexes in MySQL/PostgreSQL)

## Topic Overview
MySQL partitioned tables have only local indexes (index per partition, each index covers only the partition's data). PostgreSQL supports both local and global indexes. Local indexes are partitioned in tandem with the table.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-8-partition-index-design/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.8 Partition index design (local vs. global indexes in MySQL/PostgreSQL)
- **Purpose:** MySQL partitioned tables have only local indexes (index per partition, each index covers only the partition's data). PostgreSQL supports both local and global indexes.
- **Difficulty:** Advanced
- **Dependencies:** 8.5 Partition pruning, 3.10 Index types

## Dependency Graph
**Depends on:** "8.5 Partition pruning", "3.10 Index types"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Local index (MySQL/PostgreSQL)**: Index exists independently per partition. Query must prune to benefit from index — if all partitions are scanned, all indexes are probed.; - **Global index (PostgreSQL only)**: Single index across all partitions. Supports efficient queries without partition pruning. Maintenance cost: every insert/update touches the global index.; - **MySQL limitation**: All indexes on a partitioned table are effectively local. The partition key must be part of every unique index (MySQL requirement)..
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