# 9-12 Nested Transactions Savepoints

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-12 |
| Knowledge Unit Title | Nested Transactions Savepoints |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 9.13 Transaction length |
| Related KUs | 9.11 Transaction scoping |
| Last Updated | 2026-06-02 |

## Overview

Laravel supports nested transactions via database savepoints. Inner `DB::transaction()` creates a savepoint (not a true nested transaction). On inner rollback, only the changes since the savepoint are undone. On inner commit, changes are still pending until the outer transaction commits. Supported by InnoDB and PostgreSQL.

---

## Core Concepts

- **Savepoint**: A marker within a transaction. `SAVEPOINT sp1`. `ROLLBACK TO SAVEPOINT sp1` — rolls back to the savepoint, keeping earlier transaction changes.
- **Laravel nesting**: `DB::transaction(fn() => DB::transaction(...))` — outer creates transaction, inner creates savepoint. Inner rollback doesn't abort outer.
- **Transaction count**: `DB::transactionLevel()` — 0 = no transaction, 1 = outer, 2 = inner (savepoint).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Partial rollback within a batch**: Process 100 items in a transaction. If item 50 fails, rollback to savepoint (items 1-49 preserved), skip item 50, continue.
- **Service-level transaction composition**: Service A calls `DB::transaction()`. Service B also calls `DB::transaction()`. When composed, B uses savepoint within A's transaction.


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
| 1 | Assuming inner transaction is fully independent**: Inner "commit" doesn't persist data. Only the outer COMMIT persists everything. Understand savepoint semantics. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

