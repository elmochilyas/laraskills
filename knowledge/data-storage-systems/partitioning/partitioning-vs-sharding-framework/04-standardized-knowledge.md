# 8-18 Partitioning Vs Sharding Framework

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-18 |
| Knowledge Unit Title | Partitioning Vs Sharding Framework |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 6.22 Shard vs partition | 8.1 Range partitioning | 6.1 Shard key |
| Last Updated | 2026-06-02 |

## Overview

Partitioning and sharding both split data horizontally. Choose partitioning when: single server can hold the data, need lifecycle management (archival), queries can prune by partition key. Choose sharding when: data exceeds single server capacity, write throughput exceeds single server, need geographic distribution. Partitioning is within a server; sharding is across servers.

---

## Core Concepts

- **Choose partitioning**: Data fits on one server. Retention/archival is primary driver. Queries consistently include partition key. Need global indexes (PostgreSQL).
- **Choose sharding**: Data doesn't fit on one server. Write throughput exceeds one server. Need geographic data distribution. Accept cross-shard query complexity.
- **Combine both**: Shard by user_id across servers. Within each shard, partition by month for archival.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Partitioning-first approach**: Start with partitioning on a single server. When the server is outgrown, migrate to sharding. Partitioning prepares you for sharding (data splitting experience).
- **Shard + partition**: For tables that need both horizontal write scaling and lifecycle management. Shard key for distribution, partition key for retention.


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
| 1 | Premature sharding when partitioning suffices**: 100GB table on a 2TB-capable server. Sharding adds complexity. Partitioning alone handles lifecycle management. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

