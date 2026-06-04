# 1-26 Mysql Algorithm Lock Options

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-26 |
| Knowledge Unit Title | Mysql Algorithm Lock Options |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | - **Online DDL tools**: gh-ost (GitHub Online Schema Transitions), pt-online-schema-change (Percona Toolkit) — trigger-based approaches for MySQL that replicate data to a shadow table, then swap atomically. |
| Last Updated | 2026-06-02 |

## Overview

MySQL's online DDL capability is controlled by ALGORITHM and LOCK options. ALGORITHM determines how the DDL is executed (metadata-only, in-place rebuild, or copy). LOCK controls concurrent DML access during the DDL. Choosing the correct options determines whether a migration blocks reads, blocks writes, or runs with zero application impact.

---

## Core Concepts

- **ALGORITHM options**:
- `INSTANT`: Metadata-only change. No table rebuild. No DML blocking. Supported operations: adding columns (8.0.12+), dropping virtual columns, renaming columns (8.0.28+), modifying ENUM values.
- `INPLACE`: Table is rebuilt in-place. Allows concurrent DML (if LOCK=NONE) during the rebuild. Supports most ALTER operations: adding/dropping indexes, changing column types (in some cases), adding FKs.
- `COPY`: Full table copy to a temporary table. Blocks all concurrent DML (writes blocked, reads blocked during copy). Fallback for operations INPLACE can't handle.
- **LOCK options**:
- `NONE`: Allows concurrent reads and writes during DDL.
- `SHARED`: Allows concurrent reads but blocks writes.
- `EXCLUSIVE`: Blocks all reads and writes.
- `DEFAULT`: MySQL chooses the least restrictive lock supported by the operation.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Prefer INSTANT**: For column additions (MySQL 8.0.12+), specify `ALGORITHM=INSTANT` explicitly. If the operation doesn't support INSTANT, MySQL raises an error rather than silently falling back to INPLACE or COPY.
- **INPLACE with LOCK=NONE for indexes**: Adding or dropping indexes on a live table: `ALTER TABLE ... ADD INDEX ... ALGORITHM=INPLACE LOCK=NONE`. This allows concurrent DML.
- **COPY for complex ALTER**: When changing a column's type or reorganizing the table, COPY may be the only option. Schedule during maintenance windows.


## Architecture Guidelines

- | Operation | Best ALGORITHM | Best LOCK | Notes |
- |-----------|---------------|-----------|-------|
- | ADD COLUMN | INSTANT (8.0.12+) or INPLACE | NONE | INSTANT preferred |
- | DROP COLUMN | INPLACE | NONE | Requires table rebuild |
- | ADD INDEX | INPLACE | NONE | Read-only blocking during sort |
- | DROP INDEX | INPLACE | NONE | Instant in most cases |
- | RENAME COLUMN | INSTANT (8.0.28+) | NONE | |
- | CHANGE COLUMN TYPE | COPY | EXCLUSIVE | Usually needs maintenance window |


## Performance Considerations

- - INPLACE operations rebuild the entire table — they read all data, sort indexes, and write the new table. Total IO is approximately 2x the table size.
- - INSTANT operations have negligible performance impact.
- - COPY operations require disk space for the full table copy (temporary table exists alongside original).


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Assuming INPLACE is always concurrent**: Some INPLACE operations (e.g., adding a FULLTEXT index) require a read lock during index building. Check the MySQL documentation for each operation type. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not specifying ALGORITHM/LOCK**: Letting MySQL choose DEFAULT may result in an unexpected table copy that blocks writes for minutes. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Silent fallback to COPY**: Specifying ALGORITHM=DEFAULT may cause MySQL to choose COPY for an operation, holding EXCLUSIVE locks and blocking all DML. Always specify explicit ALGORITHM and LOCK in production migrations.
- - **LOCK=NONE not supported**: Some operations (e.g., adding a FULLTEXT index, dropping a primary key) do not support LOCK=NONE. MySQL raises an error — the migration fails. Test on staging first.
- - **Statement timeout**: INPLACE operations on large tables may exceed `innodb_lock_wait_timeout` or `max_execution_time`. Monitor long-running ALTER TABLE operations.
- - **Replication lag**: INPLACE operations generate significant binlog traffic, causing replica lag on MySQL replication setups.


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

