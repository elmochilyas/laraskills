# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.25 Rollback strategy per migration type (additive safe, destructive requires compatibility window)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Migration rollback safety depends on the operation type. Additive changes (creating tables, adding columns, adding indexes) are safe to rollback immediately. Destructive changes (dropping tables, dropping columns, removing indexes) require a compatibility window where no code references the dropped structures. Rollback strategy must account for the deployment state — not just the database state.

---

# Core Concepts

- **Additive operations**: CREATE TABLE, ADD COLUMN, ADD INDEX, ADD FK. Safe to reverse because they don't destroy existing data.
- **Destructive operations**: DROP TABLE, DROP COLUMN, DROP INDEX, ALTER COLUMN TYPE. Irreversible if code still references the dropped structures.
- **Compatibility window**: The period between dropping a structure and ensuring all code (including delayed queue jobs) has stopped referencing it. Typically 24-48 hours.
- **Rename operations**: Neither purely additive nor destructive — they combine both.

---

# Mental Models

Additive changes add branches to a tree. Destructive changes cut branches. You can safely remove a branch only after you've verified nothing is sitting on it.

---

# Internal Mechanics

- `migrate:rollback` calls `down()` on the highest batch's migrations in reverse order.
- If `down()` tries to drop a column that a running queue job is inserting into, the DDL fails with a lock conflict.
- Rollback of a destructive operation requires the application code to be at a version that doesn't reference the removed structures.

---

# Patterns

**Immediate rollback for additive**: If a new column migration causes issues, rollback is safe — the column disappears, no data loss, no code breakage.

**Delayed rollback for destructive**: To remove a column, first deploy code that stops referencing it. Wait 24-48 hours. Then deploy the destructive migration. The rollback of this destructive migration is to re-add the column and re-backfill data — not a simple `up()` reversal.

**Rollback planning in deploy scripts**: Deploy scripts should always include: `If the deploy fails, run migrate:rollback`. Ensure the rollback is tested before deployment.

---

# Architectural Decisions

| Migration Type | Rollback Safety | Rollback Action |
|----------------|----------------|----------------|
| CREATE TABLE | Safe | DROP TABLE (no data loss if not populated) |
| ADD COLUMN (nullable) | Safe | DROP COLUMN |
| ADD COLUMN (NOT NULL with default) | Safe | DROP COLUMN |
| ADD INDEX | Safe | DROP INDEX |
| ADD FK | Safe | DROP FK |
| DROP TABLE | DANGEROUS | Requires restore from backup |
| DROP COLUMN | DANGEROUS | Requires re-add + backfill |
| DROP INDEX | Caution | Require re-add (may cause slow queries) |
| ALTER COLUMN TYPE | DANGEROUS | May lose precision or data |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Immediate additive rollback | Cannot rollback destructive as easily | Forces expand-contract for complex changes
Safe destructive requires window | Slower evolution | Better safety guarantees

---

# Performance Considerations

Rollback performance depends on the operation type. Additive rollbacks (DROP COLUMN, DROP INDEX) complete in milliseconds to seconds since they only modify metadata. Destructive rollbacks that re-add columns and backfill data can take hours depending on table size. The `--step` option improves rollback performance by allowing targeted single-migration rollback instead of full batch reversal. For large deployments, test rollback time in staging and budget it in the deployment window. A rollback that takes 30 minutes on a 100M-row table should not be discovered during a production incident.

# Production Considerations

- **Test rollback before deploy**: Run `php artisan migrate:rollback --step=1` in staging with production-sized data to measure rollback time. A rollback that takes hours in production is a deployment blocker.
- **Rollback kill switch**: Define a maximum acceptable rollback time (e.g., 5 minutes). If the actual rollback exceeds this, abort and fix forward instead of rolling back.
- **Code rollback coordination**: Database rollback must be coordinated with application code rollback. The application code must be at a version compatible with the rolled-back schema.
- **Queue job compatibility**: Queue jobs that reference the schema being rolled back must be allowed to drain before rollback. Estimate max job delay and add a buffer.
- **Backup before destructive migrate**: Before running any destructive migration in production, take a full database backup. Rollback is not a substitute for restore.

---

# Common Mistakes

**Rolling back a destructive migration immediately**: The migration drops a column. The rollback re-adds it. But queue jobs that ran during the rollback window tried to insert into the dropped column and failed. The data is lost.

**Assuming rollback is always possible without data loss**: Dropping a table and rolling back requires restoring from backup. Rollback is not a substitute for backup.

---

# Related Knowledge Units

1.18 Expand-contract pattern | 1.24 Schema and data migration separation | 1.10 Zero-downtime migration patterns

---

# Ecosystem Usage

Rollback strategy is a core consideration in Laravel deployment workflows. Forge and Envoyer deployment scripts typically include `php artisan migrate --force` but many omit rollback automation. Mature teams implement automated rollback in CI/CD: if health checks fail after deploy, the pipeline automatically runs `migrate:rollback` and rolls back the application code. Packages like `stancl/tenancy` implement per-tenant rollback for multi-tenant deployments. The Laravel community debate around "rollback vs fix-forward" generally favors fix-forward for destructive changes and rollback only for additive changes. SOC2 and PCI compliance require documented rollback procedures for all schema changes.

# Failure Modes

- **Partial rollback failure**: A rollback batch contains 5 migrations. The 3rd migration's `down()` fails. The first 2 are rolled back, the last 2 remain. The database is in an inconsistent state. Mitigation: use `--step=1` to roll back one migration at a time.
- **Data loss during column re-add**: Rolling back a DROP COLUMN re-adds the column but does not restore the deleted data. The column is NULL for all rows. Mitigation: take a backup before destructive operations.
- **Timeout during rollback**: A rollback attempts to rebuild an index on a 100M-row table. The operation exceeds the database statement timeout. The migration tool reports success but the index wasn't rebuilt. Monitor rollback execution.
- **Rollback of non-atomic operations**: Some DDL operations in MySQL implicitly commit the transaction. A rollback cannot undo these changes. The `down()` method must handle partial states.

---

# Research Notes

The most common rollback failure is timing: a team deploys a migration that drops a column, the deploy fails for an unrelated reason, the rollback re-adds the column, but data inserted during the rollback window (via queue jobs) is lost. Always maintain a compatibility window for destructive operations.
