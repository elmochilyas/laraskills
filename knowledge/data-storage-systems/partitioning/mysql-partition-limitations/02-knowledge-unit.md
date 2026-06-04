# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.10 MySQL partition limitations (no FK support, unique key must include partition key, max 8192 partitions)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

MySQL partitioning has significant constraints: foreign keys are not supported on partitioned tables (cannot reference partitioned tables with FK), every unique index must include the partition key, and a maximum of 8192 partitions per table. These limitations often require architectural workarounds.

---

# Core Concepts

- **No foreign keys**: Partitioned tables cannot be referenced by or contain foreign keys. Workaround: application-level referential integrity or triggers.
- **Unique key restriction**: All columns in a unique index must be part of the partition key. `UNIQUE (user_id)` on a table partitioned by `created_at` is not allowed.
- **8192 partition limit**: Maximum total partitions across all partitioned tables on a MySQL instance. Practical limit: 500-1000 per table.

---

# Patterns

**Application-level referential integrity**: Instead of FK, use application logic to verify existence. Accept eventual consistency for reference data.

**Composite unique via partition key**: `UNIQUE (created_at, user_id)` — includes partition key. Works.

---

# Common Mistakes

**Creating FK on partitioned table**: MySQL silently ignores the FK or returns an error. Always remove FK references from partitioned table schemas.

---

# Related Knowledge Units

8.8 Partition indexes | 15.1 Foreign key constraints
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

