# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.14 pgroll tool (PostgreSQL, reversible expand-contract)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

pgroll is a zero-downtime migration tool for PostgreSQL that implements a view-based expand-contract pattern. Rather than using triggers or binlogs, pgroll uses PostgreSQL views to present the new schema while maintaining backward compatibility. Migrations are fully reversible — pgroll tracks every change and can roll back at any point.

---

# Core Concepts

- **View-based approach**: Instead of modifying tables directly, pgroll creates PostgreSQL views that provide both old and new schema interfaces simultaneously.
- **Reversibility**: Every migration is tracked. Rollback is a first-class operation, not an afterthought.
- **Two-phase deployment**: Phase 1 applies the migration (safe). Phase 2 finalizes it (removes backward-compatibility layer).
- **No triggers, no binlogs**: Pure PostgreSQL DDL and views. No external dependencies.

---

# Mental Models

pgroll wraps schema changes in a PostgreSQL view layer that translator between old and new schema shapes. Think of it as a schema proxy: old code sees the old shape, new code sees the new shape, and the view handles the translation.

---

# Internal Mechanics

1. A migration is defined with old and new column mappings.
2. pgroll creates a view that presents the new schema while reading from/writing to the old physical table structure.
3. When all consumers have migrated to the new schema, the physical table is altered and the view is removed.
4. Rollback simply deactivates the new schema view and restores the old physical structure.

---

# Related Knowledge Units

1.10 Zero-downtime migration patterns | 1.18 Expand-contract pattern | 1.17 PostgreSQL lazy ADD COLUMN DEFAULT

---

# Ecosystem Usage

pgroll was developed by Xata (a serverless PostgreSQL platform) and is gaining adoption in the PostgreSQL community as a zero-downtime migration tool. It integrates with existing PostgreSQL schemas without requiring schema redesign. The tool is available as a single Go binary and supports PostgreSQL 14+. pgroll is particularly relevant for Laravel teams using PostgreSQL on managed platforms like RDS, Cloud SQL, Supabase, and Neon. Its view-based approach eliminates the need for triggers or external services, making it simpler to operate than trigger-based tools. The reversible migration capability makes pgroll suitable for CI/CD pipelines where instant rollback is required.

# Failure Modes

- **View complexity limitations**: pgroll's view-based approach cannot handle all schema changes. For complex operations involving multiple table relationships, the generated views may not correctly map old and new schemas. Test complex migrations in staging first.
- **Backfill performance overhead**: When a migration requires column backfilling (e.g., adding a NOT NULL constraint), pgroll uses triggers to keep old and new columns in sync. On high-write tables, the trigger overhead can degrade write performance by 15-30%.
- **Schema namespace conflicts**: pgroll creates new PostgreSQL schemas for each migration version. Very long migration chains can accumulate many schemas. Monitor `pg_namespace` for orphaned schemas after migration completion.
- **Trigger deadlock risk**: The synchronization triggers pgroll installs during active migrations can cause deadlocks under high concurrent write load. Monitor `pg_locks` during migration windows.
- **Incompatible PostgreSQL features**: pgroll may not work correctly with PostgreSQL features like table partitioning, inheritance, or foreign data wrappers. Verify compatibility before adoption.

# Performance Considerations

- View-based schema versioning adds negligible query overhead. PostgreSQL optimizes view resolution into the underlying table access plan.
- Column backfilling via triggers during an active migration adds per-row overhead for INSERT and UPDATE operations. Benchmark write-heavy workloads with pgroll active to quantify the impact.
- The `pgroll complete` phase (removing old schema versions) is a metadata-only operation that completes in milliseconds.
- Long-running migrations with active backfill triggers generate increased WAL traffic due to trigger-based column synchronization. Monitor WAL generation rates during migration windows.

# Production Considerations

- **Two-phase deployment**: pgroll migrations follow an expand/contract pattern. The `start` phase applies additive changes and creates versioned views. The `complete` phase removes old schema versions. Never run `start` and `complete` in the same deployment — allow a compatibility window between phases.
- **Application connection configuration**: Client applications must specify which schema version to use via the `search_path` PostgreSQL setting. Update the `search_path` when deploying the new application version.
- **Rollback procedure**: pgroll supports instant rollback at any point during an active migration. The `rollback` command deactivates the new schema version and restores the old one. This is a metadata operation that completes in milliseconds.
- **Monitoring active migrations**: Track active pgroll migrations via the migration status file or pgroll's internal state. Alert if a migration remains in "active" state for longer than the expected duration.

# Architectural Decisions

| Decision | When | When Not |
|----------|------|----------|
| pgroll over gh-ost/pt-osc | PostgreSQL-only deployments, zero-downtime required | MySQL deployments |
| pgroll over manual expand-contract | Complex multi-step migrations, need for reversibility | Simple additive migrations (add column, add index) |
| pgroll over Liquibase/Flyway | Teams prioritizing zero-downtime and reversibility | Teams needing cross-database migration portability |
| View-based approach | Applications where query performance is critical | Tables with extremely complex view definitions |

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Zero-downtime migrations without triggers | View complexity for non-trivial schema changes | Some migration patterns not supported
Instant rollback at any point | Two-phase deployment required | Cannot complete migration in single deploy
No external dependencies beyond PostgreSQL | Requires PostgreSQL 14+ | Incompatible with older PostgreSQL versions
Automatic column backfilling | Trigger overhead during active migration | Write performance degradation during migration window

---

# Research Notes

pgroll is the most elegant PostgreSQL-specific zero-downtime migration tool available. Its view-based approach is conceptually cleaner than trigger-based or binlog-based alternatives. The main limitation is that it only works with PostgreSQL and requires understanding of PostgreSQL view mechanics.

## Patterns

- **Expand-contract pattern**: Phase 1 (expand): Add new columns, tables, or indexes alongside existing ones. Phase 2 (contract): Remove old schema elements after all consumers have migrated. Tools like pgroll automate this pattern using PostgreSQL views for zero-downtime schema evolution.
- **Blue-green schema deployment**: Maintain two schema versions simultaneously. Route a subset of traffic to the new schema, validate behavior, then migrate all traffic. This minimizes blast radius from schema-related issues.
- **Online schema change**: Use tools like pg_repack, pt-online-schema-change, or gh-ost to alter large tables without locking. These tools create shadow tables, copy data incrementally, and swap atomically.
- **Idempotent migration scripts**: Design migrations to be safely re-runnable. Use IF NOT EXISTS, IF EXISTS, and version-checking logic to ensure migrations can be retried without side effects.
- **Migration as code**: Store all schema changes in version control alongside application code. Automate migration application in CI/CD pipelines with automated rollback procedures.

## Common Mistakes

- **Running migrations without testing**: Applying complex schema changes (pgroll, pg_repack, instant DDL) directly to production without staging validation can corrupt data or cause downtime. Always test migration workflows in a staging environment that mirrors production schema and data volume.
- **Missing rollback plan**: For tools like pgroll that support reversible migrations, failing to test the rollback path leaves the team unable to recover from failed migrations. Test both forward and backward migration paths before production application.
- **Ignoring lock implications**: Even "instant" DDL operations (MySQL INSTANT ADD COLUMN) can cause metadata locks under concurrent DML workload. Monitor lock wait times during migration windows and schedule during low-traffic periods.
- **Not accounting for replication lag**: Schema changes on a primary database propagate as DDL statements to replicas, which can cause replication lag or break replication entirely if the DDL is not compatible. Apply changes to replicas first or use online DDL tools that support replica safety.
- **Overlooking storage impact**: Schema migration tools may create temporary tables, additional indexes, or log files that consume significant storage. Ensure sufficient free space before initiating migrations.
- **Version mismatch**: Migration tools evolve rapidly; using an older version of pgroll, pg_repack, or MySQL may miss bug fixes or introduce incompatibilities with the target database version. Always use the latest stable release compatible with your database.
