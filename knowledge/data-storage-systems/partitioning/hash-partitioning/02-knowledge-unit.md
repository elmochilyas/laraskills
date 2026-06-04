# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.3 Hash partitioning (BY HASH, BY KEY for even distribution)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Hash partitioning distributes rows across partitions via a hash function on the partition key. `PARTITION BY HASH (id) PARTITIONS 8`. Provides even distribution without ranges. Useful when the partition key has high cardinality but no natural range. No partition pruning for range queries on the hash key.

---

# Core Concepts

- **Even distribution**: `MOD(hash(key), N)` assigns rows to N partitions. Without natural skew, each partition gets ~1/N of rows.
- **No pruning for range**: `WHERE id BETWEEN 100 AND 200` cannot prune — must scan all partitions. Hash partitioning is not suitable for range-heavy queries.
- **MySQL BY KEY**: Uses MD5 hash. Similar to HASH but handles NULL values consistently.

---

# Patterns

**Hash partition for write scaling**: Distribute write load across partitions. Each partition acts like a smaller table for writes/inserts.

**Hash + range composite**: Hash partition by `user_id` (16 partitions) for write distribution. Range subpartition by `created_at` for archiving.

---

# Common Mistakes

**Adding/removing hash partitions**: Changing `PARTITIONS N` requires rebuilding all data. Choose partition count carefully.

---

# Related Knowledge Units

8.1 Range partitioning | 8.2 List partitioning | 8.4 Composite partitioning
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

