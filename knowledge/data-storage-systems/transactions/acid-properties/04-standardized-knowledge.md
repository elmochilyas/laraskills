# 9-1 Acid Properties

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-1 |
| Knowledge Unit Title | Acid Properties |
| Difficulty Level | Foundational |
| Classification | F |
| Dependencies | 9.2 Isolation levels | 9.11 Transaction scoping in Laravel |
| Last Updated | 2026-06-02 |

## Overview

ACID guarantees define transaction reliability. Atomicity: all or nothing. Consistency: data remains valid. Isolation: concurrent transactions don't interfere. Durability: committed data survives failures. InnoDB (MySQL) and PostgreSQL implement ACID with varying tradeoffs between isolation strength and performance.

---

## Core Concepts

- **Atomicity**: Transaction commits or rolls back fully. `BEGIN` + `COMMIT` or `ROLLBACK`. Partial failure → rollback entire transaction.
- **Consistency**: Constraints, cascades, triggers maintain data invariants. Application-level consistency (business logic) + database-level (FK, CHECK, UNIQUE).
- **Isolation**: Levels control visibility of uncommitted changes: READ UNCOMMITTED → SERIALIZABLE. Higher isolation = fewer anomalies, lower concurrency.
- **Durability**: `COMMIT` ensures data is written to persistent storage (redo log, WAL). fsync guarantees.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Short transactions for high concurrency**: Minimize lock holding time. Do reads, compute, write inside the transaction. Minimize duration.
- **Consistency via database constraints**: Use FK, CHECK, UNIQUE to enforce data invariants at database level, not just application.


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
| 1 | Confusing ACID consistency with application consistency**: ACID consistency only checks constraints. Business invariants (e.g., "balance must not go negative") require CHECK or application logic. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

