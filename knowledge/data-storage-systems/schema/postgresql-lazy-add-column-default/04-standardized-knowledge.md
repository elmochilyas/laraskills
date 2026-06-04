# 1-17 Postgresql Lazy Add Column Default

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-17 |
| Knowledge Unit Title | Postgresql Lazy Add Column Default |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | - **Online DDL tools**: gh-ost (GitHub Online Schema Transitions), pt-online-schema-change (Percona Toolkit) — trigger-based approaches for MySQL that replicate data to a shadow table, then swap atomically. |
| Last Updated | 2026-06-02 |

## Overview

Since PostgreSQL 11, `ALTER TABLE ... ADD COLUMN ... DEFAULT (non-volatile)` is a metadata-only operation that does not rewrite the table. Pre-11, PostgreSQL had to rewrite every row to store the default value. This change makes adding columns with defaults to large PostgreSQL tables essentially instant (milliseconds, regardless of table size). This is one of PostgreSQL's most important zero-downtime DDL features.

---

## Core Concepts

- **Metadata-only operation**: The column definition and default value are stored in the catalog. Existing rows return the default value on read without physical storage.
- **Non-volatile requirement**: Only works with immutable expressions (constants, `NOW()` is considered stable, not immutable in older versions). Volatile defaults (random, clock_timestamp) still require a table rewrite.
- **No NULL storage**: If the column is NOT NULL with a DEFAULT, existing rows don't store the value — it's computed on read from the catalog default.
- **NULL behavior**: If the column is nullable with no DEFAULT, existing rows implicitly have NULL. No rewrite needed.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Add nullable column first, then set NOT NULL**: `ALTER TABLE ADD COLUMN IF NOT EXISTS slug text;` then backfill, then `ALTER TABLE ALTER COLUMN slug SET NOT NULL;`. The NOT NULL change requires a full table scan (validation).
- **Add non-nullable column with default**: `ALTER TABLE ADD COLUMN created_by bigint NOT NULL DEFAULT 0;` — instant in PG 11+, no rewrite. The default ensures existing rows have a value.


## Architecture Guidelines

- | Decision | When | When Not |
- |----------|------|----------|
- | ADD COLUMN with DEFAULT | PostgreSQL 11+, migration to production tables | Adding with volatile default (needs rewrite) |
- | ADD COLUMN nullable, no default | Adding columns where NULL is semantically valid | Columns that require immediate NOT NULL enforcement |


## Performance Considerations

- - Read performance for existing rows fetching the new column is slightly slower (catalog lookup), but the overhead is negligible.
- - After enough UPDATE operations rewrite all rows, the catalog default is no longer needed (the value is physically stored).
- - The initial addition is O(1) regardless of table size.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Adding column with volatile default**: `ALTER TABLE ADD COLUMN random_id uuid DEFAULT gen_random_uuid()` — this is a volatile default and will rewrite the entire table. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Assuming add-column is always instant**: Adding without DEFAULT or with NULL is instant. Adding any column with any default was NOT instant in PostgreSQL < 11. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Volatile default triggers rewrite**: Using `gen_random_uuid()`, `clock_timestamp()`, or `random()` as the column default forces a full table rewrite, negating the performance benefit. Always test default volatility with `SELECT pg_get_expr(adbin, adrelid) FROM pg_attrdef`.
- - **NOT NULL validation table scan**: Adding a column as NOT NULL with a default is metadata-only, but setting NOT NULL on an existing nullable column requires a full table scan with ACCESS EXCLUSIVE lock.
- - **Catalog bloat**: Frequent add/drop default operations can accumulate catalog entries. Monitor `pg_attrdef` size in high-frequency migration environments.
- - **Replication delay**: While the DDL itself is instant, the catalog update replicates as a DDL statement that may cause brief replication queue stalls.
- - **Version incompatibility**: If a physical standby runs PostgreSQL < 11, the metadata-only DDL is not supported and replication fails.


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

