# 9-20 Transaction Retry Logic

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-20 |
| Knowledge Unit Title | Transaction Retry Logic |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 9.8 Deadlock detection | 9.11 Transaction scoping |
| Last Updated | 2026-06-02 |

## Overview

Serialization failures (deadlock, SSI conflict, lock wait timeout) require transaction retry. Laravel's `DB::transaction()` does NOT automatically retry. Implement retry wrapper: catch error codes (1213/40001), wait with exponential backoff, retry up to N times. Retry count, delay, and jitter prevent thundering herd.

---

## Core Concepts

- **Retryable errors**: MySQL deadlock (1213), PostgreSQL serialization_failure (40001), lock wait timeout (1205). These don't indicate data corruption — just timing.
- **Retry with backoff**: 3 attempts, wait 100ms, 200ms, 400ms. Random jitter (±20ms) prevents all retries firing simultaneously.
- **Non-retryable errors**: Syntax error, constraint violation, FK error. These will fail on every retry. Do not retry.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Retry macro**: `DB::transactionWithRetry(fn() => ..., 3)`. Macro wraps `DB::transaction()` with catch-rety logic. Returns result or throws.
- **Transaction middleware**: Middleware wraps controller actions in retryable transaction. Catches serialization failures, retries the entire request.


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
| 1 | Infinite retry**: Retrying forever on a deadlock caused by a bug. Always limit retries to 3-5. After max retries, fail and alert. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

