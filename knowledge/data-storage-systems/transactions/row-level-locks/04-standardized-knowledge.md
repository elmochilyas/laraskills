# 9-5 Row Level Locks

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-5 |
| Knowledge Unit Title | Row Level Locks |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 9.1 ACID | 9.15 Pessimistic locking |
| Last Updated | 2026-06-02 |

## Overview

Row-level locks explicitly lock selected rows for update or share. `SELECT ... FOR UPDATE` (exclusive lock — other transactions can't read/write locked rows). `SELECT ... FOR SHARE` (shared lock — others can read but not write). `SKIP LOCKED` skips locked rows (return only unlocked rows). `NOWAIT` fails immediately if row is locked (no waiting).

---

## Core Concepts

- **FOR UPDATE**: Exclusive row lock. No other transaction can SELECT FOR UPDATE, UPDATE, or DELETE the row. Plain SELECT still reads (MVCC).
- **FOR SHARE** (MySQL 8.0+: `FOR SHARE`, previously `LOCK IN SHARE MODE`): Shared lock. Other transactions can read but not update/delete. Blocks FOR UPDATE.
- **SKIP LOCKED** (MySQL 8.0+, PostgreSQL 9.5+): Skip any rows that are locked. Returns only unlocked rows. No waiting.
- **NOWAIT**: Return error immediately if any selected row is locked. No waiting.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Job queue with SKIP LOCKED**: `SELECT * FROM jobs ORDER BY priority LIMIT 10 FOR UPDATE SKIP LOCKED` — workers grab next available jobs without contention.
- **Atomic counter with FOR UPDATE**: Lock the row, read current value, increment, UPDATE, COMMIT. Prevents race conditions.


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
| 1 | Missing FOR UPDATE in critical read-update sequences**: Two concurrent requests read the same balance, both add $10, both save. Balance increases by $10 only once. Always lock. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

