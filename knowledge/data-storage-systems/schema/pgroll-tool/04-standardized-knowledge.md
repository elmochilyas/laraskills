# 1-14 Pgroll Tool

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-14 |
| Knowledge Unit Title | Pgroll Tool |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 1.10 Zero-downtime migration patterns | 1.18 Expand-contract pattern | 1.17 PostgreSQL lazy ADD COLUMN DEFAULT |
| Last Updated | 2026-06-02 |

## Overview

pgroll is a zero-downtime migration tool for PostgreSQL that implements a view-based expand-contract pattern. Rather than using triggers or binlogs, pgroll uses PostgreSQL views to present the new schema while maintaining backward compatibility. Migrations are fully reversible — pgroll tracks every change and can roll back at any point.

---

## Core Concepts

- **View-based approach**: Instead of modifying tables directly, pgroll creates PostgreSQL views that provide both old and new schema interfaces simultaneously.
- **Reversibility**: Every migration is tracked. Rollback is a first-class operation, not an afterthought.
- **Two-phase deployment**: Phase 1 applies the migration (safe). Phase 2 finalizes it (removes backward-compatibility layer).
- **No triggers, no binlogs**: Pure PostgreSQL DDL and views. No external dependencies.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- - **Expand-contract pattern**: Phase 1 (expand): Add new columns, tables, or indexes alongside existing ones. Phase 2 (contract): Remove old schema elements after all consumers have migrated. Tools like pgroll automate this pattern using PostgreSQL views for zero-downtime schema evolution.
- - **Blue-green schema deployment**: Maintain two schema versions simultaneously. Route a subset of traffic to the new schema, validate behavior, then migrate all traffic. This minimizes blast radius from schema-related issues.
- - **Online schema change**: Use tools like pg_repack, pt-online-schema-change, or gh-ost to alter large tables without locking. These tools create shadow tables, copy data incrementally, and swap atomically.
- - **Idempotent migration scripts**: Design migrations to be safely re-runnable. Use IF NOT EXISTS, IF EXISTS, and version-checking logic to ensure migrations can be retried without side effects.
- - **Migration as code**: Store all schema changes in version control alongside application code. Automate migration application in CI/CD pipelines with automated rollback procedures.

## Architecture Guidelines

- | Decision | When | When Not |
- |----------|------|----------|
- | pgroll over gh-ost/pt-osc | PostgreSQL-only deployments, zero-downtime required | MySQL deployments |
- | pgroll over manual expand-contract | Complex multi-step migrations, need for reversibility | Simple additive migrations (add column, add index) |
- | pgroll over Liquibase/Flyway | Teams prioritizing zero-downtime and reversibility | Teams needing cross-database migration portability |
- | View-based approach | Applications where query performance is critical | Tables with extremely complex view definitions |

## Performance Considerations

- - View-based schema versioning adds negligible query overhead. PostgreSQL optimizes view resolution into the underlying table access plan.
- - Column backfilling via triggers during an active migration adds per-row overhead for INSERT and UPDATE operations. Benchmark write-heavy workloads with pgroll active to quantify the impact.
- - The `pgroll complete` phase (removing old schema versions) is a metadata-only operation that completes in milliseconds.
- - Long-running migrations with active backfill triggers generate increased WAL traffic due to trigger-based column synchronization. Monitor WAL generation rates during migration windows.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | - **Running migrations without testing**: Applying complex schema changes (pgroll, pg_repack, instant DDL) directly to production without staging validation can corrupt data or cause downtime. Always test migration workflows in a staging environment that mirrors production schema and data volume. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | - **Missing rollback plan**: For tools like pgroll that support reversible migrations, failing to test the rollback path leaves the team unable to recover from failed migrations. Test both forward and backward migration paths before production application. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | - **Ignoring lock implications**: Even "instant" DDL operations (MySQL INSTANT ADD COLUMN) can cause metadata locks under concurrent DML workload. Monitor lock wait times during migration windows and schedule during low-traffic periods. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | - **Not accounting for replication lag**: Schema changes on a primary database propagate as DDL statements to replicas, which can cause replication lag or break replication entirely if the DDL is not compatible. Apply changes to replicas first or use online DDL tools that support replica safety. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 5 | - **Overlooking storage impact**: Schema migration tools may create temporary tables, additional indexes, or log files that consume significant storage. Ensure sufficient free space before initiating migrations. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 6 | - **Version mismatch**: Migration tools evolve rapidly; using an older version of pgroll, pg_repack, or MySQL may miss bug fixes or introduce incompatibilities with the target database version. Always use the latest stable release compatible with your database. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **View complexity limitations**: pgroll's view-based approach cannot handle all schema changes. For complex operations involving multiple table relationships, the generated views may not correctly map old and new schemas. Test complex migrations in staging first.
- - **Backfill performance overhead**: When a migration requires column backfilling (e.g., adding a NOT NULL constraint), pgroll uses triggers to keep old and new columns in sync. On high-write tables, the trigger overhead can degrade write performance by 15-30%.
- - **Schema namespace conflicts**: pgroll creates new PostgreSQL schemas for each migration version. Very long migration chains can accumulate many schemas. Monitor `pg_namespace` for orphaned schemas after migration completion.
- - **Trigger deadlock risk**: The synchronization triggers pgroll installs during active migrations can cause deadlocks under high concurrent write load. Monitor `pg_locks` during migration windows.
- - **Incompatible PostgreSQL features**: pgroll may not work correctly with PostgreSQL features like table partitioning, inheritance, or foreign data wrappers. Verify compatibility before adoption.

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

