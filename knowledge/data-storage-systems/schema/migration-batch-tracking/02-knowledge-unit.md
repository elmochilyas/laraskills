# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.7 Migration batch tracking and the migrations table
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

The `migrations` table is Laravel's internal ledger of executed schema changes. Each row records a migration filename and its batch number. The batch number enables rollback grouping — `migrate:rollback` undoes the most recent batch. Understanding batch mechanics is essential for deployment safety, partial rollback, and troubleshooting migration state.

---

# Core Concepts

- **migrations table**: Two columns — `migration` (filename stem without `.php`) and `batch` (integer).
- **Batch grouping**: All migrations run in a single `migrate` command get the same batch number.
- **Rollback granularity**: `migrate:rollback` undoes the highest batch. `--step=N` rolls back N batches.
- **migrate:refresh**: Rolls back ALL batches (calls `down()` on every migration), then re-runs all migrations.
- **migrate:fresh**: Drops all tables directly (skips `down()`), then re-runs all migrations. Faster but doesn't test rollback paths.
- **migrate:status**: Displays which migrations have run and which are pending.

---

# Mental Models

The `migrations` table is a commit log where batch numbers are tags grouping related commits. A `migrate` command is a push that adds new commits. `rollback` is a revert to a previous tag. `refresh` is a full reset to origin and replay.

---

# Internal Mechanics

When `php artisan migrate` runs:
1. Reads the migrations table → finds max batch number
2. Finds unexecuted migration files → assigns them batch = max(batch) + 1
3. Within the same command execution, all migrations share that batch number
4. `--step` option forces each migration to increment the batch counter independently
5. `migrate:rollback` reads migrations WHERE batch = (SELECT MAX(batch) FROM migrations), calls `down()` in reverse filename order, deletes entries

`migrate:refresh` reads ALL batches, calls `down()` in reverse batch + reverse filename order, then calls `migrate`. This tests every `down()` method in sequence.

---

# Patterns

**Use --step for production**: `php artisan migrate --step` assigns each migration its own batch. This allows rolling back a single problematic migration without affecting others in the same deploy.

**migrate:fresh for local development only**: Fast and convenient. Never use on shared environments because it drops all tables instantly with no rollback path.

**Monitor migration status in CI**: Add `php artisan migrate:status` to deployment pre-checks to verify expected migration state before running new migrations.

---

# Architectural Decisions

| Command | Use Case | Risk |
|---------|----------|------|
| migrate --step | Production deploy | Slightly slower (more batch DB writes) |
| migrate (no step) | CI/test, local dev | Batch rollback undoes all migrations in the deploy |
| migrate:fresh | Local development | Destructive — drops all data |
| migrate:refresh | Testing rollback paths on staging | Executes all down() methods — may fail |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Batch grouping = simple rollback | Batch rollback is all-or-nothing | --step mitigates but adds complexity
migrate:fresh is fast | No down() testing | May silently break down() methods

---

# Production Considerations

**Never run migrate:fresh in production**: It drops every table including the `migrations` table. Recovery requires restoring from backup.

**Batch escalation**: If a deploy runs 5 migrations and the 3rd one fails, the first 2 are already recorded. The deploy script must handle partial migration states — either rollback the batch or manually fix and continue.

**staging validation**: Run `migrate:refresh` on staging before production deploys to verify all `down()` methods work correctly.

---

# Common Mistakes

**Ignoring batch numbers in deploy scripts**: Deploy scripts that run `migrate` without accounting for partial failure leave the database in an inconsistent state.

**Using migrate:fresh on shared staging**: Destroys test data entered by QA team. Recovery requires reseeding.

---

# Failure Modes

- **Failed rollback due to missing down()**: A migration has `up()` but no proper `down()`. Rollback fails at that migration. The database is left in a partially rolled-back state.
- **Missing migration file during rollback**: A migration file was deleted from the filesystem. The `migrations` table references it, but `down()` cannot be called. Fix requires `INSERT INTO migrations (deleted) VALUES ?` or creating a replacement migration.

---

# Ecosystem Usage

Stancl/tenancy extends batch tracking to per-tenant databases, maintaining a separate version ledger. Horizon and Forge use migration status as a deployment health check.

# Performance Considerations

Batch tracking has negligible overhead — the `migrations` table is small and queried only during `migrate` and `migrate:rollback` commands. However, large batch counts (> 1000) can slow `migrate:refresh` because it iterates all batches in reverse order. The `--step` option increases batch recording overhead since each migration issues an individual INSERT instead of sharing a batch number. For deployments with hundreds of migrations, `schema:dump` is significantly faster than running individual migrations sequentially. The batch query `SELECT MAX(batch) FROM migrations` is optimized by the PRIMARY KEY index on migration name.

---

# Related Knowledge Units

1.1 Migration file structure | 1.6 Migration ordering | 1.25 Rollback strategy

---

# Research Notes

The most overlooked detail is that `migrate:fresh` does NOT test `down()` methods. Teams that rely on `migrate:fresh` in CI discover broken rollbacks only during production incidents. Use `migrate:refresh` in CI to validate both directions.
