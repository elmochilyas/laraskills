# 9-17 Serializable Snapshot Isolation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-17 |
| Knowledge Unit Title | Serializable Snapshot Isolation |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 9.3 PostgreSQL isolation specifics | 9.18 Write skew prevention |
| Last Updated | 2026-06-02 |

## Overview

SSI (PostgreSQL SERIALIZABLE) detects serialization anomalies via predicate locking and conflict tracking. Unlike pessimistic SERIALIZABLE (which uses table/index locks), SSI is optimistic — it allows concurrent operations and aborts one transaction if a serialization conflict is detected. SSI provides true serializability with better concurrency than lock-based approaches.

---

## Core Concepts

- **SIREAD locks**: Lightweight predicate locks. Track which data a transaction read (via index keys and page-level tracking). Monitoring for rw-conflicts.
- **Conflict detection**: If transaction T1 reads data that T2 later writes, and T1's read predicate overlaps T2's write, SSI detects a rw-dependency. If this creates a cycle in the dependency graph, one transaction is aborted.
- **Serialization failure (40001)**: Returned when SSI detects a conflict. Application must retry the entire transaction.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **SSI for inventory management**: Prevent overselling. Two concurrent transactions reading same count and decrementing. SSI catches the conflict.
- **SSI with retry wrapper**: `for ($attempts = 0; $attempts < 3; $attempts++) { try { DB::transaction(fn() => ..., 5) } catch (QueryException $e) { if ($e->getCode() != 40001) throw; usleep(100_000); } }`.


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
| 1 | SSI without understanding conflict rate**: SSI overhead increases with conflict rate. Monitor `serialization_failures` in pg_stat_database. High rate → reduce SSI scope. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

