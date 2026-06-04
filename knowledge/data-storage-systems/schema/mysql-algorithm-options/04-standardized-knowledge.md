# 11-8 Mysql Algorithm Options

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-8 |
| Knowledge Unit Title | Mysql Algorithm Options |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 13.5 Online DDL | 13.6 ALGORITHM=INSTANT |
| Last Updated | 2026-06-02 |

## Overview

MySQL ALTER TABLE supports three algorithms: INSTANT (metadata only — MySQL 8.0.12+), INPLACE (rebuilds table but allows concurrent DML), COPY (full table copy, blocks DML). LOCK options: NONE (no lock — concurrent reads/writes), SHARED (read lock — concurrent reads), EXCLUSIVE (exclusive lock — no concurrent access). Choose algorithm + lock for zero-downtime DDL.

---

## Core Concepts

- **INSTANT**: ALGORITHM=INSTANT. Operations: ADD COLUMN (append only), DROP COLUMN (MySQL 8.0.29+), ADD/DROP DEFAULT, RENAME COLUMN (8.0.29+). Metadata only. No table rebuild.
- **INPLACE**: ALGORITHM=INPLACE. Operations: ADD/DROP INDEX, ADD/DROP FK, CHANGE COLUMN type (some). Rebuilds table. Concurrent DML allowed (LOCK=NONE).
- **COPY**: ALGORITHM=COPY. All operations that can't use INSTANT/INPLACE. Full table copy. Blocks DML.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **INSTANT for column additions**: `ALTER TABLE orders ADD COLUMN status INT, ALGORITHM=INSTANT, LOCK=NONE` — instant, no locking.
- **INPLACE for index creation**: `CREATE INDEX idx_status ON orders(status), ALGORITHM=INPLACE, LOCK=NONE` — no downtime.
- **Avoid COPY in production**: `ALTER TABLE orders MODIFY COLUMN id BIGINT` (may use COPY). Check before running.


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
| 1 | Adding column in non-append position**: MySQL INSTANT only supports append (adding column at end). Adding a column in the middle of column order requires INPLACE or COPY. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

