# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.15 Partition switching (exchanging partitions with tables for zero-downtime archival)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Partition switching (`ALTER TABLE ... EXCHANGE PARTITION WITH TABLE`) atomically replaces a partition's data with an external table. The external table becomes the partition, and the partition becomes a standalone table. Used for zero-downtime archival: exchange old partition with an archive table, then drop or compress the old table.

---

# Core Concepts

- **EXCHANGE PARTITION**: `ALTER TABLE orders EXCHANGE PARTITION p2024 WITH TABLE orders_2024_archive`. Instant metadata operation. No data copy.
- **Requirements**: Both tables must have identical structure (same columns, indexes, storage engine). The external table must be empty (for exchange) or have matching row structure.
- **Use cases**: Instant archival (swap partition to archive table), data migration (load new data into a staging table, swap into partition).

---

# Patterns

**Monthly archival**: (1) Create archive table. (2) `EXCHANGE PARTITION p202401 WITH TABLE orders_202401_archive`. (3) Archive table is now standalone. (4) Drop or compress.

**Data loading**: (1) Load data into staging table. (2) Validate. (3) `EXCHANGE PARTITION p_new WITH TABLE staging`. Instant availability.

---

# Common Mistakes

**Exchange with non-matching structure**: Columns, indexes, storage engine must be identical. CHECK FOR MORE careful. Must match exactly.

---

# Related Knowledge Units

8.1 Range partitioning | 8.6 Partition management | 8.14 Backup/restore
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

