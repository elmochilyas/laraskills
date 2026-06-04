# 9-8 Deadlock Detection Resolution

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-8 |
| Knowledge Unit Title | Deadlock Detection Resolution |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 9.9 Deadlock prevention | 9.20 Transaction retry logic |
| Last Updated | 2026-06-02 |

## Overview

Deadlock occurs when two transactions each hold a lock the other needs. MySQL InnoDB detects deadlocks via wait-for graph. InnoDB automatically rolls back the transaction that detected the deadlock (the one with the fewest locks). PostgreSQL detects deadlocks via timeout-based detection (deadlock_timeout).

---

## Core Concepts

- **InnoDB deadlock detection**: Runs when a transaction waits for a lock. Builds wait-for graph. If cycle detected, chooses victim transaction (rolls back, releases locks).
- **PostgreSQL deadlock timeout**: Doesn't actively detect. When a lock wait exceeds `deadlock_timeout` (default 1s), checks if waiting would cause a deadlock. If yes, aborts one transaction.
- **Deadlock error code**: MySQL: `1213 (40001)`, PostgreSQL: `40P01`. Both are serialization failures — retry the transaction.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Deadlock prevention**: Access tables/rows in consistent order (e.g., always update user first, then order). Reduces cyclic lock wait.
- **Retry on deadlock**: Laravel transaction helper does NOT automatically retry. Wrap in retry loop (3 attempts, exponential backoff).


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
| 1 | No deadlock retry logic**: `DB::transaction()` fails on deadlock. Transaction is rolled back. Without retry, the operation fails silently. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

