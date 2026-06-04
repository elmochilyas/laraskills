# 7-18 Pgbouncer Modes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-18 |
| Knowledge Unit Title | Pgbouncer Modes |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 10.3 PgBouncer | 10.4 Connection pooling |
| Last Updated | 2026-06-02 |

## Overview

PgBouncer is a PostgreSQL connection pooler. Three modes: session (connection held for entire session — least efficient), transaction (connection returned to pool after transaction ends — recommended), statement (connection returned after each statement — fastest but limited by SET requirements). Transaction pooling is the standard for web applications.

---

## Core Concepts

- **Session pooling**: Client holds connection until disconnect. Same as persistent connections. Max connections = pool size.
- **Transaction pooling**: Client gets a connection for one transaction. Connection returned to pool on COMMIT/ROLLBACK. Efficient. Doesn't support session-level features (SET SESSION, LISTEN/NOTIFY, prepared statements).
- **Statement pooling**: Connection returned after each statement. Rarely used.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Transaction pooling for Laravel**: Default `pgbouncer` config in Laravel. Use `'options' => ['pdo_options' => [PDO::ATTR_EMULATE_PREPARES => true]]` to avoid prepared statement issues.
- **Session pooling for long-running queries**: Reporting/analytics connections may need session pooling. Dedicated pgbouncer instance for reports.


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
| 1 | Prepared statements with transaction pooling**: Prepared statements are session-level. Create on each connection — fails in transaction mode. `ATTR_EMULATE_PREPARES` solves this. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

