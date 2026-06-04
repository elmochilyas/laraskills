# 7-11 Replica Promotion Failover

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-11 |
| Knowledge Unit Title | Replica Promotion Failover |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 7.1 Master-replica topology | 7.5 Replica lag | 7.12 Cascading replication |
| Last Updated | 2026-06-02 |

## Overview

Failover promotes a replica to primary when the current primary fails. Manual: ops team runs `ALTER TABLE ...`, updates DNS, Laravel config. Automated: orchestrator (Orchestrator, RDS Multi-AZ, Patroni) handles promotion, VIP reassignment, and app routing update. RPO (Recovery Point Objective) and RTO (Recovery Time Objective) determine failover strategy.

---

## Core Concepts

- **Manual failover**: Ops identifies failure, promotes replica (`SET GLOBAL read_only = OFF`), updates application config/connections, restarts workers. RTO: 5-30 minutes.
- **Automated failover**: Orchestrator detects primary failure, promotes the most advanced replica, reassigns VIP. RTO: 10-60 seconds.
- **RPO**: Data loss during failover. Async: up to N seconds of writes. Semi-sync: zero data loss.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Automated failover for production**: Use Orchestrator (MySQL) or Patroni (PostgreSQL). Test failover monthly. Verify app reconnects correctly.
- **Manual failover for maintenance**: Planned switchover (not failover). Used for primary upgrades. Demote primary, promote replica, update config.


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
| 1 | No failover testing**: Failover works in theory. Test it. Monthly failover drills. Verify app reconnects without manual config changes. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

