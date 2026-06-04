# Skill: Apply MySQL ALTER TABLE Algorithm Options for Safe DDL

## Purpose

Choose and specify explicit ALGORITHM (INSTANT, INPLACE, COPY) and LOCK (NONE, SHARED, EXCLUSIVE) options for MySQL ALTER TABLE operations based on the operation type, table size, and concurrency requirements — preventing silent fallback to blocking COPY operations in production.

## When To Use

- Any ALTER TABLE in production MySQL environments
- Adding columns or indexes to live tables
- Changing column types or reorganizing tables

## When NOT To Use

- Non-production environments where downtime is acceptable
- Operations that only support a single algorithm

## Prerequisites

- MySQL 5.6+ (INPLACE) or 8.0.12+ (INSTANT)
- Understanding of each operation's algorithm support

## Inputs

- DDL operation type
- Desired concurrency level
- MySQL version

## Workflow

1. Identify the DDL operation and determine supported algorithms
2. For column additions (append): use `ALTER TABLE t ADD COLUMN c INT, ALGORITHM=INSTANT, LOCK=NONE`
3. For index creation: use `ALTER TABLE t ADD INDEX i (c), ALGORITHM=INPLACE, LOCK=NONE`
4. For operations requiring COPY: schedule during a maintenance window
5. Always specify both ALGORITHM and LOCK explicitly — never rely on DEFAULT
6. If the operation doesn't support the specified options, MySQL raises an error instead of silently falling back

## Validation Checklist

- [ ] ALGORITHM and LOCK are both specified explicitly
- [ ] INSTANT preferred for supported operations on MySQL 8.0.12+
- [ ] INPLACE with LOCK=NONE for index and column drop operations
- [ ] COPY operations scheduled during maintenance windows
- [ ] Tested on staging before production

## Common Failures

### Silent fallback to COPY
Omitting ALGORITHM or using DEFAULT lets MySQL choose COPY, holding EXCLUSIVE locks and blocking all DML. Always specify explicit ALGORITHM.

### Non-append column addition with INSTANT
MySQL INSTANT only supports appending columns at the end. Adding a column in the middle requires INPLACE or COPY. Verify column position.

## Decision Points

### INSTANT vs INPLACE?
INSTANT for metadata-only operations (append column, rename column). INPLACE for operations needing table rebuild (index add/drop, column drop, column type change).

### NONE vs SHARED vs EXCLUSIVE?
NONE for zero-downtime (allows concurrent DML). SHARED when reads must work but writes can pause. EXCLUSIVE for maintenance windows only.

## Performance Considerations

INPLACE rebuilds the entire table — ~2x table size in IO. INSTANT is metadata-only with negligible impact. COPY operations need disk space for the full table copy. Monitor `innodb_lock_wait_timeout` for long-running ALTERs.

## Security Considerations

Specifying an unsupported ALGORITHM + LOCK combination causes an error — the migration fails. This prevents accidental blocking but may block deployment. Always test on staging.

## Related Rules

- Always specify explicit ALGORITHM and LOCK
- Prefer INSTANT, then INPLACE with LOCK=NONE
- Test on staging before production

## Related Skills

- Use MySQL ALGORITHM=INSTANT for Metadata-Only DDL
- Execute gh-ost Migrations
- Execute pt-osc Migrations

## Success Criteria

- Every production ALTER TABLE specifies explicit ALGORITHM and LOCK
- No silent fallback to COPY blocks application traffic
- INSTANT used for column additions on MySQL 8.0.12+
- INPLACE with LOCK=NONE used for index operations
- COPY operations are rare and scheduled during maintenance windows
