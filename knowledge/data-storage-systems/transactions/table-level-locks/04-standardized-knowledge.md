# 9-6 Table Level Locks

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-6 |
| Knowledge Unit Title | Table Level Locks |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 9.5 Row-level locks | 9.11 Transaction scoping |
| Last Updated | 2026-06-02 |

## Overview

Table-level locks (`LOCK TABLES orders WRITE`, `LOCK TABLES orders READ`) block all other sessions from accessing the table. WRITE lock: exclusive — no other session can read or write. READ lock: shared — others can read but not write. Serious concurrency impact. Rarely needed in InnoDB (row-level locks suffice). Used in MyISAM or specific DDL operations.

---

## Core Concepts

- **LOCK TABLES ... WRITE**: Only the locking session can read/write. All other sessions wait. Blocks all queries against the table.
- **LOCK TABLES ... READ**: Locking session and others can read. No writes allowed.
- **DDL implication**: `ALTER TABLE`, `DROP TABLE` take an exclusive metadata lock. Does not require explicit `LOCK TABLES`. The lock is implicit.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Avoid LOCK TABLES in InnoDB**: Row-level locking provides better concurrency. Use `SELECT ... FOR UPDATE` for write locks on specific rows.
- **LOCK TABLES for bulk operations**: When you must ensure zero concurrent access during a multi-step operation. Rare use case.


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
| 1 | Using LOCK TABLES in InnoDB**: MySQL documentation advises against it. InnoDB auto-deadlocks on LOCK TABLES + row locks. Use transactions + FOR UPDATE. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

