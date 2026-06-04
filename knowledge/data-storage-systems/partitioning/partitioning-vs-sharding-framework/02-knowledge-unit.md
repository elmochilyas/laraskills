# Metadata

Domain: Data & Storage Systems
Subdomain: Table Partitioning & Data Lifecycle
Knowledge Unit: 8.18 Partitioning vs. sharding decision framework
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Partitioning and sharding both split data horizontally. Choose partitioning when: single server can hold the data, need lifecycle management (archival), queries can prune by partition key. Choose sharding when: data exceeds single server capacity, write throughput exceeds single server, need geographic distribution. Partitioning is within a server; sharding is across servers.

---

# Core Concepts

- **Choose partitioning**: Data fits on one server. Retention/archival is primary driver. Queries consistently include partition key. Need global indexes (PostgreSQL).
- **Choose sharding**: Data doesn't fit on one server. Write throughput exceeds one server. Need geographic data distribution. Accept cross-shard query complexity.
- **Combine both**: Shard by user_id across servers. Within each shard, partition by month for archival.

---

# Patterns

**Partitioning-first approach**: Start with partitioning on a single server. When the server is outgrown, migrate to sharding. Partitioning prepares you for sharding (data splitting experience).

**Shard + partition**: For tables that need both horizontal write scaling and lifecycle management. Shard key for distribution, partition key for retention.

---

# Common Mistakes

**Premature sharding when partitioning suffices**: 100GB table on a 2TB-capable server. Sharding adds complexity. Partitioning alone handles lifecycle management.

---

# Related Knowledge Units

6.22 Shard vs partition | 8.1 Range partitioning | 6.1 Shard key
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

