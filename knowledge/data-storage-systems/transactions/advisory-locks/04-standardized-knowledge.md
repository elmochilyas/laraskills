# 9-7 Advisory Locks

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-7 |
| Knowledge Unit Title | Advisory Locks |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 9.5 Row-level locks | 9.11 Transaction scoping |
| Last Updated | 2026-06-02 |

## Overview

PostgreSQL advisory locks are application-level locks managed by the database but not tied to any table row. `pg_advisory_lock(key)` — exclusive. `pg_advisory_lock_shared(key)` — shared. Released at transaction end or explicitly via `pg_advisory_unlock`. Used for coordinating operations across processes/workers.

---

## Core Concepts

- **Session-level lock**: `pg_advisory_lock(key)` — held until session ends or explicitly unlocked. Must explicitly unlock.
- **Transaction-level lock**: `pg_advisory_xact_lock(key)` — held until transaction ends. Automatically released on COMMIT/ROLLBACK.
- **Use cases**: Prevent concurrent job processing, coordinate backup operations, enforce sequential processing of specific resources.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Queue worker coordination**: `pg_advisory_lock(job_id)` — only one worker processes a job. Other workers skip or wait. Better than `GET_LOCK()` in MySQL.
- **Rate-limited external API calls**: Advisory lock by API resource ID. Only one worker calls the API for that resource at a time.


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
| 1 | Not unlocking session-level locks**: Session holds the lock until disconnect. If the script dies, lock remains. Prefer transaction-level locks. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

