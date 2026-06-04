# Database Migration CI

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Database Deployment
- **Knowledge Unit:** Database Migration CI
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Database Migration in CI covers running Laravel migrations as part of the CI/CD pipeline, ensuring schema changes are tested and applied consistently. Migrations must be idempotent, use `--force`, and handle the timing challenge of new code needing new schema while old code runs simultaneously during zero-downtime deployments.

---

## Core Concepts

- **Forward-Compatible Migrations** — Schema changes that work with both old and new code during deployment overlap
- **Migration Timing** — Run before code deploy (for zero-downtime) or during maintenance window
- **CI Test Database** — Isolated database for migration testing in the pipeline
- **Migration Locking** — Preventing concurrent migration execution with `migrate --isolated`

---

## Mental Models

- **CI as Schema Safety Net** — CI tests catch migration errors before they reach production. A migration that passes CI may still fail in production (different data volume), but CI catches syntax errors, missing columns, and constraint violations.
- **Production Data Volume Is Uniquely Challenging** — Small test databases don't catch performance issues in migrations. Test with production-like data volume to identify slow migrations before they block production.
- **Migration Lock as Concurrency Guard** — Without locking, two concurrent deployments can attempt to run migrations simultaneously, causing race conditions and schema corruption.

---

## Internal Mechanics

In a CI/CD pipeline, a database migration step creates or uses an existing test database, runs `php artisan migrate --force`, and verifies the migration completes successfully. The pipeline may also run `php artisan migrate:rollback --force` to test reversibility. For production deployment, the pipeline runs `php artisan migrate --force` against the production database (or staging first). Migration locking (`--isolated`) acquires a database lock to prevent concurrent migration execution. CI databases are typically service containers (GitHub Actions) or ephemeral databases created per pipeline run.

---

## Patterns

- **Test with Production-Like Data** — Use anonymized production data or generated data at production scale to catch performance issues
- **Run Migrations in Staging First** — Apply migrations to staging before production to catch environment-specific issues
- **Use Migration Lock** — `php artisan migrate --isolated` prevents concurrent migration execution
- **Monitor Migration Duration** — Track migration execution time; alert on significant increases

---

## Architectural Decisions

- **CI Test Database: Service Container vs. External** — Use service containers for isolated, disposable databases in CI; use external databases when specific configurations or data volumes are needed
- **Migration Location: Before vs. After Deploy** — Run before deploy for zero-downtime (schema ready before new code); run after deploy when schema changes require maintenance mode
- **Database Provider: MySQL vs. PostgreSQL** — Test against the same database provider and version used in production to catch provider-specific issues

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Catches migration errors before production | CI database must match production schema | Schema drift between CI and production causes false negatives |
| Tests reversibility with rollback verification | Test data volume may not match production | Performance issues only appear in production |
| Automated migration execution prevents human error | Migration locking adds deployment time | Lock acquisition and verification add seconds to deploy |
| Consistent migration process across environments | CI database creation overhead | Service container startup adds to pipeline time |

---

## Performance Considerations

Migration execution time in CI should be monitored as a trend — sudden increases indicate schema changes that need optimization. Service container database startup time adds 10-30s to pipeline. Data seeding for tests increases pipeline time but catches more issues. Online schema change tools run separately and are not tested in standard CI migration steps.

---

## Production Considerations

Always test migrations in CI before production deployment. Use the same database engine and version as production for CI tests. Implement migration locking (`--isolated`) for production deployments. Monitor migration duration and failure rates. Have a rollback plan for every migration. Run data migrations (data movement, backfill) as separate, tested steps.

---

## Common Mistakes

- **Testing with Small Data Only** — Migrations that pass CI with tiny datasets fail in production on large tables. Test with production-like data volume.
- **No Migration Lock** — Concurrent deployments run migrations simultaneously, causing race conditions. Use `--isolated`.
- **No Rollback Testing** — `down()` method is untested and fails when rollback is needed. Test rollback in CI.
- **Different Database Engine in CI** — CI uses SQLite while production uses MySQL. Provider-specific syntax errors only appear in production.

---

## Failure Modes

- **Migration Passes CI, Fails in Production** — Different data volume or existing data constraints cause failure. Detection: production deployment fails. Mitigation: use production-like data in CI, run in staging first.
- **Migration Lock Wait Timeout** -- Migration lock is held by another process. Detection: pipeline fails with lock acquisition timeout. Mitigation: increase lock timeout, implement deployment serialization.
- **CI Database Schema Drift** -- CI database schema diverges from production. Detection: migration test passes but production migration encounters unexpected schema state. Mitigation: periodically refresh CI database schema from production.

---

## Ecosystem Usage

Database migration CI is integrated into all major Laravel CI/CD workflows. GitHub Actions uses MySQL/PostgreSQL service containers for migration testing. GitLab CI uses DIND-based databases. Deployer and Envoyer both support migration execution in deployment recipes. Laravel's `--isolated` flag (added in Laravel 10) provides native migration locking for safe concurrent deployment.

---

## Related Knowledge Units

### Prerequisites
- Laravel migrations, CI/CD basics

### Related Topics
- Automated Migration Deployment
- Zero-Downtime Migration
- Rollback Strategies

### Advanced Follow-up Topics
- Online Schema Change Tools (pt-online-schema-change, gh-ost)

---

## Research Notes

Test migrations in CI with production-like data volume to catch performance issues. Use the same database engine as production. Implement migration locking with `--isolated` for safe concurrent deployments. Test rollback in CI. Run migrations in staging first before production. Monitor migration duration as a key CI metric.
