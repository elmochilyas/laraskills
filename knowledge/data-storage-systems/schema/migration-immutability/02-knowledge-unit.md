# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.20 Migration immutability (no editing deployed migrations)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Once a migration file has been deployed to any environment (local, staging, production), it must never be edited. The `migrations` table records the filename — editing the file after execution means the change is silently skipped on subsequent `migrate` runs. This is the most important rule of migration management in Laravel.

---

# Core Concepts

- **filename-based tracking**: The `migrations` table stores only the migration filename (without `.php`). Laravel compares this list to the filesystem to determine which migrations have run.
- **Silent skip**: If you edit a deployed migration, its filename is already in the `migrations` table. Laravel sees it as "already run" and skips it. The edit is never applied.
- **Rollback implications**: If you edit a deployed migration and then roll it back, the `down()` method reflects the edited version, not the original. The rollback may not correctly reverse the applied change.
- **Team synchronization**: If developer A edits a deployed migration and developer B pulls the change, developer B's `migrations` table (which has the original filename) doesn't match the new content. The edit is silently ignored for developer B.

---

# Mental Models

Treat migrations as append-only log entries. You can add to the log (new migration), but you can't change history. If you need to fix a mistake, write a corrective migration.

---

# Internal Mechanics

Laravel's `Migrator` class:
1. Reads all filenames from the `migrations` table.
2. Reads all filenames from `database/migrations/`.
3. Computes the difference (files in filesystem but not in table).
4. Only those unmatched files' `up()` methods are executed.

Editing a file that's already in the table doesn't change step 4 — it's still in the table, still skipped.

---

# Patterns

**Corrective migration**: Instead of editing an existing migration, run `php artisan make:migration fix_column_name_on_table` and write the correction there.

**Rollback + re-run for local only**: In local development, if a migration hasn't been pushed to any shared branch, you can rollback, edit, and re-run. Anything pushed = immutable.

---

# Architectural Decisions

| Approach | When | When Not |
|----------|------|----------|
| Create new migration | Any deployed migration | Unpushed local migrations |
| Rollback + edit + re-run | Local, unpushed migrations only | Migrations on shared branches |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Deterministic migration history | Proliferation of fix migrations | More migration files over time
No silent schema divergence | Temptation to edit anyway | Discipline required in code review

---

# Performance Considerations

Migration immutability itself has no direct performance cost — the `migrations` table lookup is a simple filename comparison. However, the corrective migrations that immutability forces do accumulate over time. A schema with 200 migrations that could have been 50 editable migrations takes longer to replay on `migrate:fresh`. This is mitigated by `schema:dump` (Laravel 8+). The performance cost of immutability is paid in file count and CI time, not in query performance or production DDL speed.

---

# Production Considerations

- **Code review rule**: Reject PRs that modify existing migration files. Enforce this via CI or commit hooks.
- **Squashing hides edits**: If you edit a deployed migration and then run `schema:dump`, the schema dump captures the edited state. The next person running `migrate:fresh` gets the edited schema, not the original. This masks the immutability violation.

---

# Common Mistakes

**The most common Laravel migration mistake**: Editing a deployed migration to fix a typo in column name. The edit is silently ignored in all environments where the migration has already run. Developers think the fix is applied, but it's not.

**Editing to add a missing index**: Adding `->index()` to a migration that already ran. The index is never created. The developer wonders why queries are slow.

---

# Failure Modes

- **Rollback inconsistency**: A deployed migration is edited. The edited `down()` doesn't correctly reverse the originally applied `up()`. Rollback leaves the database in an inconsistent state.
- **Environment drift**: The production migration was run before an edit, but a new staging environment is created after the edit. Production and staging have different schema states.

---

# Ecosystem Usage

Laravel's migration immutability rule is enforced organizationally rather than technically — there is no framework-level check preventing edits. CI tools like Laravel Shift and GrumPHP can include automated checks that reject PRs modifying deployed migration files. In practice, large Laravel teams (Spark, Tighten, Laravel News) enforce immutability through code review policies and squash commit policies. The `schema:dump` command serves as an escape valve: instead of editing a migration, teams dump the entire schema and start fresh.

---

# Related Knowledge Units

1.1 Migration file structure | 1.6 Migration ordering and naming | 1.7 Migration batch tracking

---

# Research Notes

This rule is violated more often than any other migration practice. The violation is usually undetected because the edit is "obviously correct" and CI passes (CI tests use `migrate:fresh`, which applies all migrations as if none have run). The production schema silently diverges from what the migration files describe.
