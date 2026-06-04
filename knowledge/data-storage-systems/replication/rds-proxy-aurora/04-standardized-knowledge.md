# 7-19 Rds Proxy Aurora

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-19 |
| Knowledge Unit Title | Rds Proxy Aurora |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 7.8 Connection pooling replicas | 10.5 Serverless connection handling |
| Last Updated | 2026-06-02 |

## Overview

RDS Proxy (MySQL/PostgreSQL) and Aurora handle connection multiplexing at the AWS infrastructure level. They pool connections, handle failover transparently, and reduce database load from many short-lived connections. Particularly useful for Lambda (cold start connections) and serverless applications.

---

## Core Concepts

- **Connection multiplexing**: RDS Proxy maintains a small pool of persistent connections to the database. Many client connections share these pooled connections.
- **Failover handling**: RDS Proxy detects primary failover, reconnects to new primary transparently. Application doesn't see connection errors during failover.
- **IAM authentication**: RDS Proxy supports AWS IAM authentication. No database passwords in application config.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **RDS Proxy + Lambda**: Lambda functions create many short connections. RDS Proxy pools them. Prevents connection storms during traffic spikes.
- **Aurora Auto Scaling**: Aurora replicas scale automatically. RDS Proxy distributes read traffic across available replicas.


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
| 1 | RDS Proxy cost**: RDS Proxy has ~$15/month cost per instance. For a single small database, direct connection may be cheaper. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

