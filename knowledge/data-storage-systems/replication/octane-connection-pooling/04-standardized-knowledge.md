# 7-14 Octane Connection Pooling

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-14 |
| Knowledge Unit Title | Octane Connection Pooling |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.8 Connection pooling replicas | 9.9 Octane connection configuration |
| Last Updated | 2026-06-02 |

## Overview

Laravel Octane maintains persistent database connections across requests. Read replica connections in Octane benefit from connection pooling: fewer `connect()` calls, lower per-request latency, controlled connection count. Octane's `PDOConnectionPool` manages configurable min/max connections per replica per worker.

---

## Core Concepts

- **Persistent connections**: Octane worker starts, connects to replicas, keeps connections alive across requests. No connect/disconnect per request.
- **PDOConnectionPool**: Octane 2.x+ includes connection pooling. Pool size per replica: `'pool' => ['min' => 2, 'max' => 10]`.
- **Connection reuse**: Worker holds connections to replicas. If PHP-FPM: connect per request. Octane: connect once per worker lifetime.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Pool sizing**: `min` = expected concurrent connections (average requests per worker). `max` = burst capacity. For 8 concurrent requests, min=4, max=8.
- **Read replica pool config**: `'mysql' => ['driver' => 'mysql', 'pool' => ['min' => 2, 'max' => 5], 'read' => ['host' => [...]]'`.


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
| 1 | No pool config in Octane**: Octane without pooling creates a new connection per request. Same overhead as PHP-FPM. Always configure pool. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

