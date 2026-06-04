# Decomposition: 8.6 Partition management (ADD, DROP, TRUNCATE, REORGANIZE, REPAIR)

## Topic Overview
Partition management operations: `ADD PARTITION` (add new range), `DROP PARTITION` (remove partition + data instantly), `TRUNCATE PARTITION` (delete data, keep partition), `REORGANIZE PARTITION` (split/merge partitions), `REBUILD/REPAIR PARTITION`. These operations are metadata-only (no data copy) for `DROP` and `TRUNCATE`. `REORGANIZE` copies data.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-6-partition-management/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.6 Partition management (ADD, DROP, TRUNCATE, REORGANIZE, REPAIR)
- **Purpose:** Partition management operations: `ADD PARTITION` (add new range), `DROP PARTITION` (remove partition + data instantly), `TRUNCATE PARTITION` (delete data, keep partition), `REORGANIZE PARTITION` (split/merge partitions), `REBUILD/REPAIR PARTITION`. These operations are metadata-only (no data copy) for `DROP` and `TRUNCATE`.
- **Difficulty:** Advanced
- **Dependencies:** 8.1 Range partitioning, 8.15 Partition switching

## Dependency Graph
**Depends on:** "8.1 Range partitioning", "8.15 Partition switching"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **DROP PARTITION**: Instant metadata operation. Removes partition and its data. No DELETE overhead. Best for data archival.; - **TRUNCATE PARTITION**: Removes data within partition. Partition structure remains.; - **REORGANIZE PARTITION**: Splits one partition into two or merges two into one. `ALTER TABLE ... REORGANIZE PARTITION p2023 INTO (PARTITION p2023a ..., PARTITION p2023b ...)`. Copies data between partitions.; - **ADD PARTITION**: Adds new partition at the end (range) or adds new partition..
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