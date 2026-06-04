# 6-22 Shard Vs Partition Distinction

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-22 |
| Knowledge Unit Title | Shard Vs Partition Distinction |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 6.1 Shard key selection | 8.1 Table partitioning |
| Last Updated | 2026-06-02 |

## Overview

Sharding = horizontal splitting across servers. Partitioning = horizontal splitting within a single database. Sharding solves server-level scaling (more data than one server can hold). Partitioning solves table-level management (archival, query pruning). They are complementary — a partitioned table can exist on a shard.

---

## Core Concepts

- **Shard**: A complete database server (or replica set). Independent CPU, memory, storage, network. Data split across servers.
- **Partition**: A division within a single database (MySQL `PARTITION BY RANGE`, PostgreSQL `PARTITION BY RANGE`). Same server.
- **Key difference**: Shards are independent failure domains and compute resources. Partitions share the same server resources.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Shard + partition**: Shard by `user_id`. Within each shard, partition `orders` by `created_at` for archival. Each partition drop is fast (metadata only).
- **Partition first, shard later**: Start with partitioning on a single server. When the server is outgrown, shard across multiple servers.


## Architecture Guidelines

- Hash sharding for even distribution (full remap on N change). Range sharding for efficient range scans (range splitting needed). Directory sharding for flexible routing (simple remap).

## Performance Considerations

- Fan-out queries issue N parallel queries bounded by the slowest shard. Shard key selection determines query locality. Connection management must account for total connections across shards.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Using "sharding" and "partitioning" interchangeably**: They solve different problems at different scales. Clear terminology matters for architecture decisions. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Cross-shard queries fan-out to all shards multiplying execution time. Cross-shard transactions are impossible with distributed XA. Hot shards from uneven distribution cause bottlenecks.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Database Sharding & Horizontal Scaling
- **Closely Related**: Other KUs within Database Sharding & Horizontal Scaling
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

