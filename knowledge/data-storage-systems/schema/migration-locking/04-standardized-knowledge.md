# 11-12 Migration Locking

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-12 |
| Knowledge Unit Title | Migration Locking |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 11.8 MySQL ALGORITHM | 9.6 Table-level locks |
| Last Updated | 2026-06-02 |

## Overview

MySQL DDL statements acquire metadata locks (MDL) to prevent concurrent DDL/DML conflicts. `ALTER TABLE` acquires exclusive MDL. If a long-running query holds a shared MDL (during table access), the ALTER TABLE waits. Waiting ALTER blocks subsequent queries (MDL queue). Solution: `LOCK TABLE ... NOWAIT`, `GET_LOCK()` for coordination, or use online tools.

---

## Core Concepts

- **Metadata lock (MDL)**: MySQL 5.5+. Any query on a table acquires shared MDL. `ALTER TABLE` requires exclusive MDL. If a query holds shared MDL, ALTER waits.
- **MDL queue**: While ALTER waits for MDL, all subsequent queries on the table are blocked. A simple `SELECT * FROM orders WHERE id = 1` can cause a chain reaction.
- **Prevention**: Kill long-running queries before ALTER. Use `ALTER TABLE ... WAIT N` (MySQL 8.0+) or online tools.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Check for blocking queries before migration**: `SELECT * FROM performance_schema.metadata_locks WHERE object_name = 'orders'`. Kill blockers before running migration.
- **Advisory lock for multi-node coordination**: `SELECT GET_LOCK('migrate_orders', 30)` — ensures only one app server runs the migration.


## Architecture Guidelines

- gh-ost: MySQL 8.0+, binlog trigger-free, millisecond lock. pt-osc: MySQL 5.7+, trigger-based, millisecond lock. pgroll: PostgreSQL 14+, view-based, no exclusive locks.

## Performance Considerations

- Online DDL consumes IO and CPU during row copying. Monitor buffer pool and replication lag. Expand-contract dual-write doubles write throughput.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Running ALTER TABLE during active query**: A reporting query holds shared MDL. ALTER waits. All subsequent queries queue. App outage. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Trigger overhead from pt-osc degrades write performance. gh-ost cut-over fails under high write load. Insufficient disk space during online DDL.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Production Schema Operations
- **Closely Related**: Other KUs within Production Schema Operations
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

