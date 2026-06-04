# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.4 Composite partitioning (subpartitioning, range-hash, range-list)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Composite (sub)partitioning uses two levels: the table is partitioned by one strategy, and each partition is further subpartitioned. `PARTITION BY RANGE (YEAR(created_at)) SUBPARTITION BY HASH (user_id) SUBPARTITIONS 4`. Combines benefits: range for lifecycle management, hash for even write distribution.

---

# Core Concepts

- **Level 1**: Primary partition strategy (typically range by date). Handles lifecycle (archival of old ranges).
- **Level 2**: Subpartition strategy (typically hash or list). Distributes writes within the current range partition.
- **Partition maintenance**: Operations apply at the primary partition level. `DROP PARTITION p2020` drops all subpartitions for that range.

---

# Patterns

**Range-hash composite**: Range by month (12 per year), hash by user_id (4 per month). Even write distribution across 48 subpartitions. Drop old months as one operation.

**Range-list composite**: Range by year, list by status. Year partition contains active and archive subpartitions.

---

# Common Mistakes

**Excessive subpartitions**: N primary × M sub = N×M total. MySQL max 8192 total. 12 primary × 4 sub = 48. Manageable.

---

# Related Knowledge Units

8.1 Range partitioning | 8.3 Hash partitioning | 8.6 Partition management
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

