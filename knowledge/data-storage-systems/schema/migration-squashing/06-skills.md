# Skill: Squash Migrations with schema:dump for Fast Fresh Installs

## Purpose

Run `php artisan schema:dump` to consolidate hundreds of migration files into a single SQL schema file, reducing fresh-install migration time from minutes to seconds for CI pipelines, new developer setups, and automated testing environments.

## When To Use

- Projects with 50+ migration files causing slow `migrate:fresh`
- CI pipelines spending significant time on migration replay
- Before major releases to compress migration history

## When NOT To Use

- Small projects with < 30 migrations
- Projects still actively iterating schema in early development
- Environments where rollback from the squashed state is anticipated

## Prerequisites

- Laravel 8+ with `schema:dump` command
- Database client installed (mysqldump, pg_dump) on the execution environment
- All migrations must be immutable before squashing

## Inputs

- Database connection name
- Decision to prune original migration files or keep them

## Workflow

1. Ensure all migrations have been run and the schema is up to date
2. Verify that all existing migrations are immutable and will not be edited
3. Run `php artisan schema:dump` to generate `database/schema/{connection}.sql`
4. Commit the generated dump file to version control
5. Optionally add `--prune` to delete original migration files (only after team-wide coordination)
6. Verify the dump file executes correctly on a fresh database
7. In CI, confirm the schema dump is used instead of individual migrations

## Validation Checklist

- [ ] Schema dump file is generated and committed to VC
- [ ] Dump was generated from the production-matching database engine
- [ ] `--prune` is only used after coordinating with the entire team
- [ ] CI pipeline executes the dump faster than individual migrations
- [ ] Schema dump regenerated after significant schema changes

## Common Failures

### Pruning too early
Deleting migration files with `--prune` before the team has pulled the latest prevents local migration replay. Only prune after all developers have merged and no rollback from the squashed state is anticipated.

### Missing database client
If `mysqldump` or `pg_dump` is not installed on the CI server, `schema:dump` may fail silently. Verify the dump file is valid and non-empty.

## Decision Points

### schema:dump with or without --prune?
Without `--prune`, migration files accumulate but remain available for rollback. With `--prune`, the directory is clean but old migrations are permanently removed. Only prune during release stabilization.

### Regeneration frequency?
Regenerate after every significant schema change or before major releases. Stale dumps cause confusion when developers examine migration history.

## Performance Considerations

Fresh migration time drops from minutes to seconds on large histories. Existing environments see zero performance change — they continue individual migration execution. Schema dump files can be large but execute as a single batch.

## Security Considerations

The schema dump contains full table definitions. Review for sensitive column comments or metadata before committing to version control if the repository has broad access.

## Related Rules

- Only prune after team coordination
- Regenerate after significant schema changes
- Verify dump file validity in CI

## Related Skills

- Manage Migration Batch Tracking
- Create Anonymous Migration Classes
- Configure Migration Ordering and Naming

## Success Criteria

- Fresh migrations execute in seconds using the schema dump
- Dump file is committed and version-controlled
- Team coordinates before pruning original files
- CI pipeline benefits from faster schema loading
- Dump is regenerated after major schema changes
