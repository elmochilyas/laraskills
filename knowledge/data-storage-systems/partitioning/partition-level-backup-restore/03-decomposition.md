# Decomposition: 8.14 Partition-level backup and restore

## Topic Overview
Partition-level backup backs up individual partitions instead of the entire table. Faster backup/restore for large tables. `mysqldump` with `--where` clause to dump a specific partition.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-14-partition-level-backup-restore/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.14 Partition-level backup and restore
- **Purpose:** Partition-level backup backs up individual partitions instead of the entire table. Faster backup/restore for large tables.
- **Difficulty:** Advanced
- **Dependencies:** 8.6 Partition management, 8.15 Partition switching

## Dependency Graph
**Depends on:** "8.6 Partition management", "8.15 Partition switching"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **MySQL partition dump**: `mysqldump --where="1=1 AND PARTITION(p2024)"` — dumps data for specific partition. Or select from partition: `SELECT * FROM orders PARTITION (p2024)`.; - **PostgreSQL partition backup**: Detach partition: `ALTER TABLE orders DETACH PARTITION orders_2024`. Back up the standalone table. Re-attach if needed.; - **Partial restore**: Restore a single partition's data without affecting other partitions..
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