# Automated Migration Deployment

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Database Deployment
- **Knowledge Unit:** Automated Migration Deployment
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Automated migration deployment runs database migrations as part of the CI/CD pipeline, ensuring schema and code stay synchronized with zero manual intervention. Migrations must be idempotent, run with `--force` to bypass production prompts, and execute in the correct order relative to code deployment to handle the fundamental tension of new code needing new schema while old code may still be running.

---

## Core Concepts

- **Idempotent Migrations** — Safe to run multiple times without error; the `migrations` table tracks which have been applied
- **--force Flag** — Suppresses production confirmation prompt in `artisan migrate` for automated execution
- **Migration Ordering** — Run before symlink swap (zero-downtime) or after (maintenance window) depending on strategy
- **Migration Tracking** — `migrations` table records which migrations have been applied to prevent re-execution

---

## Mental Models

- **Schema as Code** — Database schema changes are code changes. They should go through the same CI/CD pipeline as application code: reviewed, tested, versioned, and deployed automatically.
- **Dual-Version Compatibility** — During deployment, both old and new code may run simultaneously (blue-green, canary). Schema changes must be compatible with both versions.
- **Idempotency as Safety Net** — If a migration runs twice (due to retry, race, or manual intervention), it should produce the same result without errors.

---

## Internal Mechanics

When a deployment pipeline runs, the migration step executes `php artisan migrate --force` against the target database. Laravel checks the `migrations` table to determine which migrations have not yet been applied. Each pending migration runs the `up` method, which typically executes `CREATE TABLE`, `ALTER TABLE`, or data manipulation statements. After each migration succeeds, Laravel records the migration name in the `migrations` table. If a migration fails, the database schema may be in an inconsistent state — `migrate:rollback` can reverse the last batch.

---

## Patterns

- **Always Use --force** — Production deploy scripts must include `--force` to skip the confirmation prompt
- **Test Migrations in CI** — Run migrations against a test database in CI to catch errors before production
- **Make Migrations Reversible** — Always implement both `up` and `down` methods for rollback capability
- **Separate Schema from Data** — Schema migrations should be reversible and fast; data migrations are separate and require additional testing

---

## Architectural Decisions

- **Migration Before vs. After Code Deploy** — Run before deploy for zero-downtime (schema is ready when new code receives traffic); run after deploy for maintenance windows
- **Single Migration vs. Online Schema Change** — Use standard migrations for small tables (< 1M rows); use online schema change tools for large tables
- **Automated vs. Manual Migrations** — Automate for standard deployments; require manual execution for high-risk schema changes

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Schema and code stay synchronized | Migration timing complexity | Wrong ordering causes application errors during deploy |
| Zero manual intervention reduces human error | Irreversible migration risk | Must implement `down()` methods for rollback |
| Migrations tested in CI before production | CI test database must match production schema | Schema drift between CI and production causes test failures |
| Idempotency prevents duplicate execution | Migration failure handling | Failed migrations require manual intervention to resolve |

---

## Performance Considerations

Migration execution time directly extends deployment duration. Large migrations (adding indexes, altering large tables) can take minutes. Test migration performance with production-like data volume in CI. Run schema changes during low-traffic periods. Use online schema change (pt-online-schema-change, gh-ost) for large tables. Monitor migration duration in CI trends over time.

---

## Production Considerations

Always run migrations with `--force` in automated deployments. Test migrations against a staging database before production. Implement migration locking (`migrate --isolated` in Laravel 10+) to prevent concurrent execution. Monitor migration duration and failure rates. Have a rollback plan for every migration. Run non-disruptive schema changes (ADD COLUMN, ADD INDEX) first; separate destructive changes (DROP COLUMN, RENAME) into a follow-up deploy.

---

## Common Mistakes

- **Missing --force Flag** — Deployment script runs `php artisan migrate` without `--force`, causing the pipeline to hang waiting for production confirmation input.
- **No Reversible Migrations** — Migration defines only `up` with no `down` method, making rollback impossible or dangerous.
- **Migration After Code Deploy** — Running migrations after the symlink swap means new code is live before the schema is ready, causing errors for users.
- **No Migration Testing** — Deploying untested migrations that work in development but fail in production due to data volume or existing data constraints.

---

## Failure Modes

- **Migration Failure Mid-Batch** — One migration in a batch fails. Detection: pipeline error, partially migrated schema. Mitigation: manually roll back the failed batch, identify and fix the migration, re-run.
- **Data Migration Timeout** — Data movement migration exceeds execution time limit. Detection: migration fails with timeout error. Mitigation: run data migrations as separate batches with smaller data sets.
- **Duplicate Migration Execution** — Migration runs despite already being applied. Detection: duplicate migration entry in `migrations` table. Mitigation: ensure migrations are idempotent; use `Schema::hasTable()`, `Schema::hasColumn()` checks.
- **Schema Lock Contention** — Migration acquires table lock during peak traffic. Detection: application errors, long-running queries queued behind lock. Mitigation: use online schema change for large tables, run during low traffic.

---

## Ecosystem Usage

Laravel's migration system (`php artisan make:migration`, `php artisan migrate`) is the standard mechanism for schema changes. Automated migration deployment is integrated with all deployment tools: Forge deployment scripts, Envoyer hooks, Deployer recipes, Vapor deploy commands, and CI/CD pipelines. The `--force` flag and `--isolated` (migration lock) flag are Laravel-native. Online schema change tools (pt-online-schema-change, gh-ost) are used as alternatives for large tables.

---

## Related Knowledge Units

### Prerequisites
- Laravel migrations, CI/CD basics

### Related Topics
- Database Migration CI (testing migrations in pipeline)
- Zero-Downtime Migration (large table schema changes)
- Rollback Strategies (safe migration reversal)

### Advanced Follow-up Topics
- Online Schema Change Tools
- Database Versioning

---

## Research Notes

Automated migration deployment is essential for synchronized schema and code changes. Always use `--force` in automated pipelines. Test migrations in CI with production-like data volume. Run migrations before code deploy for zero-downtime. Implement reversible migrations with `down()` methods. Use migration locking to prevent concurrent execution. Separate schema changes from data migrations.
