# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.6 Partition management (ADD, DROP, TRUNCATE, REORGANIZE, REPAIR)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Partition management operations: `ADD PARTITION` (add new range), `DROP PARTITION` (remove partition + data instantly), `TRUNCATE PARTITION` (delete data, keep partition), `REORGANIZE PARTITION` (split/merge partitions), `REBUILD/REPAIR PARTITION`. These operations are metadata-only (no data copy) for `DROP` and `TRUNCATE`. `REORGANIZE` copies data.

---

# Core Concepts

- **DROP PARTITION**: Instant metadata operation. Removes partition and its data. No DELETE overhead. Best for data archival.
- **TRUNCATE PARTITION**: Removes data within partition. Partition structure remains.
- **REORGANIZE PARTITION**: Splits one partition into two or merges two into one. `ALTER TABLE ... REORGANIZE PARTITION p2023 INTO (PARTITION p2023a ..., PARTITION p2023b ...)`. Copies data between partitions.
- **ADD PARTITION**: Adds new partition at the end (range) or adds new partition.

---

# Patterns

**Partition rotation**: Monthly: `ALTER TABLE orders ADD PARTITION (PARTITION p202405 VALUES LESS THAN (TO_DAYS('2024-06-01')))`. Automate via scheduled event.

**Archive and drop**: After N months, `ALTER TABLE orders DROP PARTITION p202301`. Instant. Data gone.

---

# Common Mistakes

**ADD PARTITION for non-range partitions**: Cannot ADD PARTITION to hash-partitioned tables without REORGANIZE. Pre-plan hash partition count.

---

# Related Knowledge Units

8.1 Range partitioning | 8.15 Partition switching
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

