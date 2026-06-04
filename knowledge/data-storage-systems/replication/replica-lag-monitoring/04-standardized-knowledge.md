# 7-6 Replica Lag Monitoring

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-6 |
| Knowledge Unit Title | Replica Lag Monitoring |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.5 Replica lag causes | 7.7 Lag-aware read splitting |
| Last Updated | 2026-06-02 |

## Overview

MySQL `SHOW REPLICA STATUS` provides `Seconds_Behind_Master` (SBM) — seconds the replica is behind. Not reliable during replication errors or with long transactions. `pt-heartbeat` provides precise lag measurement by updating a timestamp on the primary and comparing on the replica.

---

## Core Concepts

- **Seconds_Behind_Master**: Calculated from binlog position difference. Can show 0 even when replica hasn't processed events (relay log gap).
- **pt-heartbeat**: Percona Toolkit tool. Updates `heartbeat` table on primary every second. Replica reads its local heartbeat row and computes lag = primary_time - replica_time. Accurate.
- **PostgreSQL lag**: `pg_current_wal_lsn() - pg_last_wal_receive_lsn()` gives bytes behind. `pg_last_xact_replay_timestamp()` gives timestamp lag.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **pt-heartbeat for production monitoring**: Run `pt-heartbeat --update` on primary, `pt-heartbeat --monitor` on replicas. Script output to monitoring system.
- **Lag alerting**: Alert if lag > 30s for MySQL, > 10s for synchronous-sensitive workloads.


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
| 1 | Relying solely on Seconds_Behind_Master**: During network issues, SBM may show 0 while replica hasn't received new events. Use pt-heartbeat. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

