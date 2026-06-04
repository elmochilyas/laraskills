# Skill: Run Pre-Deployment Migration Validation Checklist

## Purpose

Execute a final validation checklist before deploying a production migration — checking disk space, long-running queries, backup recency, rollback plan, and staging test results — using an Artisan command that blocks deployment if any check fails.

## When To Use

- Before any production schema migration
- Before deploying risky or destructive migrations
- As part of CI/CD deployment gate

## When NOT To Use

- Local development
- Emergency hotfixes bypassing normal validation

## Prerequisites

- Database monitoring access (disk, process list, backups)
- Migration tested on staging with production-like data
- Rollback plan documented

## Inputs

- Target table and migration script
- Database monitoring metrics
- Staging test results

## Workflow

1. Check database storage space: `SELECT SUM(data_length + index_length) FROM information_schema.tables WHERE table_schema = 'production'` — ensure enough free space
2. Check for long-running queries: `SHOW FULL PROCESSLIST` or `SELECT * FROM pg_stat_activity` — kill blocking queries
3. Confirm recent backup exists and is restorable
4. Verify CI migration tests passed (syntax, forward, rollback)
5. Confirm migration was tested on staging with production-like data volume
6. Verify maintenance window is active (if applicable)
7. Run `php artisan migrate:check` — an Artisan command that runs all checks and exits with error if any fail

## Validation Checklist

- [ ] Disk space sufficient for the operation (shadow table, rebuild)
- [ ] No long-running queries that could block DDL
- [ ] Recent backup exists and restore was verified
- [ ] CI migration tests passed
- [ ] Migration tested on staging with production-like data
- [ ] Rollback plan documented and tested
- [ ] Maintenance window is active (if required)

## Common Failures

### Skipping validation before production migration
"It worked in staging" — staging data differs from production scales. Always run validation checks against production (read-only checks) before running DDL.

### Insufficient disk space for shadow table
Online DDL tools create shadow tables that double storage requirements. Check free space before starting any tool-based migration.

## Decision Points

### Automated vs manual validation?
Automated via `php artisan migrate:check` for standard migrations. Manual checklist walkthrough for high-risk or destructive migrations. Automation catches common issues; manual review catches context-specific ones.

### Pre-deployment vs real-time monitoring?
Pre-deployment checks catch issues before they cause problems. Real-time monitoring during the migration catches issues that arise during execution. Both are needed.

## Performance Considerations

Most validation checks are lightweight (INFORMATION_SCHEMA queries, process list checks). Disk space calculation may take a few seconds for large databases. Schedule pre-checks to run 5 minutes before the intended migration window.

## Security Considerations

Validation scripts access production monitoring data. Ensure the validation user has read-only access. Validation results may reveal production details — secure the output.

## Related Rules

- Run pre-deployment validation checks
- Verify disk space before DDL operations
- Test migration on staging before production

## Related Skills

- Test Migrations in CI
- Verify Data Integrity During Migrations
- Prevent Metadata Lock Contention

## Success Criteria

- Pre-deployment validation catches disk space, blocking queries, and backup issues
- Automated `migrate:check` blocks deployment on failure
- Staging tests with production-like data validate migration behavior
- Rollback plan is confirmed tested
- Maintenance window compliance is verified
