# 9-16 Phantom Reads Vs Non Repeatable

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-16 |
| Knowledge Unit Title | Phantom Reads Vs Non Repeatable |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 9.2 Isolation levels | 9.17 SSI | 9.18 Write skew |
| Last Updated | 2026-06-02 |

## Overview

Non-repeatable read: same row, different value on re-read (another transaction updated it). Phantom read: same query, different set of rows on re-read (another transaction inserted/deleted rows). REPEATABLE READ prevents non-repeatable reads but may allow phantoms (depends on implementation). SERIALIZABLE prevents both.

---

## Core Concepts

- **Non-repeatable read**: T1 reads balance = 100. T2 updates balance to 200, commits. T1 reads balance again → 200. Same row, different value.
- **Phantom read**: T1: `SELECT COUNT(*) FROM orders WHERE status = 'pending'` → 5. T2 inserts a pending order, commits. T1 re-executes → 6. Different row count.
- **Prevention per DB**: PostgreSQL REPEATABLE READ prevents both via snapshot isolation. MySQL REPEATABLE READ prevents non-repeatable via MVCC, prevents phantoms in SELECT ... FOR UPDATE via next-key locks.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Phantom prevention with range locks**: `SELECT ... WHERE status = 'pending' FOR UPDATE` — InnoDB locks the gap, preventing INSERT of new pending orders.
- **Snapshot for consistent read (PostgreSQL)**: REPEATABLE READ guarantees consistent view of all data. No phantoms, no non-repeatable reads.


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
| 1 | Assuming REPEATABLE READ prevents all anomalies**: REPEATABLE READ does not prevent serialization anomalies (write skew). Only SERIALIZABLE prevents all. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

