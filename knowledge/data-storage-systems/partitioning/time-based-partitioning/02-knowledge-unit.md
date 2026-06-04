# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.7 Time-based partitioning (daily, weekly, monthly, quarterly)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Time-based partitioning creates partitions aligned to calendar intervals. Daily for high-volume time series (logs, events). Monthly for transactional data (orders). Quarterly for archives. The partition key is always a timestamp/date column. Automated partition creation via scheduled events or cron jobs.

---

# Core Concepts

- **Interval selection**: Daily → 365 partitions/year. Monthly → 12/year. Quarterly → 4/year. Partition count affects MySQL's 8192 max.
- **Pre-creation**: Create partitions in advance (e.g., create next 6 months of partitions on the 1st of each month).
- **Partition naming convention**: `pYYYYMMDD`, `pYYYYMM`, `pYYYYQN`. Consistent naming enables automated partition management scripts.

---

# Patterns

**Monthly partitions with pre-creation**: Schedule a monthly job (cron, MySQL EVENT) to `ALTER TABLE ... ADD PARTITION` for the next month. Check and create 2-3 months ahead.

**Partition retention policy**: `DROP PARTITION` for data older than retention period. Automate: delete partitions older than N months.

---

# Common Mistakes

**Daily partitions for low-volume tables**: 365 partitions/year for a table that gets 100 rows/day. Partition overhead > benefit. Use monthly.

---

# Related Knowledge Units

8.1 Range partitioning | 8.6 Partition management | 8.16 Data retention
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

