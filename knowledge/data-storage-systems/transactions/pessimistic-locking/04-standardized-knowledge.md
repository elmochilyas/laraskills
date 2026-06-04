# 9-15 Pessimistic Locking

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-15 |
| Knowledge Unit Title | Pessimistic Locking |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 9.5 Row-level locks | 9.14 Optimistic locking |
| Last Updated | 2026-06-02 |

## Overview

Pessimistic locking explicitly acquires locks on rows before modifying them. Eloquent methods: `sharedLock()` (shared lock — SELECT ... FOR SHARE), `lockForUpdate()` (exclusive lock — SELECT ... FOR UPDATE). Prevents other transactions from modifying the locked rows. Use when conflicts are expected and retry is expensive.

---

## Core Concepts

- **sharedLock()**: `Model::where(...)->sharedLock()->get()` — adds `LOCK IN SHARE MODE` (MySQL) or `FOR SHARE` (PostgreSQL). Shared lock: others can read but not update/delete.
- **lockForUpdate()**: `Model::where(...)->lockForUpdate()->get()` — adds `FOR UPDATE`. Exclusive lock: others cannot update, delete, or SELECT FOR UPDATE on locked rows.
- **Lock release**: All locks released on COMMIT or ROLLBACK. Holding locks for minimum duration is critical.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Read-update cycle with lockForUpdate**: `DB::transaction(fn() => [$order = Order::lockForUpdate()->find($id), $order->update(...)])` — prevents concurrent modification.
- **Queue job with lockForUpdate**: Worker locks job row before processing. Prevents duplicate processing.


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
| 1 | Pessimistic locking for read-only operations**: Plain SELECT doesn't need locks. Locks block other transactions unnecessarily. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

