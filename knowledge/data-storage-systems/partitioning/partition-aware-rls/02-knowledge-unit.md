# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.17 Partition-aware Row-Level Security (PostgreSQL)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

PostgreSQL supports RLS policies on partitioned tables. RLS policies defined on the parent table automatically apply to all partitions. Partition pruning respects RLS — PostgreSQL prunes partitions first, then applies RLS. Combining RLS + partitioning provides both security isolation and data lifecycle management.

---

# Core Concepts

- **RLS propagation**: `CREATE POLICY tenant_policy ON orders USING (tenant_id = current_setting('app.tenant_id')::int)` — applies to all partitions of `orders`.
- **Partition pruning with RLS**: PostgreSQL prunes partitions using the partition key before evaluating RLS. A user querying `WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31'` scans only January 2024 partition, then RLS filters tenant.
- **Performance**: RLS does not prevent partition pruning. Pruning operates on the partition key, RLS operates on the partition's rows.

---

# Patterns

**Partitioning + RLS for multi-tenant + retention**: Partition by month for archival. RLS by tenant_id for isolation. Both work independently.

**RLS on detached partitions**: Detached partition is a standalone table. RLS policy no longer applies. Re-attach to reapply RLS.

---

# Common Mistakes

**Assuming RLS bypasses pruning**: RLS evaluates per-row. Partition pruning still applies. Best: query includes both partition key and tenant_id for optimal performance.

---

# Related Knowledge Units

5.14 PostgreSQL RLS | 8.5 Partition pruning
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

