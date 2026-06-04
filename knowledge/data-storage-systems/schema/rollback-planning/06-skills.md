# Skill: Plan and Execute Safe Migration Rollbacks

## Purpose

Design tested rollback plans for every migration — immediate rollback for additive changes, phased rollback with compatibility windows for destructive changes, and pre-destructive-operation snapshots for DROP operations — ensuring rollback never loses data and is tested before production deployment.

## When To Use

- Planning any production migration
- Before executing destructive schema operations
- When writing deployment scripts with rollback steps

## When NOT To Use

- Local development (migrate:fresh)
- Read-only schema changes

## Prerequisites

- Understanding of additive vs destructive migration types
- Backup infrastructure for data recovery
- Rollback testing process

## Inputs

- Migration operation type
- Data volume for re-backfill estimation
- Backup availability

## Workflow

1. Classify the migration as additive, destructive, or rename
2. For additive (CREATE, ADD COLUMN): rollback is safe immediately — test with `migrate:rollback --step=1`
3. For destructive (DROP TABLE, DROP COLUMN): take a pre-migration backup or snapshot first
4. For destructive: deploy code that stops referencing old structures, wait 24-48h, then drop
5. Always test rollback in staging with production-like data
6. Include `if deploy fails, run migrate:rollback --step` in deployment scripts

## Validation Checklist

- [ ] Migration type classified correctly
- [ ] Additive rollback tested via migrate:rollback --step
- [ ] Pre-destructive-operation backup exists
- [ ] Rollback tested in staging environment
- [ ] Deployment script includes automated rollback

## Common Failures

### No down() method
"We'll never roll back" — but you will. Always write a `down()` method, even if it's just `Schema::dropIfExists()`.

### Rolling back destructive migration immediately
Data dropped by DROP COLUMN is gone. Rollback re-adds the column but not the data. Always take a backup before destructive operations.

## Decision Points

### --step=1 vs batch rollback?
`--step=1` for maximum safety — rolls back one migration at a time. Batch rollback for speed when all migrations are additive.

### Backup vs snapshot?
Full backup for DROP TABLE/DROP COLUMN. Logical snapshot for smaller changes. Ensure backup restore is tested.

## Performance Considerations

Additive rollbacks complete in milliseconds. Destructive rollbacks that re-add columns and backfill data can take hours. Test rollback time in staging. Budget rollback time in the deployment window.

## Security Considerations

Pre-migration backup is the only safety net for destructive operations. Document the backup and restore procedure. Verify backup integrity before proceeding with destructive operations.

## Related Rules

- Always write a down() method
- Test rollback before deployment
- Backup before destructive operations

## Related Skills

- Design Rollback Strategies
- Execute Expand-Contract Pattern
- Destroy Schema Elements Safely

## Success Criteria

- Every migration has a tested rollback plan
- Additive migrations roll back immediately and safely
- Destructive migrations have backups and compatibility windows
- Deployment scripts include automated rollback steps
- Rollback is tested in staging with production-like data
