# 7-21 Replica Health Monitoring

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-21 |
| Knowledge Unit Title | Replica Health Monitoring |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.6 Replica lag monitoring | 7.11 Failover | 7.17 ProxySQL routing |
| Last Updated | 2026-06-02 |

## Overview

Replica health monitoring tracks: connection availability (can the app connect to the replica?), replication status (is the IO and SQL thread running?), data freshness (is lag within threshold?). Unhealthy replicas must be removed from the read pool to prevent serving errors or stale data.

---

## Core Concepts

- **Connection health**: Periodic connection test `SELECT 1`. If fails, mark replica as offline. Remove from read pool.
- **Replication thread status**: MySQL `SHOW REPLICA STATUS` → `Slave_IO_Running: Yes`, `Slave_SQL_Running: Yes`. If either is No, replication has stopped.
- **Data freshness**: `Seconds_Behind_Master` or `pt-heartbeat` lag. If > threshold (e.g., 60s), route reads to primary.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Health check middleware**: Every N seconds, probe all replicas. Update a shared health status (Redis, shared memory). Query routing reads from health status.
- **Degraded mode**: When all replicas are unhealthy, serve reads from primary. Degrade gracefully — slower reads but functional app.


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
| 1 | Serving stale data from unhealthy replica**: Replica's SQL thread stopped 2 hours ago. App still routes reads to it. Users see 2-hour-old data. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

