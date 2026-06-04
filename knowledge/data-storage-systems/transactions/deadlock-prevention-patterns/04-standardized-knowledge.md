# 9-9 Deadlock Prevention Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-9 |
| Knowledge Unit Title | Deadlock Prevention Patterns |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 9.5 Row-level locks | 9.8 Deadlock detection |
| Last Updated | 2026-06-02 |

## Overview

Deadlock prevention strategies: consistent lock ordering (always lock table A before B), use indexes to narrow lock ranges (without index, entire table may be locked), keep transactions short, and avoid user interaction within transactions. Prevention is better than detection — retries add latency and complexity.

---

## Core Concepts

- **Consistent ordering**: If Transaction 1 locks user then order, Transaction 2 must also lock user then order. Prevents cyclic lock waits.
- **Index-based locking**: `UPDATE orders SET status = ? WHERE user_id = ? AND created_at < ?` with index on `(user_id, created_at)` locks specific rows. Without index, locks all examined rows (gap locks).
- **Short transactions**: Minimize time between first lock and COMMIT. Do all computation before starting the transaction.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Ordered lock access**: Always acquire locks in the same application-defined order. Enforce via a LockManager service.
- **Batch processing with SKIP LOCKED**: `SELECT ... FOR UPDATE SKIP LOCKED` — process unlocked rows. Never blocks waiting for locked rows.


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
| 1 | User interaction within transaction**: "Press OK to confirm purchase" while transaction holds locks. User walks away for 5 minutes. Locks held. Deadlock/FK conflict for other transactions. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

