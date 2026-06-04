# 11-18 Last Mile Migration Validation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-18 |
| Knowledge Unit Title | Last Mile Migration Validation |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 11.16 Testing in CI | 11.10 Verification | 11.12 Migration locking |
| Last Updated | 2026-06-02 |

## Overview

Before deploying a production migration, run a final validation checklist: verify database storage space, check for long-running queries that may block DDL, confirm backup is recent, test rollback plan, verify CI tests passed, run migration against staging with production-like data, check replica lag baseline, and schedule during maintenance window.

---

## Core Concepts

- **Storage check**: `SELECT SUM(data_length + index_length) / 1024 / 1024 AS size_mb FROM information_schema.tables WHERE table_name = 'orders'`. Ensure enough free space for shadow table/rebuild.
- **Query check**: `SHOW FULL PROCESSLIST` or `SELECT * FROM pg_stat_activity`. Kill long-running queries before migration.
- **Backup confirmation**: Verify recent backup exists. Run `SELECT NOW() - MIN(check_time)` on backup tooling.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Pre-migration checklist script**: Artisan command that runs all checks. Exits with error if any check fails. `php artisan migrate:check`.
- **Maintenance window**: Define migration window (e.g., 02:00-04:00 Sunday). Block deploys outside this window for risky migrations.


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
| 1 | Skipping validation before production migration**: "It worked in staging" — staging data differs from production. Always run validation against production (read-only checks). | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

