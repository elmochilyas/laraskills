# 6-19 Shard Proxy Considerations

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-19 |
| Knowledge Unit Title | Shard Proxy Considerations |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 6.5 Shard routing | 6.7 Fan-out queries | 10.4 Connection pooling |
| Last Updated | 2026-06-02 |

## Overview

Shard proxies (ProxySQL, Vitess, pgcat) sit between application and sharded databases. They handle query routing, connection pooling, read/write splitting, and some cross-shard query support. Vitess provides full SQL parsing and distributed query execution. ProxySQL provides intelligent connection routing and query rewriting.

---

## Core Concepts

- **ProxySQL**: MySQL proxy. Rule-based query routing, connection pooling, query caching, query rewriting. Can route queries by regex match on query text.
- **Vitess**: Full distributed database system. Horizontal sharding, automatic shard management, resharding, distributed queries (scatter/gather). VTGate + VTTablet architecture.
- **pgcat**: PostgreSQL proxy. Connection pooling, read/write splitting, sharding (PASS THROUGH). Lighter than Vitess.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **ProxySQL for connection pooling + routing**: Route reads to replicas, writes to primary. Shard routing via regex on query patterns.
- **Vitess for multi-shard queries**: Vitess handles fan-out, cross-shard joins, distributed transactions. Application writes simple SQL.


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
| 1 | Proxy as single point of failure**: Proxy must be highly available (ProxySQL cluster, Vitess with multiple VTGates). Proxy failure = total database outage. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

