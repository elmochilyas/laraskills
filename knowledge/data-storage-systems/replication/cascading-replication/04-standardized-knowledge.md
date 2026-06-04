# 7-12 Cascading Replication

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-12 |
| Knowledge Unit Title | Cascading Replication |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.1 Master-replica topology | 7.10 Multi-region replication |
| Last Updated | 2026-06-02 |

## Overview

Cascading replication: a replica replicates from another replica (not directly from the primary). Reduces load on the primary (fewer direct replica connections). Used for multi-region: region-A replica → region-B replica → region-C replica. Adds replication lag at each level.

---

## Core Concepts

- **Chained topology**: Primary → Replica A → Replica B → Replica C. A replicates from primary. B replicates from A. C replicates from B.
- **Lag accumulation**: Each hop adds network RTT + apply time. 3-hop chain: 3x the lag of a direct replica.
- **Primary load reduction**: Primary handles only one replica connection instead of many. Reduces binlog dump overhead.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Cascade for read scaling**: Primary → 1-2 direct replicas → each serves 10 downstream replicas. Primary's binlog dump is limited.
- **Multi-region cascade**: Primary in us-east-1 → replica in us-west-2 → replica in ap-southeast-1. Each region has its own downstream replicas.


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
| 1 | Deep cascade chains (>3 levels)**: High lag, complex failure diagnosis. Each intermediate replica failure breaks all downstream replicas. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

