# 7-16 Read Replica Sizing

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-16 |
| Knowledge Unit Title | Read Replica Sizing |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.5 Replica lag | 7.8 Connection pooling replicas |
| Last Updated | 2026-06-02 |

## Overview

A replica must have sufficient CPU, IOPS, and memory to replay the primary's write volume. If replica capacity < primary write throughput, lag grows indefinitely. Rule of thumb: replica should have at least the primary's CPU/memory. For write-heavy workloads, replicas may need more IOPS than the primary.

---

## Core Concepts

- **Apply overhead**: Replica applies every write from the primary plus serves read queries. Total load on replica = replay load + read load.
- **Replay load**: Replica must have enough IOPS to write all binlog events + enough CPU to execute them. Log writes are sequential (easier on replicas).
- **Storage throughput**: Replicas need similar storage throughput as primary for binlog replay.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Same instance size for replicas**: Start with same size as primary. If replica lag persists, increase replica size before increasing primary.
- **Larger replicas for read-heavy workloads**: If replica serves 80% of reads, it needs more capacity than the primary. Right-size per workload.


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
| 1 | Under-provisioned replicas**: Small replicas fall behind during peak write hours. Lag accumulates, never catches up. Always match primary's spec minimally. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

