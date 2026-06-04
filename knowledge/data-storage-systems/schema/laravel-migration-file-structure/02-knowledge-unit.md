# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.1 Laravel migration file structure (class, up/down, shouldRun)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel migrations are version-controlled schema definitions that allow teams to define, share, and roll back database changes. Each migration is a PHP class with `up()` and `down()` methods that describe forward and reverse schema operations. The migration file's timestamp prefix determines execution order. Since Laravel 9, anonymous classes eliminate class name collisions. Migrations enable reproducible database schemas across environments and are foundational to deployment safety.

---

# Core Concepts

- **Migration as version control for schemas**: Each file represents one atomic schema change (or group of related changes). The `migrations` table tracks which files have been executed and in which batch.
- **up() applies, down() reverses**: `up()` implements the forward change (create table, add column). `down()` is the exact inverse (drop table, remove column). Rollback iterates batches in reverse order.
- **Anonymous classes**: Since Laravel 9, `return new class extends Migration` prevents class name collisions in large teams.
- **shouldRun method**: Conditional execution — returns false to skip a migration. Useful for feature-gated schema changes or environment-specific migrations.
- **$connection property**: Explicitly set the database connection for multi-connection setups.

---

# Mental Models

Think of migrations as database commits. Each migration is a single logical change. The `migrations` table is the commit log. `up()` is the change itself; `down()` is the revert. Batch numbers group related changes into deployable units.

---

# Internal Mechanics

When `php artisan migrate` executes, Laravel:
1. Creates the `migrations` table if it doesn't exist
2. Reads all migration files from `database/migrations/` sorted by filename
3. Cross-references against the `migrations` table to find unexecuted files
4. Wraps each unexecuted migration in a database transaction (for databases that support DDL transactions)
5. Calls `up()`, records filename + batch number in `migrations` table
6. Batch number increments per `migrate` command execution (or per migration if `--step` is used)

`migrate:rollback` finds the highest batch number, fetches matching filenames, and calls `down()` on each in reverse order, then removes their entries.

---

# Patterns

**Single-responsibility migrations**: Each migration should do one thing (add a column, create a table, add an index). Avoid combining unrelated schema changes in one file.

**Idempotent down()**: `down()` must completely reverse `up()`. If `up()` adds a column with an index, `down()` must drop both. Failure to do so causes errors on rollback.

**Conditional migrations with shouldRun**: Use for migrations that should only apply in specific environments or when a feature flag is active.

---

# Architectural Decisions

| Decision | When | When Not |
|----------|------|----------|
| Anonymous class | New Laravel 9+ projects | Legacy projects with named classes |
| $connection override | Multi-DB setups | Single-connection apps |
| shouldRun | Feature-gated schemas | Core schema changes always needed |
| --step | When rollback granularity matters | Normal CI/CD where batch rollback is acceptable |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Version-controlled schema | Migration bloat over time | Periodic squashing required (`schema:dump`)
Reversible changes | Maintaining down() doubles effort | Critical for production safety
Batch grouping | Batch-level rollback undoes multiple migrations | --step for granular control increases complexity

---

# Performance Considerations

- Each migration runs in its own transaction (where supported). DDL operations on large tables may exceed transaction timeout.
- Schema dump (`schema:dump`) bypasses hundreds of small migration files for fresh installs, reducing initial migration time from minutes to seconds.
- The `migrations` table itself is tiny and incurs negligible overhead.

---

# Production Considerations

- **Migration immutability**: Never edit a migration that has been executed in any environment. Laravel reads the filename from the `migrations` table — if the filename exists, it skips it. Editing the file after execution means the change is never applied.
- **--force flag**: Required in production to bypass confirmation prompt. Always include in deployment scripts.
- **--isolated flag**: Prevents concurrent migration on multi-server deployments by acquiring a cache lock.
- **--pretend flag**: Outputs SQL without executing — essential for auditing migrations before production runs.
- **Never delete migration files** that have been run in any environment — rollback will fail because the class no longer exists.

---

# Common Mistakes

**Editing deployed migrations**: The `migrations` table has the filename recorded. Re-editing the class doesn't re-run it — the change silently never happens. Always create a new migration.

**Incomplete down()**: `up()` adds `->unique()` but `down()` only calls `dropColumn()` without `dropIndex()` first. This fails on rollback because the index still exists.

**Class name collisions in older Laravel**: Two developers create migrations with the same class name on the same day. Since Laravel 9, anonymous classes solve this.

---

# Failure Modes

- **Rollback fails because migration file is missing**: The entry in `migrations` table references a file that no longer exists. `down()` cannot be called. Recovery requires manual `DELETE FROM migrations WHERE migration = ?` or creating a replacement migration.
- **DDL transaction failure**: Some DDL operations implicitly commit the transaction (MySQL), making the migration non-atomic. Partial migration state can result.
- **shouldRun misconfiguration**: If `shouldRun` returns false in a production environment where the schema change is actually needed, the migration silently skips and the schema never updates.

---

# Ecosystem Usage

Laravel's migration system is the canonical way to manage schema changes. Packages like `stancl/tenancy` extend it for multi-tenant fan-out. The `isolated` option is critical for multi-server deployments (Octane, Horizon). Schema dumps are used in CI pipelines to speed up test database creation.

---

# Related Knowledge Units

1.7 Migration batch tracking and the migrations table | 1.8 Migration squashing | 1.20 Migration immutability | 1.9 Migration isolation

---

# Research Notes

Anonymous migrations eliminate class collision bugs. The `shouldRun` pattern is underused — teams deploy migrations with feature flags as a safer alternative to expand-contract for simple additive changes. The cost of long migration files is paid in CI time, not production safety.
