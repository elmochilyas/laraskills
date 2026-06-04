# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.8 Migration squashing (schema:dump, database/schema directory)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Migration squashing consolidates hundreds of individual migration files into a single SQL schema file using `php artisan schema:dump`. This dramatically reduces migration time for fresh installs (CI, new developers) by executing one SQL file instead of hundreds of PHP classes. Squashing is safe because Laravel only uses the schema dump when no migrations have been executed — existing environments are unaffected.

---

# Core Concepts

- **schema:dump command**: Generates `database/schema/{connection}.sql` containing the full CREATE TABLE SQL for the schema.
- **Execution order**: On a fresh database, Laravel executes the schema dump SQL first, then runs any remaining migration files not included in the dump.
- **Safety**: The schema dump is only used when the `migrations` table is empty. Existing environments continue to run individual migrations.
- **Per-connection dumps**: `php artisan schema:dump` generates separate dump files per database connection.
- **Git management**: The schema dump file should be committed to version control.

---

# Mental Models

Think of a schema dump as a database snapshot for greenfield environments. It's a shortcut that replaces running 100+ migration files sequentially. Existing databases don't use it — they continue their normal migration path.

---

# Internal Mechanics

`php artisan schema:dump` internally:
1. Dumps the current database schema to SQL using the database's native dump client (mysqldump, pg_dump)
2. Writes to `database/schema/{connection}.sql`
3. Optionally deletes the original migration files with `--prune` (USE WITH CAUTION)

When `php artisan migrate` starts on a fresh DB:
1. Checks if `migrations` table exists and is empty
2. If empty, executes the schema dump SQL as a single operation
3. Marks all migrations included in the dump as executed (batch 1)
4. Runs any remaining migrations not covered by the dump

---

# Patterns

**Squash before major releases**: After stabilizing a version, run `schema:dump` to compress the migration history. Future migrations build on the squashed state.

**Keep schema dump in CI**: CI pipelines benefit most — instead of running 200 migrations every test run, they execute one SQL file.

**--prune only after full confidence**: The `--prune` option deletes original migration files after squashing. Only prune after all team members have pulled the latest and no rollback from the squashed state is anticipated.

---

# Architectural Decisions

| Decision | When | Risk |
|----------|------|------|
| schema:dump without --prune | Regular maintenance | Migration files accumulate |
| schema:dump with --prune | Release stabilization | Permanently removes old migration files |
| No squashing | Small projects (< 30 migrations) | CI time wasted on old migrations |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
~10x faster fresh migrations | Cannot see individual migration history | Loss of per-migration granularity
Smaller migration directory after --prune | Cannot roll back to pre-squash state | Rollback uses schema dump as base
CI speed improvement | Must re-dump when schema changes | Periodic maintenance task

---

# Performance Considerations

- Fresh migration time drops from minutes to seconds on large migration histories.
- Schema dump files can be large (thousands of lines) on complex schemas, but execute as a single batch.
- Existing environments see zero performance change — they continue individual migration execution.

---

# Production Considerations

- **Never run schema:dump directly on production** — it may briefly hold schema locks. Run on a staging copy or during maintenance windows.
- **Keep the schema dump in version control** — it becomes part of the deployment artifact and enables new environments to bootstrap quickly.
- **Verify the schema dump** after generation by running migrations in a fresh database before deploying.

---

# Common Mistakes

**Pruning too early**: Deleting original migration files with `--prune` before the team has pulled the latest changes prevents their local migrations from matching the schema dump.

**Quietly accepting an incorrect dump**: If the database client (mysqldump/pg_dump) is not installed on the CI server, `schema:dump` fails silently. Verify the dump file is generated and valid.

**Forgetting to regenerate**: After significant schema changes, the schema dump becomes stale. New migrations build on the dump, but the dump should be regenerated periodically.

---

# Failure Modes

- **Schema dump from wrong environment**: Dumping a staging database that has manual schema changes missing from migrations creates a dump that doesn't match the migration record.
- **Incompatible dump format**: The MySQL dump may not be compatible with MariaDB or vice versa. Only use on matching database engines.

---

# Ecosystem Usage

Laravel Forge and Vapor both support schema dumps in deployment pipelines. CI tools like GitHub Actions and GitLab CI benefit from faster migration execution via schema dumps.

---

# Related Knowledge Units

1.6 Migration ordering | 1.7 Migration batch tracking | 1.20 Migration immutability

---

# Research Notes

The `schema:dump` feature is underused by most teams. On projects with 200+ migrations, squashing reduces CI pipeline time by 30-60 seconds per run. The `--prune` option is dangerous in team environments — coordinate with all developers before deleting original migration files.
