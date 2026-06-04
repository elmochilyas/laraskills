# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.16 Data retention policies with partitioning (auto-drop old partitions)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Partitioning enables automated data retention: define retention period (e.g., 12 months), create a scheduled job that drops partitions older than retention. `DROP PARTITION` is instant. No DELETE, no VACUUM, no table bloat. The data literally disappears at the filesystem level.

---

# Core Concepts

- **Retention period**: Legal/regulatory requirement (GDPR: delete after N months). Business requirement (keep order history for 12 months).
- **Drop vs DELETE**: `DROP PARTITION` removes the partition filesystem directory. `DELETE` marks rows as deleted but doesn't reclaim space.
- **Scheduled execution**: MySQL EVENT or cron job runs monthly. `CALL drop_old_partitions('orders', 12)`. Stored procedure handles partition enumeration.

---

# Patterns

**Retention schedule**: Monthly cron: for each partitioned table, list partitions, calculate age from partition range, drop those older than retention.

**Graceful retention**: Don't drop immediately on the day — add a 7-day grace period. Archive to cold storage before dropping.

---

# Common Mistakes

**DELETE for data retention on large tables**: `DELETE FROM orders WHERE created_at < NOW() - INTERVAL 12 MONTH` — huge DELETE, table bloat, slow. Always use partition DROP.

---

# Related Knowledge Units

8.6 Partition management | 8.14 Partition backup/restore
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

