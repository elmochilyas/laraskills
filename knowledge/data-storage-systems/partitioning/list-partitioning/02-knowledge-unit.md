# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.2 List partitioning (BY LIST, list of values per partition)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

List partitioning assigns rows to partitions based on a discrete value list. `PARTITION BY LIST (status) (PARTITION p_active VALUES IN ('active', 'pending'), PARTITION p_inactive VALUES IN ('inactive', 'deleted'))`. Useful for partitioning by category, region, status — columns with a small set of known values.

---

# Core Concepts

- **Explicit value list**: Each partition specifies which values belong. `VALUES IN ('value1', 'value2')`.
- **Default partition**: `PARTITION p_other VALUES IN (DEFAULT)` — catches unmatched values. Use with caution (can grow unbounded).
- **No range overlap**: A row's value must match exactly one partition's list.

---

# Patterns

**Status-based partitioning**: Active records in one partition (hot), archived in another (cold). Hot partition stays small, queries are faster.

**Multi-region partitioning**: `PARTITION BY LIST (region)`. European data in one partition, US in another. Useful for data locality.

---

# Common Mistakes

**List partitioning on high-cardinality columns**: 10,000 values need 10,000 partition definitions. Not practical. Use range or hash for high-cardinality columns.

---

# Related Knowledge Units

8.1 Range partitioning | 8.3 Hash partitioning | 8.13 Default partition
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

