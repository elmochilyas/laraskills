# 9-10 Lock Wait Timeout

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-10 |
| Knowledge Unit Title | Lock Wait Timeout |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 9.8 Deadlock detection | 9.5 Row-level locks |
| Last Updated | 2026-06-02 |

## Overview

Lock wait timeout controls how long a transaction waits for a lock before giving up. MySQL: `innodb_lock_wait_timeout` (default 50s). PostgreSQL: `deadlock_timeout` (default 1s) and `lock_timeout` (default 0 = no timeout). Timeouts prevent transactions from waiting indefinitely for blocked locks.

---

## Core Concepts

- **innodb_lock_wait_timeout**: MySQL. Time (seconds) a transaction waits for a row/table lock. After timeout, MySQL rolls back the waiting transaction (not the lock holder).
- **deadlock_timeout**: PostgreSQL. Time to wait before checking for deadlock. Not a lock wait timeout per se — checks for deadlock after this duration.
- **lock_timeout**: PostgreSQL (v9.6+). `SET lock_timeout = '5s'` — transaction fails if a lock is not acquired within this time.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Lower timeout for interactive queries**: `innodb_lock_wait_timeout = 5` for user-facing queries. User gets error quickly instead of waiting 50s.
- **Higher timeout for batch jobs**: Batch processing (reporting, backfill) may need longer lock wait times.


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
| 1 | Default 50s timeout for web requests**: If a lock is held, the web request waits 50s before failing. User sees a 50s timeout. Lower to 5-10s. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

