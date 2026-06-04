# 1-16 Mysql Instant Ddl

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-16 |
| Knowledge Unit Title | Mysql Instant Ddl |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | - **Online DDL tools**: gh-ost (GitHub Online Schema Transitions), pt-online-schema-change (Percona Toolkit) — trigger-based approaches for MySQL that replicate data to a shadow table, then swap atomically. |
| Last Updated | 2026-06-02 |

## Overview

MySQL 8.0.12 introduced `ALGORITHM=INSTANT` for DDL operations, enabling certain schema changes (primarily adding columns) to be performed as metadata-only operations — no table copy, no significant lock duration. However, each table has a 64-version limit on INSTANT operations, after which it must use INPLACE or COPY. Understanding INSTANT DDL is critical for zero-downtime migration strategies in MySQL-based Laravel applications.

---

## Core Concepts

- **INSTANT operations**: Add columns (8.0.12+), add/drop virtual columns, add/drop/alter column defaults, rename column (8.0.28+), modify column ENUM values.
- **No table rebuild**: INSTANT modifies only metadata. The operation completes in milliseconds regardless of table size.
- **64-version limit**: Each INSTANT operation increments an internal version counter. After 64, further DDL must use INPLACE or COPY.
- **Row format**: INSTANT operations use the "instant" row format, which stores version information per row.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Prefer INSTANT for column additions**: For MySQL 8.0.12+, adding a column should always use INSTANT when possible. Use raw SQL: `ALTER TABLE table ADD COLUMN col type ALGORITHM=INSTANT`.
- **Track INSTANT version count**: Monitor `information_schema.INNODB_TABLES.TOTAL_ROW_VERSIONS` to know how many INSTANT operations remain.
- **Use INPLACE for column drops**: Column drops cannot use INSTANT — use ALGORITHM=INPLACE, LOCK=NONE.


## Architecture Guidelines

- | Decision | When | When Not |
- |----------|------|----------|
- | ALGORITHM=INSTANT | Adding columns, renaming (8.0.28+) | Dropping columns, adjusting indexes, changing types |
- | ALGORITHM=INPLACE | Index operations, column drops | Operations that require full rebuild (some type changes) |
- | ALGORITHM=COPY | Last resort (blocks DML) | Any production environment |


## Performance Considerations

- - INSTANT operations are effectively free (metadata-only).
- - Rows with mixed versions may have slightly higher read overhead.
- - After 64 INSTANT operations, a physical rebuild is forced. Plan for this by scheduling periodic rebuilds.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Assuming INSTANT works for all DDL**: Many operations (column drop, index change, column type change) cannot use INSTANT. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Hitting the 64-version limit**: A frequently-migrated table hits the limit. Subsequent migrations that assume INSTANT fail and fall back to INPLACE (which may hold locks). | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **64-version limit exceeded**: A table undergoing frequent column additions (common in CI/CD-heavy deployments) exhausts its 64 INSTANT operations. Further DDL fails with error 4080. Track via `INFORMATION_SCHEMA.INNODB_TABLES.TOTAL_ROW_VERSIONS` and schedule a rebuild.
- - **INSTANT not supported for operation**: Attempting INSTANT on an unsupported operation (DROP COLUMN, index changes) raises error 1845. Always verify operation support before relying on INSTANT.
- - **Incompatible ROW_FORMAT**: Tables using COMPRESSED or REDUNDANT row formats may not support INSTANT. Verify with `SHOW TABLE STATUS`.
- - **Replication incompatibility**: Some INSTANT operations on source may cause replication errors on replicas running older MySQL versions. Ensure all replicas are on MySQL 8.0.12+.
- - **Foreign key tables**: Tables involved in foreign key relationships have additional restrictions on INSTANT operations. Test thoroughly.


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

