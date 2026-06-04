# 9-3 Postgresql Isolation Specifics

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-3 |
| Knowledge Unit Title | Postgresql Isolation Specifics |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 9.2 Isolation levels | 9.17 Serializable snapshot isolation |
| Last Updated | 2026-06-02 |

## Overview

PostgreSQL implements SERIALIZABLE via Serializable Snapshot Isolation (SSI) — optimistic, detects conflicts via predicate locking. REPEATABLE READ uses snapshot isolation (SI) — read-only, no locks, detects conflicts on first write. READ COMMITTED also uses snapshots per statement. PostgreSQL's MVCC never blocks reads.

---

## Core Concepts

- **SSI (SERIALIZABLE)**: PostgreSQL v9.1+. Uses SIREAD locks (predicate-based) to detect serialization anomalies. Retry on serialization failure: `40001`.
- **Snapshot isolation (REPEATABLE READ)**: Transaction sees a snapshot of data at start. Modifications from other transactions are invisible. Write-write conflicts cause abort on first write.
- **No phantom reads in REPEATABLE READ**: PostgreSQL's snapshot isolation prevents phantoms (unlike MySQL, which prevents phantoms only in InnoDB REPEATABLE READ via next-key locks).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **SSI for financial transactions**: Use SERIALIZABLE when concurrent invariants must be guaranteed (e.g., total must equal sum). Handle serialization failures with retry logic.
- **REPEATABLE READ for reporting snapshot**: Run reports in REPEATABLE READ — consistent view of data at a point in time.


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
| 1 | SSI without retry**: SSI aborts one transaction on conflict. Application must retry. Not handling serialization_failure (40001) causes data loss. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

