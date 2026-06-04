# 9-18 Write Skew Prevention

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-18 |
| Knowledge Unit Title | Write Skew Prevention |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 9.2 Isolation levels | 9.17 SSI |
| Last Updated | 2026-06-02 |

## Overview

Write skew: two transactions read the same overlapping data, both check a condition that is true individually, both write based on that condition. Individually consistent, collectively the invariant is violated. REPEATABLE READ does NOT prevent write skew. Only SERIALIZABLE or explicit locking prevents it.

---

## Core Concepts

- **Classic example**: Doctor on-call schedule. Two doctors check: "Is another doctor on call?" Both see none → both set themselves as on-call. Invariant: at least one doctor on call → violated.
- **Why REPEATABLE READ fails**: Each transaction reads a snapshot showing no conflicting data. Both writes succeed because they modify different rows. No lock conflict.
- **Prevention**: `SELECT ... FOR UPDATE` on related rows (pessimistic lock) or use SERIALIZABLE isolation level.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Explicit range lock**: `$onCall = Doctor::where('on_call', true)->lockForUpdate()->get(); if ($onCall->count() < 1) { $doctor->update(['on_call' => true]); }`. FOR UPDATE locks the relevant rows.
- **SERIALIZABLE isolation**: Simplest fix. Use SSI. Retry on serialization failure.


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
| 1 | Assuming SELECT + application check + UPDATE is safe**: Concurrent reads see the same state. Both pass the check. Both write. Invariant violated. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

