# 11-13 Destructive Operations

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-13 |
| Knowledge Unit Title | Destructive Operations |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 11.11 Rollback planning | 11.6 Expand-contract |
| Last Updated | 2026-06-02 |

## Overview

Destructive DDL operations should never be the first step. Always: backup data → verify no references → run in expand-contract → wait for old-column usage to drop to zero → drop. DROP COLUMN is irreversible. TRUNCATE is irreversible. DROP TABLE is irreversible. Treat them as final steps after all rollback windows have passed.

---

## Core Concepts

- **DROP COLUMN risk**: Dropped column data is gone (MySQL) or requires VACUUM FULL to reclaim space (PostgreSQL). Restore from backup only.
- **DROP TABLE risk**: Table and all its data gone. FK constraints referencing this table will fail.
- **TRUNCATE risk**: All rows deleted. Cannot roll back (DDL, not DML, in some contexts). Faster than DELETE but irreversible.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Safe DROP COLUMN**: (1) Add `_deprecated` suffix to column name (or rename). (2) Wait 2 weeks. Monitor for errors accessing the column. (3) If no errors, drop. (4) If errors, restore column.
- **DROP TABLE checklist**: (1) Backup. (2) Check FK references. (3) Verify no code references the table. (4) Move to archive first (RENAME). (5) Wait 30 days. (6) Drop.


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
| 1 | DROP COLUMN as part of standard migration**: "I added a column then dropped it in the next migration" — data is gone. Use expand-contract to allow rollback. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

