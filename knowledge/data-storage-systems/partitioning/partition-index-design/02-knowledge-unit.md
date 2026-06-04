# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.8 Partition index design (local vs. global indexes in MySQL/PostgreSQL)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

MySQL partitioned tables have only local indexes (index per partition, each index covers only the partition's data). PostgreSQL supports both local and global indexes. Local indexes are partitioned in tandem with the table. Global indexes span all partitions. MySQL has no global index support for partitioned tables (the index itself is partitioned).

---

# Core Concepts

- **Local index (MySQL/PostgreSQL)**: Index exists independently per partition. Query must prune to benefit from index — if all partitions are scanned, all indexes are probed.
- **Global index (PostgreSQL only)**: Single index across all partitions. Supports efficient queries without partition pruning. Maintenance cost: every insert/update touches the global index.
- **MySQL limitation**: All indexes on a partitioned table are effectively local. The partition key must be part of every unique index (MySQL requirement).

---

# Patterns

**Local index for pruned queries**: If queries always filter by partition key (e.g., `WHERE created_at >= ? AND user_id = ?`), local indexes (one per partition) are efficient.

**Global index for unpruned lookups**: PostgreSQL-only. `WHERE user_id = ?` without partition key. Global B-tree enables fast lookup.

---

# Common Mistakes

**MySQL unique index without partition key**: MySQL requires that every unique index on a partitioned table includes all partition key columns.

---

# Related Knowledge Units

8.5 Partition pruning | 3.10 Index types
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

