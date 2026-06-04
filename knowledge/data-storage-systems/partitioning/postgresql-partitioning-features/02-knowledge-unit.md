# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.11 PostgreSQL partitioning features (declarative partitioning, table inheritance)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

PostgreSQL supports declarative partitioning (PARTITION BY RANGE/LIST/HASH) since v10 and native partitioning for subpartitioning since v13. Global indexes are supported (unlike MySQL). Partition pruning is sophisticated, including dynamic pruning via parameterized queries. Table inheritance (legacy partitioning) is deprecated.

---

# Core Concepts

- **Declarative partitioning**: `CREATE TABLE orders (...) PARTITION BY RANGE (created_at)`. Partitions are separate tables: `CREATE TABLE orders_2024 PARTITION OF orders FOR VALUES FROM ('2024-01-01') TO ('2025-01-01')`.
- **Global indexes**: `CREATE INDEX ON orders(user_id)` — single B-tree index across all partitions. Works without partition key in WHERE.
- **Partition-wise JOIN**: PostgreSQL can join matching partitions directly (v12+). Reduces JOIN overhead for partitioned tables.

---

# Patterns

**Partition pruning with global index**: Query by `user_id` without date range uses the global index for fast lookup. Best of both worlds.

**Partition detachment**: `ALTER TABLE orders DETACH PARTITION orders_2020` — retains data as standalone table. Re-attachable.

---

# Common Mistakes

**Using table inheritance instead of declarative partitioning**: Legacy approach. Not recommended. Declarative is more performant and feature-rich.

---

# Related Knowledge Units

8.1 Range partitioning | 8.8 Partition indexes
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

