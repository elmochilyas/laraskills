# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.12 Hash partition count and incremental scaling
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Hash partition count must be chosen carefully — changing it later requires rebuilding the table. Choose a power of 2 (16, 32, 64) to enable future merging/splitting. Pre-partition for maximum expected growth. Incremental scaling: start with 16 partitions, merge pairs when table grows, or split when hot.

---

# Core Concepts

- **Power of 2 count**: 2, 4, 8, 16, 32, 64, 128. Enables easy partition rebalancing: merge 2 into 1, split 1 into 2.
- **Pre-partition for growth**: If you expect 100M rows, choose partition count so each partition stays under 10M rows. 16 partitions → 6.25M each. Adequate.
- **Changing partition count**: MySQL: `ALTER TABLE ... PARTITION BY HASH (key) PARTITIONS N` — rebuilds entire table. Plan for no changes.

---

# Patterns

**Conservative hash count**: Start with 16 partitions for most tables. Increase only if monitoring shows individual partition size is problematic.

**Partition merging**: `ALTER TABLE ... REORGANIZE PARTITION p0,p1 INTO (PARTITION p0 VALUES ...)` — merges two partitions into one.

---

# Common Mistakes

**Too few hash partitions**: 2 partitions for a table that grows to 50M rows. Each partition becomes too large. Pre-partition with growth margin.

---

# Related Knowledge Units

8.3 Hash partitioning | 8.14 Partition backup/restore
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

