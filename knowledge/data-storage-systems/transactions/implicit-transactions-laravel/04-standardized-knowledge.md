# 9-21 Implicit Transactions Laravel

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-21 |
| Knowledge Unit Title | Implicit Transactions Laravel |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 9.11 Transaction scoping | 9.13 Transaction length |
| Last Updated | 2026-06-02 |

## Overview

Some Laravel operations implicitly start transactions: model events dispatchers (saved, created, updated), the `DB::listen` query logger, and some package operations (Laravel Horizon, Telescope writes). Understanding implicit transactions prevents unexpected lock holding and transaction nesting.

---

## Core Concepts

- **Model events inside transaction**: `Model::saved` event fires inside the same transaction as the save. If the event listener throws, the entire save rolls back.
- **DB::listen**: The query logger does not start a transaction. It just logs queries.
- **Package writes**: Horizon (monitoring data) and Telescope (incoming request dumps) write to their own tables. These may or may not be transactional depending on configuration.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Queue jobs after model save**: If a model save triggers a queue job dispatch inside its `saved` event, the job is not dispatched until the transaction commits. `AfterCommit` job: `dispatch()->afterCommit()`.
- **Event listener in transaction**: Keep event listeners fast. If they might throw (API call failure), the entire model transaction rolls back.


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
| 1 | Long-running event listener in saved event**: `User::saved` fires an email send. Email takes 5 seconds. User save transaction holds locks for 5 seconds. Use queued listeners. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

