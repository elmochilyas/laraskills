# 8-11 Postgresql Partitioning Features

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-11 |
| Knowledge Unit Title | Postgresql Partitioning Features |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 8.1 Range partitioning | 8.8 Partition indexes |
| Last Updated | 2026-06-02 |

## Overview

PostgreSQL supports declarative partitioning (PARTITION BY RANGE/LIST/HASH) since v10 and native partitioning for subpartitioning since v13. Global indexes are supported (unlike MySQL). Partition pruning is sophisticated, including dynamic pruning via parameterized queries. Table inheritance (legacy partitioning) is deprecated.

---

## Core Concepts

- **Declarative partitioning**: `CREATE TABLE orders (...) PARTITION BY RANGE (created_at)`. Partitions are separate tables: `CREATE TABLE orders_2024 PARTITION OF orders FOR VALUES FROM ('2024-01-01') TO ('2025-01-01')`.
- **Global indexes**: `CREATE INDEX ON orders(user_id)` — single B-tree index across all partitions. Works without partition key in WHERE.
- **Partition-wise JOIN**: PostgreSQL can join matching partitions directly (v12+). Reduces JOIN overhead for partitioned tables.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Partition pruning with global index**: Query by `user_id` without date range uses the global index for fast lookup. Best of both worlds.
- **Partition detachment**: `ALTER TABLE orders DETACH PARTITION orders_2020` — retains data as standalone table. Re-attachable.


## Architecture Guidelines

- RANGE for time-series. LIST for discrete categories. HASH for even distribution. KEY for auto-hash on PK.

## Performance Considerations

- Partition pruning eliminates irrelevant partitions from query scan. Range partitioning enables partition-level DROP for instant archival.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Using table inheritance instead of declarative partitioning**: Legacy approach. Not recommended. Declarative is more performant and feature-rich. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Partition pruning fails when queries don't include the partition key. Excessive partitions cause metadata overhead. Hash partition data skew from poor hash function.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Table Partitioning Data Lifecycle
- **Closely Related**: Other KUs within Table Partitioning Data Lifecycle
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

