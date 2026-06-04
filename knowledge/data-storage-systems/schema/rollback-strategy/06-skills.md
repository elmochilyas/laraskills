# Skill: Design Safe Rollback Strategies for Each Migration Type

## Purpose

Categorize migrations by rollback safety (additive vs destructive) and apply appropriate rollback timings — immediate for additive changes, delayed with compatibility windows for destructive changes — ensuring rollback never loses data and accounts for all running code paths including delayed queue jobs.

## When To Use

- Planning migration rollback before deployment
- Assessing rollback risk for destructive operations
- Testing rollback procedures in staging

## When NOT To Use

- Local development (migrate:fresh resets everything)
- Read-only schema changes with zero rollback risk

## Prerequisites

- Understanding of additive vs destructive schema operations
- Knowledge of compatibility windows for code references
- Backup infrastructure for data recovery

## Inputs

- Migration operation type (additive, destructive, rename)
- Table size and data volume
- Code reference analysis (queue jobs, long-running processes)

## Workflow

1. Classify the migration: additive (CREATE, ADD COLUMN, ADD INDEX), destructive (DROP, ALTER TYPE), or rename
2. For additive operations: rollback is safe immediately — no data loss, no code breakage
3. For destructive operations: never roll back immediately. First deploy code that stops referencing the old structure. Wait 24-48 hours. Then roll back.
4. For rename operations: use expand-contract with dual-write. Rollback = stop writing to new, revert to old.
5. Always test the rollback path in staging before deploying to production
6. Include `if deploy fails, run migrate:rollback --step` in deployment scripts

## Validation Checklist

- [ ] Migration type classified as additive or destructive
- [ ] Additive rollback tested and confirmed safe
- [ ] Destructive rollback has compatibility window defined
- [ ] Queue jobs and long-running processes accounted for
- [ ] Deployment script includes rollback step
- [ ] Rollback tested in staging environment

## Common Failures

### Rolling back a destructive migration immediately
The migration drops a column. The rollback re-adds it. But queue jobs that ran during the rollback window tried to insert into the dropped column — data is lost permanently.

### Assuming rollback is always possible
Dropping a table and rolling back requires a backup restore. Rollback is not a substitute for backup. Always have a pre-migration backup for destructive operations.

## Decision Points

### Immediate vs delayed rollback?
Immediate for additive changes (CREATE TABLE, ADD COLUMN, ADD INDEX). Delayed with 24-48h window for destructive changes (DROP COLUMN, DROP TABLE, ALTER TYPE).

### --step single vs batch rollback?
Use `--step=1` to roll back one migration at a time for maximum safety. This prevents partial batch failure where the first few migrations roll back but later ones fail.

## Performance Considerations

Additive rollbacks complete in milliseconds (metadata-only). Destructive rollbacks that re-add columns and backfill data can take hours. Test rollback time in staging. Budget rollback time in the deployment window.

## Security Considerations

A pre-migration backup is the only true safety net for destructive operations. Rollback of DROP TABLE requires point-in-time recovery from backup. Document the backup and restore procedure.

## Related Rules

- Immediate rollback for additive changes
- 24-48h compatibility window for destructive changes
- Test rollback before deployment
- Pre-migration backup for destructive ops

## Related Skills

- Execute Expand-Contract Pattern
- Separate Schema and Data Migrations
- Plan Rollback for Production Migrations

## Success Criteria

- Additive migrations are rolled back immediately and safely
- Destructive migrations have documented compatibility windows
- All rollback paths are tested in staging
- Pre-migration backups exist for destructive operations
- Deployment scripts include automated rollback steps
