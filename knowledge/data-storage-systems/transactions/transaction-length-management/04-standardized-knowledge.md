# 9-13 Transaction Length Management

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-13 |
| Knowledge Unit Title | Transaction Length Management |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 9.11 Transaction scoping | 9.19 Long-running transaction risks |
| Last Updated | 2026-06-02 |

## Overview

Long transactions hold locks for extended duration, increasing deadlock probability and reducing concurrency. Rule: keep transactions as short as possible — acquire locks, do the minimal work, commit. Move pre-computation before BEGIN and post-processing after COMMIT.

---

## Core Concepts

- **Lock duration**: Locks acquired at row-level lock statement (SELECT FOR UPDATE) or row modification (UPDATE/DELETE). Released at COMMIT/ROLLBACK.
- **Transaction length = lock holding time**: Longer transaction = more contention. One slow operation in a transaction blocks others.
- **Non-database operations in transaction**: HTTP calls, file I/O, external API calls inside a transaction — lock held during network latency.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Outside → transaction → outside**: Compute required data, start transaction, execute minimal SQL, commit, do post-processing.
- **Read outside, write inside**: Read current state before transaction (no lock). Check conditions. Inside transaction: re-read with FOR UPDATE, verify, update.


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
| 1 | External API call inside transaction**: Lock held for 500ms API call. Other transactions wait. API timeout → lock held for 30s. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

