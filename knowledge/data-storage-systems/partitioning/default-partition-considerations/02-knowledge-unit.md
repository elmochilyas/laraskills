# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.13 Default partition considerations (catch-all partition risks)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

A default/catch-all partition (`VALUES LESS THAN (MAXVALUE)` or `VALUES IN (DEFAULT)`) catches rows that don't match any defined partition. Dangerous: if a new value appears but no partition exists for it, the default partition grows unbounded. Missed partition addition = hot default partition degrading performance.

---

# Core Concepts

- **MAXVALUE partition**: `PARTITION p_future VALUES LESS THAN (MAXVALUE)` — last partition. Catches all data beyond defined ranges.
- **DEFAULT list partition**: `PARTITION p_other VALUES IN (DEFAULT)` — catches unmatched values for list partitioning.
- **Unbounded growth**: If you forget to add a partition for 2025, all 2025 data goes into MAXVALUE partition. It becomes the hot partition.

---

# Patterns

**No default partition**: Do not define MAXVALUE. Instead, pre-create partitions N periods ahead. If data arrives for an unpartitioned range, the INSERT fails — immediately alerts you to add the partition.

**Monitor default partition size**: If you must use default, monitor its row count. Alert if it exceeds expected fraction of total data.

---

# Common Mistakes

**MAXVALUE partition as "set and forget"**: "I'll add partitions later" → default grows for months. Partition pruning becomes useless. All queries scan the giant default.

---

# Related Knowledge Units

8.1 Range partitioning | 8.2 List partitioning
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

