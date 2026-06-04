# 9-4 Mysql Innodb Isolation Specifics

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Transaction Management Concurrency |
| Knowledge Unit ID | 9-4 |
| Knowledge Unit Title | Mysql Innodb Isolation Specifics |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 9.2 Isolation levels | 9.8 Deadlock detection |
| Last Updated | 2026-06-02 |

## Overview

MySQL InnoDB's default REPEATABLE READ uses next-key locks (record lock + gap lock) to prevent phantom reads. Gap locks lock ranges between index entries, preventing INSERT of new rows in that range. This causes more lock contention than PostgreSQL's MVCC REPEATABLE READ. InnoDB also has predicate locks for SERIALIZABLE.

---

## Core Concepts

- **Next-key lock**: Combination of row lock + gap lock on the gap before the row. `SELECT * FROM orders WHERE id > 100 FOR UPDATE` locks rows with id > 100 AND the gap after the last row (prevents INSERT id > max).
- **Gap lock**: Locks a range between index entries. Can cause deadlocks when transactions insert into overlapping ranges.
- **REPEATABLE READ implementation**: InnoDB uses consistent read (MVCC snapshot) for plain SELECT. `SELECT ... FOR UPDATE/LOCK IN SHARE MODE` uses next-key locks for the index scanned range.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **READ COMMITTED to avoid gap locks**: Change to READ COMMITTED if gap lock contention is high. Binlog must be MIXED or ROW (not STATEMENT) for READ COMMITTED.
- **Indexed queries reduce lock range**: A query that uses an index locks only the index range scanned. Without index, it locks all rows examined (gap locks on entire table).


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
| 1 | Gap lock deadlock via inserts**: Transaction A locks range (100-200). Transaction B tries to insert id=150. B waits for A's gap lock. If A also needs a resource B holds → deadlock. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

