# 11-7 Add Column Default Postgresql

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-7 |
| Knowledge Unit Title | Add Column Default Postgresql |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 11.1 Zero-downtime taxonomy | 11.8 MySQL ALGORITHM options |
| Last Updated | 2026-06-02 |

## Overview

PostgreSQL 11+: `ALTER TABLE ... ADD COLUMN ... DEFAULT ...` is metadata-only — no table rewrite, no row lock. The default value is stored in the system catalog, not per row. Reading a row that was created before the column existed returns the default value without physical storage. This makes adding columns with defaults a zero-downtime operation.

---

## Core Concepts

- **Metadata-only column addition**: PostgreSQL stores the default value in `pg_attrdef`. Rows are not updated. `SELECT` reads the default from catalog for old rows.
- **No lock**: `ADD COLUMN ... DEFAULT (non-volatile)` takes only `ACCESS EXCLUSIVE` lock (blocks writes but is held briefly).
- **NOT NULL consideration**: Adding `NOT NULL` requires a full table scan (or PostgreSQL 11+ `NOT VALID` + VALIDATE).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Add column with default in production**: `ALTER TABLE orders ADD COLUMN status INT DEFAULT 0;` — instant, no locking.
- **Add NOT NULL in steps**: (1) Add column as nullable with default. (2) Backfill (already done by default). (3) `ALTER TABLE orders ALTER COLUMN status SET NOT NULL;` — if table is small, this is fast.


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
| 1 | Volatile default**: `ALTER TABLE ... ADD COLUMN ... DEFAULT random()` — PostgreSQL 11+ still rewrites the table for volatile defaults. Use stable default. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

