# Skill: Execute Destructive Schema Operations Safely

## Purpose

Apply safe practices for destructive DDL (DROP COLUMN, DROP TABLE, TRUNCATE) by using a phased approach with deprecated suffixes, waiting periods, and pre-operation backups — never performing destructive operations as the first step in a migration.

## When To Use

- Removing deprecated columns or tables
- Cleaning up schema after expand-contract migrations
- Dropping indexes or constraints that are no longer needed

## When NOT To Use

- Production environments without a compatibility window
- Without a tested rollback plan and backup
- For columns that may still be referenced by running code

## Prerequisites

- Code reference analysis confirming zero references to the dropped structure
- Pre-operation backup or snapshot
- Compatibility window has passed (24-48h after read switch)

## Inputs

- Structure to drop (column, table, index, constraint)
- Backup strategy
- Code reference verification results

## Workflow

1. Add `_deprecated` suffix to the column name (or rename table to `_old`) — this breaks any code that still references it
2. Monitor application error logs for references to the deprecated structure
3. If no errors after 1-2 weeks, proceed with the DROP
4. Take a backup of the affected data before dropping
5. Execute the DROP as a standard migration
6. Remove any `_deprecated` references from application code in a subsequent deploy

## Validation Checklist

- [ ] Compatibility window has passed without errors
- [ ] Application logs show zero references to the structure
- [ ] Backup taken before the destructive operation
- [ ] Migration DDL is tested on staging
- [ ] Rollback plan exists (restore from backup)

## Common Failures

### DROP COLUMN as part of standard workflow
Adding and dropping columns in successive migrations seems clean but the data in the dropped column is permanently lost. Use expand-contract for any column that contains meaningful data.

### No backup before DROP
If a DROP migration is rolled back, the column is re-added but the data is gone forever. Always take a backup before destructive DDL.

## Decision Points

### Deprecated suffix vs direct DROP?
Deprecated suffix for columns that may have lingering references. Direct DROP for structures verified to have zero references. The suffix approach is safer but takes longer.

### DROP vs archive (RENAME)?
Rename to `_archive` first, wait 30 days, then DROP. The archive table provides a safety net and can be queried if needed. Only DROP directly when disk space is critical.

## Performance Considerations

DROP COLUMN in MySQL requires a table rebuild (INPLACE). In PostgreSQL, DROP COLUMN is metadata-only but the space isn't reclaimed until VACUUM FULL. DROP TABLE is always instantaneous.

## Security Considerations

Data dropped via DDL is not recoverable without a backup. Point-in-time recovery may have gaps. Ensure backup retention policies cover the period since the dropped data was created.

## Related Rules

- Never destroy data without a backup
- Use deprecated suffix + wait period before DROP
- Verify zero code references before removal

## Related Skills

- Design Rollback Strategies
- Execute Expand-Contract Pattern
- Plan and Execute Safe Migration Rollbacks

## Success Criteria

- Destructive operations only after verified zero references
- Pre-operation backup exists and is tested
- Deprecated suffix period catches lingering references
- Data is recoverable from backup if needed
- Application logs confirm no breakage after removal
