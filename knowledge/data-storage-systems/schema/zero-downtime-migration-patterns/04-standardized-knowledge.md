# 1-10 Zero Downtime Migration Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-10 |
| Knowledge Unit Title | Zero Downtime Migration Patterns |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 1.11 gh-ost tool | 1.12 pt-online-schema-change | 1.14 pgroll tool | 1.16 MySQL instant DDL | 1.17 PostgreSQL lazy ADD COLUMN DEFAULT | 1.18 Expand-contract pattern detailed | 1.19 Data backfill strategies |
| Last Updated | 2026-06-02 |

## Overview

Zero-downtime migrations allow schema changes on production databases without blocking reads or writes. The expand-contract pattern is the most versatile approach: add columns/ tables, deploy code that uses both old and new, then remove old structures. Shadow-table operations involve creating a new table alongside the old one, migrating data, and swapping. These patterns decouple schema changes from code deployments, enabling safe evolution under live traffic.

---

## Core Concepts

- **Expand-contract (add, dual-write, backfill, drop)**: Multi-phase pattern where new schema elements are added first, code is updated to write to both, data is backfilled, reads are migrated, and old elements are removed — all across separate deployments.
- **Shadow-table**: Create an exact copy of the table, apply changes to the shadow, migrate data, atomically swap via RENAME TABLE.
- **Online DDL tools**: Third-party tools (gh-ost, pt-online-schema-change, pgroll, Spirit) automate the shadow-table approach for specific operations (ALTER TABLE, index creation).
- **MySQL instant DDL**: `ALGORITHM=INSTANT` for adding columns (8.0.12+) — a metadata-only change with no table copy.
- **PostgreSQL lazy ADD COLUMN DEFAULT**: Adding a column with a non-volatile DEFAULT is metadata-only (no rewrite) since PostgreSQL 11.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Add column nullable then enforce NOT NULL later**: Phase 1: `$table->string('slug')->nullable()`. Phase 2: Backfill data. Phase 3: `$table->string('slug')->nullable(false)->change()`. This prevents locking on addition.
- **Add column with DEFAULT in PostgreSQL 11+**: `ALTER TABLE ADD COLUMN slug VARCHAR(255) DEFAULT ''` is instant — no table rewrite. This is the only safe way to add a non-nullable column with a default.
- **Rename column via add + backfill + drop (never ALTER RENAME)**: ALTER RENAME is exclusive-locked. Instead, add new column, dual-write, backfill, switch reads, drop old.


## Architecture Guidelines

- | Pattern | Best For | Avoid When |
- |---------|----------|------------|
- | Expand-contract | Adding/removing columns, complex changes | Simple additive changes (use instant DDL) |
- | Shadow-table (gh-ost) | Large table ALTER (indexes, column types) | Tables < 10M rows (table copy cost may not justify tooling overhead) |
- | Instant DDL | Adding columns (MySQL 8.0.12+), adding DEFAULT (PG 11+) | Complex changes requiring table rebuild |
- | pgroll | PostgreSQL migrations requiring safe rollback | MySQL environments |


## Performance Considerations

- - Dual-write phase doubles INSERT/UPDATE throughput to the affected tables. Monitor database write capacity.
- - Backfill operations should be throttled to avoid replication lag and resource contention. Use chunked processing with rate limiting.
- - Shadow-table operations double storage temporarily (the shadow table exists alongside the original).
- - gh-ost/throttle mechanisms monitor replication lag, thread count, and load to self-regulate.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Dropping old column before all code is updated**: A queue job that was delayed runs after the column is dropped. It references the old column and fails. Compatibility window must account for all running code paths. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Backfill in the same deploy as column addition**: The backfill may take hours on a large table, holding a transaction open. Use separate queued jobs with chunked processing. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Assuming INSTANT DDL is always available**: MySQL's ALGORITHM=INSTANT has a 64-version limit — after 64 INSTANT changes to a table, it must use INPLACE or COPY. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Partial backfill**: Backfill job fails halfway. The column has mixed NULL/populated values. Application code reading the new column gets inconsistent data.
- - **Dual-write bug**: Application writes to old column but not new column, or writes different values to each. The columns drift, and switching reads produces incorrect results.
- - **Table rename race**: In shadow-table swaps, the RENAME TABLE operation (MySQL) requires an exclusive lock. Brief write unavailability occurs during the atomic swap.


## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Schema Design & Migration Engineering
- **Closely Related**: Other KUs within Schema Design & Migration Engineering
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

