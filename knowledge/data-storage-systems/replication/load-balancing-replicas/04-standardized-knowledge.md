# 7-9 Load Balancing Replicas

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-9 |
| Knowledge Unit Title | Load Balancing Replicas |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 7.2 Read/write config | 7.8 Connection pooling replicas |
| Last Updated | 2026-06-02 |

## Overview

Laravel's default read replica selection is random per query. Better strategies: round-robin (distributes evenly), least connections (routing to least busy replica), or weighted (larger replicas get more traffic). Implemented via ProxySQL, custom DB connector, or Octane connection pool.

---

## Core Concepts

- **Random (Laravel default)**: `'read' => ['host' => ['r1', 'r2', 'r3']]` — random pick per query. Simple but can skew.
- **Round-robin**: Distributes uniformly. Good for equal-sized replicas.
- **Least connections**: Routes to replica with fewest active queries. Best for heterogeneous replicas.
- **Weighted**: Larger replicas get proportionally more requests. Requires ProxySQL or custom routing.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **ProxySQL for weighted balancing**: Configure `mysql_servers` with weight. ProxySQL handles query distribution.
- **Round-robin for equal replicas**: Simple to implement in Laravel connector. Good enough for balanced loads.


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
| 1 | Uneven replica sizing with random balancing**: A smaller replica receives the same traffic as larger ones and becomes the bottleneck. Use weighted balancing. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

