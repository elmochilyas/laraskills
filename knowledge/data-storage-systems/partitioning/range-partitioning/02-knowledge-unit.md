# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.1 Range partitioning (BY RANGE, RANGE COLUMNS in MySQL)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Range partitioning divides a table into partitions by column value ranges. Most common for date-based partitioning: `PARTITION BY RANGE (YEAR(created_at)) (PARTITION p2023 VALUES LESS THAN (2024), ...)`. Enables partition pruning (querying only relevant partitions) and efficient old-data archival via partition drop.

---

# Core Concepts

- **Range definition**: Each partition has `VALUES LESS THAN (value)`. Rows go to the first partition whose range includes their value.
- **Partition pruning**: Query `WHERE created_at BETWEEN '2024-01-01' AND '2024-03-01'` scans only partition(s) containing that date range.
- **MySQL RANGE COLUMNS**: `PARTITION BY RANGE COLUMNS(created_at)` — allows string, date, or multiple columns in range definition.

---

# Patterns

**Monthly partitioning**: `PARTITION BY RANGE (TO_DAYS(created_at)) (PARTITION p202401 VALUES LESS THAN (TO_DAYS('2024-02-01')), ...)`. 12 partitions per year.

**Archival by partition drop**: `ALTER TABLE orders DROP PARTITION p2020;` — instant metadata operation. No DELETE + vacuum.

---

# Common Mistakes

**Too many partitions**: MySQL max 8192 partitions per table. PostgreSQL max depends on implementation (thousands). 100-500 is practical.

---

# Related Knowledge Units

8.5 Partition pruning | 8.6 Partition management | 8.15 Partition switching
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

