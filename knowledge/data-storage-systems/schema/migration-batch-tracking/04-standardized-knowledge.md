# 1-7 Migration Batch Tracking

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-7 |
| Knowledge Unit Title | Migration Batch Tracking |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 1.1 Migration file structure | 1.6 Migration ordering | 1.25 Rollback strategy |
| Last Updated | 2026-06-02 |

## Overview

The `migrations` table is Laravel's internal ledger of executed schema changes. Each row records a migration filename and its batch number. The batch number enables rollback grouping — `migrate:rollback` undoes the most recent batch. Understanding batch mechanics is essential for deployment safety, partial rollback, and troubleshooting migration state.

---

## Core Concepts

- **migrations table**: Two columns — `migration` (filename stem without `.php`) and `batch` (integer).
- **Batch grouping**: All migrations run in a single `migrate` command get the same batch number.
- **Rollback granularity**: `migrate:rollback` undoes the highest batch. `--step=N` rolls back N batches.
- **migrate:refresh**: Rolls back ALL batches (calls `down()` on every migration), then re-runs all migrations.
- **migrate:fresh**: Drops all tables directly (skips `down()`), then re-runs all migrations. Faster but doesn't test rollback paths.
- **migrate:status**: Displays which migrations have run and which are pending.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Use --step for production**: `php artisan migrate --step` assigns each migration its own batch. This allows rolling back a single problematic migration without affecting others in the same deploy.
- **migrate:fresh for local development only**: Fast and convenient. Never use on shared environments because it drops all tables instantly with no rollback path.
- **Monitor migration status in CI**: Add `php artisan migrate:status` to deployment pre-checks to verify expected migration state before running new migrations.


## Architecture Guidelines

- | Command | Use Case | Risk |
- |---------|----------|------|
- | migrate --step | Production deploy | Slightly slower (more batch DB writes) |
- | migrate (no step) | CI/test, local dev | Batch rollback undoes all migrations in the deploy |
- | migrate:fresh | Local development | Destructive — drops all data |
- | migrate:refresh | Testing rollback paths on staging | Executes all down() methods — may fail |


## Performance Considerations

- Batch tracking has negligible overhead — the `migrations` table is small and queried only during `migrate` and `migrate:rollback` commands. However, large batch counts (> 1000) can slow `migrate:refresh` because it iterates all batches in reverse order. The `--step` option increases batch recording overhead since each migration issues an individual INSERT instead of sharing a batch number. For deployments with hundreds of migrations, `schema:dump` is significantly faster than running individual migrations sequentially. The batch query `SELECT MAX(batch) FROM migrations` is optimized by the PRIMARY KEY index on migration name.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Ignoring batch numbers in deploy scripts**: Deploy scripts that run `migrate` without accounting for partial failure leave the database in an inconsistent state. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Using migrate:fresh on shared staging**: Destroys test data entered by QA team. Recovery requires reseeding. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Failed rollback due to missing down()**: A migration has `up()` but no proper `down()`. Rollback fails at that migration. The database is left in a partially rolled-back state.
- - **Missing migration file during rollback**: A migration file was deleted from the filesystem. The `migrations` table references it, but `down()` cannot be called. Fix requires `INSERT INTO migrations (deleted) VALUES ?` or creating a replacement migration.


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

