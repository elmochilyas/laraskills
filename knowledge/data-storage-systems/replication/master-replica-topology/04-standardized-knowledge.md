# 7-1 Master Replica Topology

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-1 |
| Knowledge Unit Title | Master Replica Topology |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 7.2 Laravel read/write config | 7.5 Replica lag causes |
| Last Updated | 2026-06-02 |

## Overview

Master-replica topology: one primary (write) node and one or more replica (read) nodes. Replication modes: asynchronous (default MySQL, low latency, possible data loss), semi-synchronous (at least one replica confirms), synchronous (all replicas confirm, highest durability). The mode determines data loss risk on primary failure.

---

## Core Concepts

- **Async replication**: Primary commits without waiting for replicas. Fastest writes. Risk: if primary fails before replica receives the write, data is lost.
- **Semi-sync replication**: Primary waits for at least one replica to confirm receipt. Zero data loss if configured with `rpl_semi_sync_master_wait_point=AFTER_SYNC`.
- **Sync replication**: Primary waits for all replicas to confirm. Slowest writes. Rarely used in production (Galera, PostgreSQL synchronous_commit).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Semi-sync for production**: Default for production workloads. Prevents data loss while keeping write latency manageable.
- **Async for read replicas**: Use async for replicas used only for reporting/analytics. Acceptable to serve slightly stale data.


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
| 1 | Async replication for critical data**: Primary fails before replica syncs → data loss. Use semi-sync for production writes. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

