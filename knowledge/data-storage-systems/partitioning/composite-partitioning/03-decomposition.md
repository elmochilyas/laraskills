# Decomposition: 8.4 Composite partitioning (subpartitioning, range-hash, range-list)

## Topic Overview
Composite (sub)partitioning uses two levels: the table is partitioned by one strategy, and each partition is further subpartitioned. `PARTITION BY RANGE (YEAR(created_at)) SUBPARTITION BY HASH (user_id) SUBPARTITIONS 4`. Combines benefits: range for lifecycle management, hash for even write distribution.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-4-composite-partitioning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.4 Composite partitioning (subpartitioning, range-hash, range-list)
- **Purpose:** Composite (sub)partitioning uses two levels: the table is partitioned by one strategy, and each partition is further subpartitioned. `PARTITION BY RANGE (YEAR(created_at)) SUBPARTITION BY HASH (user_id) SUBPARTITIONS 4`.
- **Difficulty:** Advanced
- **Dependencies:** 8.1 Range partitioning, 8.3 Hash partitioning, 8.6 Partition management

## Dependency Graph
**Depends on:** "8.1 Range partitioning", "8.3 Hash partitioning", "8.6 Partition management"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Level 1**: Primary partition strategy (typically range by date). Handles lifecycle (archival of old ranges).; - **Level 2**: Subpartition strategy (typically hash or list). Distributes writes within the current range partition.; - **Partition maintenance**: Operations apply at the primary partition level. `DROP PARTITION p2020` drops all subpartitions for that range..
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