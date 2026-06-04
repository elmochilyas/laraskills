# Skill: Use MySQL ALGORITHM=INSTANT for Metadata-Only DDL

## Purpose

Apply MySQL 8.0.12+ ALGORITHM=INSTANT for supported operations (adding columns, renaming columns, adjusting defaults) to perform metadata-only schema changes that complete in milliseconds without table rebuilds, enabling zero-downtime migrations while tracking the 64-operation version limit.

## When To Use

- Adding columns to large MySQL tables (8.0.12+)
- Renaming columns (8.0.28+)
- Adding or dropping column defaults
- Modifying ENUM values

## When NOT To Use

- Dropping columns (requires INPLACE)
- Changing column types (requires INPLACE or COPY)
- Tables nearing the 64 INSTANT operation limit
- MySQL < 8.0.12

## Prerequisites

- MySQL 8.0.12+ (8.0.28+ for column rename)
- Knowledge of the 64-version INSTANT limit
- Monitor `TOTAL_ROW_VERSIONS` in INFORMATION_SCHEMA

## Inputs

- DDL operation type (column add, rename, default change)
- Target table name
- Current INSTANT version count for the table

## Workflow

1. Verify MySQL version supports INSTANT for the desired operation
2. Check the table's INSTANT version count: `SELECT TOTAL_ROW_VERSIONS FROM INFORMATION_SCHEMA.INNODB_TABLES WHERE NAME = 'db/table'`
3. If count < 60 (leaving buffer), proceed with INSTANT
4. Execute: `ALTER TABLE orders ADD COLUMN status INT ALGORITHM=INSTANT`
5. Verify the operation completed without falling back to INPLACE
6. After the migration, re-check the INSTANT version count

## Validation Checklist

- [ ] MySQL version supports INSTANT for the specific operation
- [ ] INSTANT version count < 60 before the operation
- [ ] ALTER TABLE explicitly specifies ALGORITHM=INSTANT
- [ ] Operation completes in milliseconds
- [ ] No fallback to INPLACE or COPY

## Common Failures

### 64-version limit exceeded
A table with 64+ INSTANT operations cannot accept more. Further DDL using INSTANT fails with error 4080. Schedule a table rebuild using ALGORITHM=INPLACE to reset the counter.

### Assuming INSTANT for all DDL
DROP COLUMN, index changes, and column type changes cannot use INSTANT. Verify operation support before relying on it.

## Decision Points

### INSTANT vs INPLACE?
INSTANT for column additions and renames (metadata only). INPLACE for index operations and column drops (table rebuild but concurrent DML allowed).

### Explicit ALGORITHM or DEFAULT?
Always specify `ALGORITHM=INSTANT` explicitly. If the operation doesn't support it, MySQL raises an error rather than silently falling back to a blocking COPY.

## Performance Considerations

INSTANT operations are metadata-only — milliseconds regardless of table size. Rows with mixed versions have slightly higher read overhead. After 64 INSTANT operations, a physical rebuild is forced—plan for periodic rebuilds.

## Security Considerations

INSTANT operations on tables with foreign key relationships have additional restrictions. Test on staging first. Replicas must be on MySQL 8.0.12+ to avoid replication errors.

## Related Rules

- Always specify explicit ALGORITHM
- Track INSTANT version count
- Plan periodic table rebuilds

## Related Skills

- Configure MySQL ALGORITHM/LOCK Options
- Execute Zero-Downtime Schema Changes
- Run MySQL Online Schema Changes with gh-ost

## Success Criteria

- Column additions complete in milliseconds regardless of table size
- INSTANT version count is tracked and stays below 64
- Explicit ALGORITHM=INSTANT prevents silent fallback to COPY
- Periodic rebuilds reset the INSTANT counter
- Replicas run compatible MySQL versions
