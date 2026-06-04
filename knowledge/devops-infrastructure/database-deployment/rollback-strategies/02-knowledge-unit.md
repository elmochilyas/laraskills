# Rollback Strategies

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Database Deployment
- **Knowledge Unit:** Rollback Strategies
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Rollback strategies for Laravel database deployments define how to safely revert schema changes when a deployment fails. The core challenge is that code rollback is instant (symlink swap) but database rollback is complex because data may have been transformed or deleted. Strategies include reversible migrations, expand-migrate-contract patterns, and automated rollback scripts.

---

## Core Concepts

- **Reversible Migration** — `up` and `down` methods that can undo schema changes completely
- **Expand-Migrate-Contract** — Three-phase pattern for safe destructive changes: add new columns (expand), deploy new code, remove old columns (contract)
- **Checkpoint Migrations** — Savepoints before high-risk schema changes for partial rollback
- **Automated Rollback** — CI/CD pipeline rollback trigger that reverses database and code changes together

---

## Mental Models

- **Code Rollback Is Instant, Database Rollback Is Complex** — Code rollback is a symlink swap (milliseconds). Database rollback requires executing `down()` methods that may not fully reverse data transformations.
- **You Cannot "Un-delete" Data** — Once data is deleted by a migration, rollback cannot restore it unless the migration explicitly backs it up. Design migrations to never delete data during the rollback window.
- **Expand-Migrate-Contract as Safety** -- The expand phase creates the new structure without removing the old. The old code continues to work. Only after the code switch is confirmed safe does the contract phase remove old structures.

---

## Internal Mechanics

When a rollback is triggered, `php artisan migrate:rollback` reads the `migrations` table to identify the last batch of migrations and runs each migration's `down()` method in reverse order. The `down()` method must reverse the schema changes made by `up()`. For data migrations, `down()` must also reverse data transformations. If `down()` fails or is incomplete, the database schema may be left in an inconsistent state. Automated rollback in CI/CD runs `migrate:rollback` and redeploys the previous code version.

---

## Patterns

- **Always Implement down()** — Every migration should have a tested `down` method that fully reverses the schema change
- **Test Rollback in Staging** -- Run `migrate:rollback` in staging to verify it works before production deployment
- **Automate Rollback in CI/CD** — Include a rollback step in the deployment pipeline for one-click recovery
- **Document Irreversible Changes** — Some changes (data pruning, archival) are irreversible by design. Document and warn before deployment.

---

## Architectural Decisions

- **Reversible Migration vs. Expand-Migrate-Contract** — Use reversible migrations for additive changes (new tables, new columns); use expand-migrate-contract for destructive changes (column removal, table rename)
- **Manual vs. Automated Rollback** — Use automated rollback for standard deployments; require manual rollback for complex schema changes that need human judgment
- **Rollback vs. Fix Forward** — Choose rollback when the issue is in the deployment process or migration; choose fix forward when the issue is minor and can be corrected with a follow-up migration

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Safe reversal of schema changes | `down()` doubles migration maintenance | Every migration must implement and test reversal |
| Expand-migrate-contract for zero-downtime | Three-step process takes multiple deployments | Destructive changes require extended timeline |
| Automated rollback in CI/CD | Rollback may not fully restore data | Data transformations may not be exactly reversible |
| Checkpoints for partial rollback | Increased complexity | Overhead for migrations that rarely need rollback |

---

## Performance Considerations

Rollback execution time equals migration execution time. For large tables, `down()` methods that recreate dropped columns may take as long as the original `up()`. Data migration rollback (reversing data transformations) can be slow on large datasets. Test rollback performance with production-like data volume. Monitor rollback duration in CI/CD pipelines.

---

## Production Considerations

Test every migration's `down()` method in staging before production deployment. Document irreversible changes and communicate them to the team before deployment. Include rollback in the deployment runbook. Ensure the CI/CD pipeline has a rollback trigger that reverses both code and database changes. Verify rollback capability after every production deployment.

---

## Common Mistakes

- **Skipping down() Implementation** — Migration defines only `up()` with no `down()`. Rollback is impossible without manually writing a reverse migration.
- **Destructive Changes Without Expand-Migrate-Contract** — Dropping or renaming columns without the three-phase pattern. Rollback loses data irreversibly.
- **No Rollback Testing** — `down()` method is assumed to work without testing. When rollback is needed, it fails.
- **Data Migration Without Reversibility** — Data transformation migration (e.g., merging user profiles) doesn't implement reverse transformation. Rollback loses data.

---

## Failure Modes

- **Rollback Migration Fails** — `down()` method encounters an error (missing column, constraint violation). Detection: `migrate:rollback` returns error. Mitigation: manually craft rollback SQL, restore from backup.
- **Irreversible Data Migration** -- Data has been transformed and cannot be reversed. Detection: rollback completes but data is corrupted. Mitigation: restore from database backup, migrate forward again.
- **Incomplete Rollback** — Part of a batch rolls back successfully but one migration fails. Detection: inconsistent schema state. Mitigation: resolve the failing migration and continue rollback.
- **Schema-Out-of-Sync After Partial Rollback** -- Manual intervention creates divergence between `migrations` table and actual schema. Detection: future migrations behave unexpectedly. Mitigation: manually reconcile `migrations` table with schema state.

---

## Ecosystem Usage

Laravel's `migrate:rollback` command provides native rollback capability. The `migrate:reset` command rolls back all migrations. `migrate:refresh` rolls back and re-runs all migrations. CI/CD pipelines integrate rollback as a deployment step. Envoyer and Deployer support rollback hooks. Database backup (RDS snapshots, mysqldump) serves as the ultimate fallback when migration rollback is not possible.

---

## Related Knowledge Units

### Prerequisites
- Laravel migrations, deployment basics

### Related Topics
- Zero-Downtime Migration
- Automated Migration Deployment
- Database Migration CI

### Advanced Follow-up Topics
- Online Schema Change
- Point-in-Time Recovery

---

## Research Notes

Database rollback is fundamentally different from code rollback. Always implement and test `down()` methods. Use expand-migrate-contract for destructive changes. Test rollback in staging. Automate rollback in CI/CD. Document irreversible changes. Database backups are the ultimate fallback when migration rollback fails.
