# 9-14 Optimistic Locking

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-14 |
| Knowledge Unit Title | Optimistic Locking |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 9.15 Pessimistic locking | 9.20 Transaction retry logic |
| Last Updated | 2026-06-02 |

## Overview

Optimistic locking assumes conflicts are rare. Each row has a version column (integer or timestamp). On update: `UPDATE ... SET version = version + 1 WHERE version = ?`. If version doesn't match, update affects 0 rows — conflict detected. Application retries by re-reading current state and re-applying changes.

---

## Core Concepts

- **Version column**: Integer column `version` default 0. Incremented on each update.
- **Compare-and-swap UPDATE**: `UPDATE orders SET status = 'shipped', version = version + 1 WHERE id = ? AND version = 2`. If another transaction updated the row, version is 3, update affects 0 rows.
- **Laravel support**: No built-in optimistic locking. Implement manually via query builder or model hooks.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Optimistic lock in web forms**: Load row with version in hidden field. On submit, compare version. If mismatch, show "data was modified by another user".
- **Retry on conflict**: Re-read the row, re-apply user changes, try update again. Limit retries to 3.


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
| 1 | Optimistic locking without retry**: Version mismatch causes update to fail silently. The user's changes are lost but no error is shown. Always detect affected rows and alert. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

