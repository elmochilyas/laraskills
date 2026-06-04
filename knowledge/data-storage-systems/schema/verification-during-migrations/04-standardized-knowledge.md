# 11-10 Verification During Migrations

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-10 |
| Knowledge Unit Title | Verification During Migrations |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 11.9 Data backfill | 11.16 Testing migrations in CI |
| Last Updated | 2026-06-02 |

## Overview

After running a migration + backfill, verify data integrity before switching traffic. Checks: row count match (old vs new), checksum/aggregate match (SUM, MD5), sample comparison (random 1000 rows compared side-by-side), constraint validation (FK, UNIQUE, NOT NULL). Verification catches data corruption, truncation, and mapping errors.

---

## Core Concepts

- **Row count verification**: `SELECT COUNT(*) FROM old_table` vs `SELECT COUNT(*) FROM new_table`. Must match exactly.
- **Checksum verification**: `SELECT MD5(GROUP_CONCAT(column ORDER BY id)) FROM old_table` vs new table. Catches data differences.
- **Constraint verification**: `SELECT * FROM new_table WHERE constraint_column IS NULL` — finds NOT NULL violations. `SELECT orphan_column FROM new_table WHERE NOT EXISTS (SELECT 1 FROM referenced WHERE ...)` — finds FK violations.
- **Null/empty check**: Verify no unexpected NULLs in columns that should be filled.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Automated verification script**: Run after backfill. Fail the deploy if any check fails. `php artisan migrate:verify --table=orders --old-connection=mysql --new-connection=mysql`.
- **Verification in CI**: Migration verification runs in staging/test environment. Catches issues before production.


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
| 1 | No verification before cutover**: "We'll correct it later" — old column is dropped, data is gone. Verify before contract phase. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

