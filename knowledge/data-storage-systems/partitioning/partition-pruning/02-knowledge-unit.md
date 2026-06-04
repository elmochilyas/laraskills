# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.5 Partition pruning (how the optimizer eliminates irrelevant partitions)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Partition pruning is the optimizer's ability to scan only relevant partitions for a query. `WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01'` on a range-partitioned table scans 1 partition instead of all 12. Pruning requires the WHERE clause to reference the partition key with simple comparisons (>, <, BETWEEN, IN, =).

---

# Core Concepts

- **Static pruning**: Constant expression in WHERE: `created_at = '2024-01-15'` — optimizer knows exact partition at query plan time.
- **Dynamic pruning**: `WHERE user_id = ?` with parameter — pruning happens at execution time.
- **Conditions that prevent pruning**: Functions on the partition key (`YEAR(created_at)` in MySQL RANGE COLUMNS prevents pruning), OR conditions, subqueries.

---

# Patterns

**Verify pruning via EXPLAIN**: `EXPLAIN SELECT ...` shows `partitions` column. Should list only relevant partitions (not `ALL`).

**Partition key in WHERE**: Always include the partition key in WHERE for queries targeting a subset of data. Without it, all partitions scan.

---

# Common Mistakes

**Function wrapping partition key**: `WHERE YEAR(created_at) = 2024` — MySQL cannot prune with function wrapper. Use range comparison: `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`.

---

# Related Knowledge Units

8.1 Range partitioning | 4.5 EXPLAIN
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

