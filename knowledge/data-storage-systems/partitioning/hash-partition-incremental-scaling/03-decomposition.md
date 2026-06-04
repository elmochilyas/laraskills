# Decomposition: 8.12 Hash partition count and incremental scaling

## Topic Overview
Hash partition count must be chosen carefully — changing it later requires rebuilding the table. Choose a power of 2 (16, 32, 64) to enable future merging/splitting. Pre-partition for maximum expected growth.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-12-hash-partition-incremental-scaling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.12 Hash partition count and incremental scaling
- **Purpose:** Hash partition count must be chosen carefully — changing it later requires rebuilding the table. Choose a power of 2 (16, 32, 64) to enable future merging/splitting.
- **Difficulty:** Advanced
- **Dependencies:** 8.3 Hash partitioning, 8.14 Partition backup/restore

## Dependency Graph
**Depends on:** "8.3 Hash partitioning", "8.14 Partition backup/restore"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Power of 2 count**: 2, 4, 8, 16, 32, 64, 128. Enables easy partition rebalancing: merge 2 into 1, split 1 into 2.; - **Pre-partition for growth**: If you expect 100M rows, choose partition count so each partition stays under 10M rows. 16 partitions → 6.25M each. Adequate.; - **Changing partition count**: MySQL: `ALTER TABLE ... PARTITION BY HASH (key) PARTITIONS N` — rebuilds entire table. Plan for no changes..
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