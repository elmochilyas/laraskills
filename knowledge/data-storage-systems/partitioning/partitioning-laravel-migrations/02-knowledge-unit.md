# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.9 Partitioning in Laravel migrations (syntax, limitations)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Laravel migrations support partition syntax via raw SQL in `DB::statement()`. No native partition builder in Laravel Schema Builder. Partition-related migration commands: `DB::statement('ALTER TABLE ... PARTITION BY RANGE ...')` after table creation. Partition management (ADD/DROP) also via raw SQL.

---

# Core Concepts

- **Create table with partitions**: `Schema::create('orders', function ($table) { ... });` then `DB::statement('ALTER TABLE orders PARTITION BY RANGE ...')`.
- **Partition management migrations**: `DB::statement('ALTER TABLE orders ADD PARTITION ...')` in up(). `DB::statement('ALTER TABLE orders DROP PARTITION ...')` in down().
- **MySQL requirement**: Partition must be declared at table creation or via `ALTER TABLE ... PARTITION BY`. Cannot partition an existing non-partitioned table without rebuilding.

---

# Patterns

**Partition migration template**: `up()` creates table and applies partitioning. `down()` drops table (no partition cleanup needed).

**Partition management in separate migrations**: One migration per partition addition. Tracked in schema. Rollback drops the partition.

---

# Common Mistakes

**Partitioning after data exists**: `ALTER TABLE ... PARTITION BY ...` locks table and rebuilds data. For large tables, use pt-online-schema-change or gh-ost.

---

# Related Knowledge Units

8.1 Range partitioning | 8.6 Partition management | 1.13 Migration structure
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

