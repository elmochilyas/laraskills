# 7-7 Lag Aware Read Splitting

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-7 |
| Knowledge Unit Title | Lag Aware Read Splitting |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 7.5 Replica lag | 7.6 Lag monitoring | 7.10 Multi-region replication |
| Last Updated | 2026-06-02 |

## Overview

Lag-aware read splitting monitors replica lag and routes reads to the primary if lag exceeds a threshold. If replica is > 5s behind, serve stale-sensitive queries from primary. Provides read scaling during normal operation and automatic fallback to primary during replication issues.

---

## Core Concepts

- **Lag threshold**: Define max acceptable lag per query type. User-facing queries: 1-2s. Reporting queries: 30-60s. Analytics: no limit.
- **Lag check frequency**: Check lag every N seconds (not per-query). Cache lag value in memory/Redis for 1-5s. Avoids per-query lag check overhead.
- **Query classification**: Tag queries as "lag-sensitive" (user profile, order status) or "lag-tolerant" (reports, search results).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Custom DB connector**: Extend Laravel's `MySqlConnection`. In `select()`, check cached lag. If lag > threshold, use write PDO for this query.
- **Permission-based routing**: `DB::connection('mysql::read')->select(...)` — if lag exceeds threshold, this falls back to write. Service layer decides per query.


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
| 1 | Checking lag on every query**: `SHOW REPLICA STATUS` itself adds load. Cache lag value and refresh at most every 1-5 seconds. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

