# 7-17 Proxysql Query Routing

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-17 |
| Knowledge Unit Title | Proxysql Query Routing |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.2 Read/write config | 7.8 Connection pooling replicas | 6.19 Shard proxy |
| Last Updated | 2026-06-02 |

## Overview

ProxySQL sits between Laravel and MySQL, routing queries based on rules. Read/write split rules: regex match SELECT queries → route to read hostgroup. All other queries → write hostgroup. ProxySQL also provides connection pooling, query caching, and firewall rules.

---

## Core Concepts

- **Hostgroups**: Define `mysql_servers` with hostgroup IDs. hostgroup 0 = writers, hostgroup 1 = readers.
- **Query rules**: `SELECT ^SELECT.*→ hostgroup 1`. Rules evaluated top-down. First match wins. `^SELECT... FOR UPDATE` → hostgroup 0.
- **Connection pooling**: ProxySQL maintains persistent connections to MySQL. Laravel connects to ProxySQL via standard MySQL client.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Default rule**: Insert rule at lowest priority: `^SELECT.*FOR UPDATE` → hostgroup 0 (write). `^SELECT` → hostgroup 1 (read). Default → hostgroup 0.
- **User-based routing**: Route specific application users to specific hostgroups. Admin queries to write, user queries to read.


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
| 1 | No FOR UPDATE handling**: `SELECT ... FOR UPDATE` must go to write. Without specific rule, it routes to read replica, causing stale locks. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

