# 7-8 Connection Pooling Replicas

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-8 |
| Knowledge Unit Title | Connection Pooling Replicas |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 7.9 Load balancing replicas | 10.4 Connection pooling |
| Last Updated | 2026-06-02 |

## Overview

Each PHP-FPM worker or Octane request holds a connection to a read replica. With N workers × M replicas, connection count adds up. Connection pooling (via ProxySQL, pgbouncer, or Octane's connection pool) limits concurrent connections to replicas, preventing replica overload during traffic spikes.

---

## Core Concepts

- **Per-worker connection**: 50 PHP-FPM workers × 3 replicas = up to 150 connections to replica pool. Each replica handles 50 concurrent connections.
- **Connection pool limit**: Max connections per replica (MySQL: `max_connections`, PostgreSQL: `max_connections`). Pool shares limited connections across many workers.
- **Queue wait**: When all pool connections are busy, requests queue. Queue timeout: return error or fall back to primary.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **ProxySQL connection pool**: Route read traffic through ProxySQL. ProxySQL maintains a persistent connection pool to replicas. PHP connects to ProxySQL, not directly to replicas.
- **Octane connection pool**: Octane's `PDOConnectionPool` maintains a configurable number of connections per replica per worker.


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
| 1 | No connection pooling for high-traffic apps**: 200 workers × 3 replicas = 600 connections. Each replica's `max_connections` may be 150. Connection pooling reduces to 150 total shared connections. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

