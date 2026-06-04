# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.28 Migration testing in CI (same engine and version as production)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Migrations must be tested in CI using the same database engine AND version as production. MySQL 8.0 behavior differs from MySQL 5.7; PostgreSQL 15 differs from PostgreSQL 16. A migration that works on SQLite (default test DB) may fail on PostgreSQL in production. CI migration testing must run against a database matching production configuration, including storage engine, SQL mode, and version-specific DDL behavior.

---

# Core Concepts

- **Engine mismatch**: Laravel's default test environment uses SQLite. Migrations that use MySQL-specific syntax (e.g., `after()`, `fullText()`) fail silently or produce different schemas.
- **Version-specific DDL**: `ALGORITHM=INSTANT` requires MySQL 8.0.12+. MySQL 5.7 doesn't support it. CI running on 8.0 may not catch 5.7 incompatibilities.
- **SQL mode differences**: MySQL's strict mode affects DDL validation. A migration that creates a column with an invalid default may pass in one SQL mode but fail in another.
- **Schema dump compatibility**: Schema dumps generated on one engine version may not be compatible with another (e.g., MySQL 8.0 dump syntax vs MariaDB).

---

# Mental Models

The database is a dependency with version-specific behavior, like a package. Test your migration code against the exact database version that runs in production — just as you test PHP code against the production PHP version.

---

# Patterns

**GitHub Actions matrix**: Run migration tests against the same database service (e.g., `services: mysql:8.0.36`) used in production. Use a matrix for multiple supported databases.

**Docker-based CI**: Spin up a production-matching database container, run `migrate --force`, then run the test suite. If the migration fails, CI fails.

**Schema comparison test**: After running migrations, compare the resulting schema against an expected schema file to detect drift.

---

# Architectural Decisions

| CI Database | When | Risk |
|------------|------|------|
| SQLite (default) | Local dev, unit tests | Misses engine-specific issues |
| MySQL 8.0 container | CI for MySQL production | Docker container may differ from managed RDS |
| PostgreSQL 16 container | CI for PostgreSQL production | Minor version edge cases |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Production-matching CI catches DDL issues | Slower CI (database container startup) | Adds 10-30 seconds per CI run
Schema comparison tests | Requires maintaining expected schema file | Schema drift is caught early
Multiple DB version testing | CI matrix complexity | Ensures compatibility across versions

---

# Common Mistakes

**Using SQLite for migration tests**: `after()` modifier (MySQL-specific) silently ignored in SQLite. Migration passes in CI but produces incorrect schema in production.

**Testing migrations against wrong database version**: CI runs MySQL 8.3 but production runs MySQL 5.7. Migration uses `ALGORITHM=INSTANT` which doesn't exist in 5.7.

**Not testing rollback**: CI tests `migrate --force` but not `migrate:rollback`. A migration with incorrect `down()` passes CI but fails during production rollback.

---

# Related Knowledge Units

1.28 Migration testing | 1.8 Migration squashing | 1.7 Migration batch tracking

---

# Ecosystem Usage

Migration testing in CI is a standard practice in the Laravel ecosystem. GitHub Actions with Docker services is the most common approach — spinning up MySQL or PostgreSQL containers matching the production version. Laravel Shift's automated upgrade service includes migration compatibility checks. Forge deployment scripts can include pre-deployment migration dry-runs. Envoyer supports zero-downtime deployments with health check validation after migrations. Third-party CI providers like Laravel Cloud and Platform.sh provide production-matching database services as part of their deployment environments.

# Failure Modes

- **SQLite blind spot**: Tests pass on SQLite (default test DB) but the migration uses MySQL-specific syntax (`after()`, `fullText()`, `ALGORITHM=INSTANT`). The migration silently produces a different schema in production. Mitigation: always run migration tests against the production database engine.
- **Version-specific DDL failure**: A migration uses `ALGORITHM=INSTANT` tested on MySQL 8.0. Production runs MySQL 5.7. The migration fails during deployment. Mitigation: match CI database version exactly to production.
- **Migration order dependency**: CI runs `migrate:fresh` (all migrations from scratch). Production applies migrations incrementally. A migration that works on fresh may fail when applied incrementally due to missing intermediate states. Test both fresh and incremental.
- **Rollback untested**: CI tests `migrate --force` but never runs `migrate:rollback`. The rollback fails in production during a deploy incident. Mitigation: include rollback in CI migration tests.

# Performance Considerations

- Spinning up a database container in CI adds 10-30 seconds to job startup time. Use Docker layer caching to pre-pull database images.
- Running `migrate:fresh` with 200+ migrations can take 30-60 seconds. Use `schema:dump` for faster initial schema loading.
- Running migration tests in parallel across multiple database versions multiplies compute cost. Use CI matrix builds to parallelize.
- Database container resource limits affect migration speed. Allocate sufficient CPU/memory for the container to avoid false test failures due to timeouts.

# Production Considerations

- **Exact version matching**: Pin the database container image tag to the exact production version (e.g., `mysql:8.0.36` not `mysql:8`). Minor version differences can cause DDL behavior changes.
- **SQL mode replication**: Match the production SQL mode in CI. `STRICT_TRANS_TABLES` affects default value validation and column type coercion.
- **Storage engine verification**: Ensure CI uses the same storage engine as production (InnoDB vs MyISAM). Schema behavior differs significantly between engines.
- **Test rollback**: Always include `php artisan migrate:rollback --step=1` in the CI migration test. Verify the rollback produces the expected schema state.
- **Seed data compatibility**: If migration tests include seed data, ensure the seeds are compatible with the schema at every migration step, not just the final state.

# Internal Mechanics

CI migration testing follows this pipeline:
1. Start database container with production-matching configuration (MySQL 8.0.36 or PostgreSQL 16).
2. Wait for database health check to pass.
3. Run `php artisan migrate:fresh --force` to apply all migrations from scratch.
4. Run schema comparison: SELECT all table structures via `INFORMATION_SCHEMA` and compare against expected schema snapshot.
5. Run `php artisan migrate:rollback --step=1` to verify the most recent migration's `down()` method works.
6. Run `php artisan migrate --force` to re-apply the rolled-back migration.
7. Execute application test suite against the migrated database.
8. Clean up: stop and remove the database container.

For incremental testing (mimicking production deployment):
1. Start from a database state matching current production.
2. Apply only pending migrations (simulating the deploy).
3. Verify the schema transition between known states.

---

# Research Notes

The most common CI migration testing gap is engine mismatch (SQLite vs production database). The second most common is not testing rollback. A comprehensive CI migration test should: (1) run on production-matching database, (2) apply all migrations, (3) run `migrate:rollback --step=1`, (4) verify schema state, (5) re-apply the rolled-back migration.
