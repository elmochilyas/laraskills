# Skill: Maintain Migration Immutability After Deployment

## Purpose

Enforce the rule that migration files are never edited after being deployed to any environment, using corrective migrations instead of edits, and reserving rollback + edit + re-run exclusively for unpushed local development to prevent silent schema drift and rollback inconsistencies.

## When To Use

- Correcting a mistake in a deployed migration
- Adding missing indexes or constraints
- Fixing column types or defaults in a migration
- Any migration that has been pushed to a shared branch

## When NOT To Use

- Unpushed local migrations that have only run on your local database
- Rolling back and re-running migrations on a fresh local environment

## Prerequisites

- Understanding that the `migrations` table tracks filenames, not file content
- Awareness that editing a deployed migration silently skips the change

## Inputs

- Deployed migration that needs correction
- Nature of the correction (schema fix, data fix, index addition)

## Workflow

1. Identify the deployed migration with the error or missing change
2. If the migration hasn't been pushed to any shared branch: rollback (`migrate:rollback`), edit the file, re-run
3. If the migration has been pushed (deployed to any shared environment): leave it unchanged
4. Create a new migration: `php artisan make:migration fix_column_name_on_posts_table`
5. Write the corrective action in the new migration's `up()` method
6. Ensure the new migration's timestamp places it after the original
7. Deploy the new migration as part of the normal deployment process

## Validation Checklist

- [ ] No deployed migration files have been edited
- [ ] Corrective migrations exist for all deployed migration mistakes
- [ ] New migration timestamps sort correctly after the original
- [ ] Original migration's `down()` method is NOT modified

## Common Failures

### Editing a deployed migration
The change is silently ignored in all environments where the migration has already run. Developers think the fix is applied but it's not. Always create a new corrective migration.

### Rollback inconsistency
An edited `down()` method doesn't match the originally applied `up()`. Rollback leaves the database in an inconsistent state. Never edit deployed migrations.

## Decision Points

### Editable vs immutable?
If the migration has run on any environment except your local dev DB, it's immutable. The rule: if it's been pushed to any branch, it's immutable.

### Corrective migration vs rollback + re-run?
Corrective migration for any deployed migration. Rollback + re-run is ONLY acceptable for unpushed local migrations.

## Performance Considerations

Corrective migrations accumulate over time. A schema with 200 migrations instead of 50 takes longer on `migrate:fresh`. Mitigate with `schema:dump` to compress migration history.

## Security Considerations

Rollback of a fixed migration can leave data inconsistent if the corrective migration is rolled back before the original error is re-introduced. Plan rollback order carefully.

## Related Rules

- Never edit deployed migrations
- Create corrective migrations for fixes
- Rollback + edit only for unpushed local migrations

## Related Skills

- Create Anonymous Migration Classes
- Manage Migration Batch Tracking
- Squash Migrations with schema:dump

## Success Criteria

- No deployed migration files are ever edited
- All fixes use corrective migrations with proper ordering
- Local development uses rollback + edit for unpushed changes
- Team convention prevents migration file modifications post-deployment
