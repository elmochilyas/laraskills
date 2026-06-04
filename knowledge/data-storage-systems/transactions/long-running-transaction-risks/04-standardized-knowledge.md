# 9-19 Long Running Transaction Risks

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-19 |
| Knowledge Unit Title | Long Running Transaction Risks |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 9.13 Transaction length | 9.11 Transaction scoping |
| Last Updated | 2026-06-02 |

## Overview

Long-running transactions cause: MVCC bloat (accumulation of dead rows that VACUUM can't remove), replication lag (replicas can't apply WAL until transaction commits), lock escalation (some DBs escalate row locks to table locks), and connection pool exhaustion. Monitor transaction duration and alert on transactions exceeding thresholds.

---

## Core Concepts

- **MVCC bloat**: PostgreSQL keeps dead row versions visible to long-running transactions. VACUUM can't remove them. Table grows, index performance degrades.
- **Replication lag**: Long-running transaction holds back WAL清理 (PostgreSQL) or binlog position advance (MySQL). Replicas can't advance past this position.
- **Lock escalation**: InnoDB escalates row locks to table lock if > 40% of rows are locked. Long transactions accumulating row locks risk escalation.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Transaction duration monitoring**: Log start and end times. Alert if duration > 5 seconds. Kill transactions > 60 seconds (application-level timeout).
- **Batch commits**: For processing 10K rows, commit every 100 rows. Avoids one giant transaction.


## Architecture Guidelines

- READ COMMITTED: No phantom protection, possible write skew, lowest cost. REPEATABLE READ: Phantom protection in MySQL, possible write skew, medium cost. SERIALIZABLE: Full protection, highest cost.

## Performance Considerations

- Transaction length affects lock contention and MVCC cleanup. PostgreSQL autovacuum must clean dead tuples. Transaction pooling breaks multi-statement transactions.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | One transaction for entire batch operation**: `BEGIN; UPDATE 1000000 rows; COMMIT` — MVCC bloat, lock duration, rollback risk. Batch into 1000-row chunks. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Deadlocks from two transactions holding locks the other needs. Phantom reads at READ COMMITTED. Write skew at non-SERIALIZABLE levels. Long transactions cause MVCC bloat.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Transaction Management Concurrency
- **Closely Related**: Other KUs within Transaction Management Concurrency
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

