# 9-2 Isolation Levels

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-2 |
| Knowledge Unit Title | Isolation Levels |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 9.3 PostgreSQL isolation specifics | 9.4 MySQL InnoDB specifics |
| Last Updated | 2026-06-02 |

## Overview

Four SQL standard isolation levels control what concurrent transactions can see. READ UNCOMMITTED (dirty reads). READ COMMITTED (no dirty reads — PostgreSQL default). REPEATABLE READ (no non-repeatable reads — MySQL InnoDB default). SERIALIZABLE (no anomalies — may use SSI or pessimistic locking). Higher isolation = fewer anomalies, more blocking/locks.

---

## Core Concepts

- **Dirty read**: Read uncommitted data from another transaction. Only READ UNCOMMITTED allows this.
- **Non-repeatable read**: Read the same row twice in a transaction; another transaction modified it between reads. READ COMMITTED allows this.
- **Phantom read**: A query returns different rows on re-execution (new rows inserted by another transaction). REPEATABLE READ in PostgreSQL prevents this via snapshot isolation.
- **Serialization anomaly**: Two concurrent transactions produce results that couldn't happen in any serial order. Only SERIALIZABLE prevents this.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **READ COMMITTED for most production workloads**: Good balance of consistency and concurrency. PostgreSQL default. MySQL default is REPEATABLE READ.
- **REPEATABLE READ for strict consistency**: When you must have consistent reads within a transaction. MySQL default.


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
| 1 | Using SERIALIZABLE "for safety"**: SERIALIZABLE significantly reduces throughput (more conflicts, retries). Use only when anomalies at REPEATABLE READ-level are unacceptable. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

