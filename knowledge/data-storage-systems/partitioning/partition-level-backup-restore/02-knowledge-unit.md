# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.14 Partition-level backup and restore
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Partition-level backup backs up individual partitions instead of the entire table. Faster backup/restore for large tables. `mysqldump` with `--where` clause to dump a specific partition. PostgreSQL can detach a partition into a standalone table and back it up. Enables granular archival and compliance-driven restore (single partition recovery).

---

# Core Concepts

- **MySQL partition dump**: `mysqldump --where="1=1 AND PARTITION(p2024)"` — dumps data for specific partition. Or select from partition: `SELECT * FROM orders PARTITION (p2024)`.
- **PostgreSQL partition backup**: Detach partition: `ALTER TABLE orders DETACH PARTITION orders_2024`. Back up the standalone table. Re-attach if needed.
- **Partial restore**: Restore a single partition's data without affecting other partitions.

---

# Patterns

**Archival backup**: Before `DROP PARTITION`, take a mysqldump or pg_dump of that partition. Store in cold storage (Glacier, S3 Glacier). Compliance record.

**Granular restore**: User requests data from 3 years ago. Restore the partition backup for that date range. No need to restore entire table.

---

# Common Mistakes

**Backing up entire partitioned table weekly**: 90% of data is static. Only active partitions change. Back up active partitions daily, archived partitions once.

---

# Related Knowledge Units

8.6 Partition management | 8.15 Partition switching
## Ecosystem Usage

MySQL 8.0 supports RANGE, LIST, HASH, KEY, and composite partitioning. PostgreSQL supports declarative partitioning. Laravel creates partitions via raw SQL.

## Failure Modes

Partition pruning fails when queries don't include the partition key. Excessive partitions cause metadata overhead. Hash partition data skew from poor hash function.

## Performance Considerations

Partition pruning eliminates irrelevant partitions from query scan. Range partitioning enables partition-level DROP for instant archival.

## Production Considerations

Monitor partition count growth. Implement partition rotation schedules. Use partition switching for bulk data loads. Back up individual partitions.

## Research Notes

MySQL 8.0.13+ supports non-blocking REORGANIZE PARTITION. PostgreSQL 12+ provides FK support for partitions.

## Internal Mechanics

MySQL stores each partition as a separate tablespace file. Partition pruning happens at query planning time. PostgreSQL uses declarative partitioning.

## Architectural Decisions

RANGE for time-series. LIST for discrete categories. HASH for even distribution. KEY for auto-hash on PK.

## Tradeoffs

Benefit: Fast partition elimination. Cost: Complex DDL management. Benefit: Instant partition drop. Cost: Maximum partition limit of 8192 in MySQL.

## Mental Models

Partitions are sub-tables stored separately but presented as one. Think of partitions as drawers in a filing cabinet.

