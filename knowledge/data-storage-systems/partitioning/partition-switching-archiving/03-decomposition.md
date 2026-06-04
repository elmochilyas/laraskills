# Decomposition: 8.15 Partition switching (exchanging partitions with tables for zero-downtime archival)

## Topic Overview
Partition switching (`ALTER TABLE ... EXCHANGE PARTITION WITH TABLE`) atomically replaces a partition's data with an external table. The external table becomes the partition, and the partition becomes a standalone table.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-15-partition-switching-archiving/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.15 Partition switching (exchanging partitions with tables for zero-downtime archival)
- **Purpose:** Partition switching (`ALTER TABLE ... EXCHANGE PARTITION WITH TABLE`) atomically replaces a partition's data with an external table.
- **Difficulty:** Advanced
- **Dependencies:** 8.1 Range partitioning, 8.6 Partition management, 8.14 Backup/restore

## Dependency Graph
**Depends on:** "8.1 Range partitioning", "8.6 Partition management", "8.14 Backup/restore"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **EXCHANGE PARTITION**: `ALTER TABLE orders EXCHANGE PARTITION p2024 WITH TABLE orders_2024_archive`. Instant metadata operation. No data copy.; - **Requirements**: Both tables must have identical structure (same columns, indexes, storage engine). The external table must be empty (for exchange) or have matching row structure.; - **Use cases**: Instant archival (swap partition to archive table), data migration (load new data into a staging table, swap into partition)..
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