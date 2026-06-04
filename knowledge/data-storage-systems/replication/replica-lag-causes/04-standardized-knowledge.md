# 7-5 Replica Lag Causes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-5 |
| Knowledge Unit Title | Replica Lag Causes |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 7.6 Lag monitoring | 7.7 Lag-aware read splitting |
| Last Updated | 2026-06-02 |

## Overview

Replica lag is the delay between a write on the primary and its appearance on the replica. Common causes: long-running transactions holding binlog position, DDL operations (ALTER TABLE) blocking replication, write bursts exceeding replica apply capacity, undersized replicas, and network latency between primary and replica.

---

## Core Concepts

- **Long transactions**: `BEGIN ... UPDATE ... wait ... COMMIT`. The replica can't apply the transaction until it's committed on primary.
- **DDL operations**: `ALTER TABLE` on the primary runs on the replica after receiving the event. `LOCK=SHARED`, `ALGORITHM=INPLACE` on primary but `ALGORITHM=COPY` on replica.
- **Replica apply capacity**: If write rate on primary exceeds replica's CPU/IO capacity to replay binlog, lag grows indefinitely.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Monitor `Seconds_Behind_Master` (MySQL)** or `pg_current_wal_lsn() - pg_last_wal_receive_lsn()` (PostgreSQL). Alert if lag > threshold (e.g., 30s).
- **Throttle writes during replica lag**: If lag exceeds threshold, pause non-critical writes or reduce write throughput.


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
| 1 | Adding replicas without increasing capacity**: More replicas don't fix lag if the primary is the bottleneck. Fix the primary first. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

