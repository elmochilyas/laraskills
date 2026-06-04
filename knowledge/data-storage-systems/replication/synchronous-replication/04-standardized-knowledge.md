# 7-13 Synchronous Replication

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-13 |
| Knowledge Unit Title | Synchronous Replication |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.1 Master-replica topology | 7.11 Failover |
| Last Updated | 2026-06-02 |

## Overview

Synchronous replication: all nodes must acknowledge a write before it commits. Galera Cluster (MariaDB/Percona XtraDB Cluster) and MySQL Group Replication implement this. Provides strong consistency and zero data loss. Cost: write latency is the slowest node's acknowledgment time. Quorum-based: if more than half of nodes fail, writes stop.

---

## Core Concepts

- **Certification-based replication**: All nodes receive the write, certify it (check for conflicts), commit simultaneously. If certification fails on any node, the write is rolled back.
- **Quorum**: Cluster requires > N/2 nodes to accept writes. 3-node cluster: tolerate 1 failure. 5-node: tolerate 2 failures. Split-brain prevention.
- **Write latency**: = max(node_ack_latency). In a 3-node cluster spanning 2 regions, write latency = cross-region round trip.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Galera for zero-data-loss clusters**: Use when every write must be acknowledged by multiple nodes. Finance, compliance-critical apps.
- **Group Replication for MySQL 8.0**: Built-in. Multi-primary or single-primary mode. Similar guarantees to Galera.


## Architecture Guidelines

- Async MySQL binlog replication: zero write impact, seconds of data loss risk. Sync PostgreSQL replication: higher write latency, zero data loss. Aurora storage replication: minimal write impact, zero data loss.

## Performance Considerations

- Synchronous replication increases write latency but guarantees zero data loss. Asynchronous replication allows read scaling at the cost of eventual consistency.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Wide-area Galera cluster**: 3 nodes across 3 continents. Write latency = 300ms+. Use local sync for HA, async for cross-region. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Read-after-write inconsistency from replication lag. Stale reads from replicas under heavy write loads. Connection pooling with transaction pooling breaks session state.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Replication Read Write Splitting
- **Closely Related**: Other KUs within Replication Read Write Splitting
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

