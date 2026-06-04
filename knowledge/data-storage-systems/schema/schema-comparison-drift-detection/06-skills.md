# Skill: Detect and Correct Schema Drift with Comparison Tools

## Purpose

Run periodic schema comparison between the expected schema (defined by migrations) and the actual database schema using INFORMATION_SCHEMA queries or schema dump diffing, detecting drift from manual changes, partial migration failures, or environment-specific alterations, and correcting drift via new migrations.

## When To Use

- Production environments with many developers having DB access
- After incident recovery where manual schema changes may have occurred
- Pre-deployment check to verify migration state
- Compliance and audit requirements

## When NOT To Use

- Local development environments (reset frequently)
- Read-only environments where drift is not possible

## Prerequisites

- Database access to INFORMATION_SCHEMA
- Migration files representing the expected schema
- Schema dump or comparison tooling

## Inputs

- Expected schema definition (migration files or schema dump)
- Actual database snapshot (INFORMATION_SCHEMA queries)
- Drift alerting thresholds

## Workflow

1. Generate the expected schema: `php artisan schema:dump` or generate a fresh database from migrations
2. Query the actual schema: `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'production'`
3. Compare expected vs actual: columns present in one but not the other, type mismatches, default differences, extra or missing indexes
4. For structural drift (columns, types, indexes): create a new migration to correct the drift
5. For metadata drift (auto-increment values, statistics): log and ignore — these are not structural changes
6. Schedule automated drift detection weekly in production, daily in staging
7. Block deployment if pre-deployment drift check detects unexpected differences

## Validation Checklist

- [ ] Drift detection runs on a regular schedule
- [ ] Pre-deployment drift check is part of the CI/CD pipeline
- [ ] Structural drift corrected via new migrations, not manual ALTER
- [ ] Metadata drift distinguished from structural drift
- [ ] Drift alerts are actionable and routed to the right team

## Common Failures

### Correcting drift manually
Manually ALTERing the database to match expected state creates further drift because the manual correction isn't in a migration. Always create a new migration.

### Ignoring minor drift
A column default that differs by 1 character may indicate someone manually altered the database, potentially making other undetected changes. Investigate all drift.

## Decision Points

### INFORMATION_SCHEMA vs schema dump diffing?
INFORMATION_SCHEMA for automated scheduled checks. Schema dump diff for manual troubleshooting. Both approaches are complementary — use both.

### Scheduled vs pre-deployment checks?
Both. Weekly scheduled checks catch drift that accumulates between deployments. Pre-deployment checks ensure the schema is in a known state before running new migrations.

## Performance Considerations

INFORMATION_SCHEMA queries are lightweight for individual databases (< 1 second). For multi-tenant deployments, aggregation queries can take minutes. Schema dump comparison has negligible runtime cost (operates on files). Scheduled checks should run during low-traffic windows.

## Security Considerations

INFORMATION_SCHEMA contains full table metadata. Limit access to the comparison tool user. Comparison results may reveal sensitive column names or table structures — secure the output.

## Related Rules

- Correct drift via new migrations, not manual ALTER
- Distinguish structural from metadata drift
- Block deployment on unexpected drift

## Related Skills

- Squash Migrations with schema:dump
- Maintain Migration Immutability
- Test Migrations in CI

## Success Criteria

- Schema drift is detected within 24 hours of occurrence
- All drift corrections use new migration files
- Pre-deployment checks catch drift before migrations run
- False positives from metadata drift are filtered out
- Drift is trending toward zero over time
