# 7-10 Multi Region Replication

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-10 |
| Knowledge Unit Title | Multi Region Replication |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 7.5 Replica lag | 7.11 Failover | 5.23 Multi-region tenant placement |
| Last Updated | 2026-06-02 |

## Overview

Multi-region replication maintains replicas in different geographic regions for read latency optimization and disaster recovery. Cross-region latency (50-200ms) causes higher replication lag. Async replication is standard — the primary doesn't wait for cross-region replicas. Use-cases: serve reads from nearest region, DR failover, data residency compliance.

---

## Core Concepts

- **Cross-region latency**: Physical distance adds propagation delay. US-West to US-East: ~40ms. US to Europe: ~100ms. US to Asia: ~150-200ms.
- **Replication lag across regions**: Lag = network round-trip + apply time. Typically 1-5 seconds for cross-region async replication.
- **DR (disaster recovery)**: Cross-region replica serves as failover target if primary region goes down.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Active-passive multi-region**: Primary in us-east-1. Replica in eu-west-1 serves reads. Failover promotes eu-west-1 replica to primary.
- **Active-active (multi-primary)**: Multiple writable regions with bidirectional replication. Conflict resolution required. Complex.


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
| 1 | Expecting low lag on cross-region replicas**: 100ms RTT means minimum 100ms lag. Add apply time: 200ms-5s typical. Design for eventual consistency. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

