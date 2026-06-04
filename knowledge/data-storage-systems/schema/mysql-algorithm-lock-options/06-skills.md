# Skill: Configure MySQL ALGORITHM and LOCK Options for Safe DDL

## Purpose

Specify explicit ALGORITHM (INSTANT, INPLACE, COPY) and LOCK (NONE, SHARED, EXCLUSIVE) options in MySQL ALTER TABLE statements to prevent silent fallback to blocking table copy operations — ensuring each DDL operation runs with the correct concurrency characteristics for zero-downtime deployment.

## When To Use

- Any ALTER TABLE in production MySQL environments
- Adding indexes to live tables
- Adding or dropping columns in production
- Changing column types or reorganizing tables

## When NOT To Use

- Non-production environments with lenient downtime requirements
- Operations that only support a single algorithm (test first)

## Prerequisites

- MySQL 5.6+ (INPLACE) or 8.0.12+ (INSTANT)
- Understanding of each operation's algorithm support
- Knowledge of table size and lock duration implications

## Inputs

- DDL operation type
- Desired concurrency level (allow reads, allow writes, or exclusive)
- MySQL version and algorithm support

## Workflow

1. Identify the DDL operation and check which ALGORITHM options it supports in the MySQL documentation
2. For column additions on MySQL 8.0.12+, use `ALGORITHM=INSTANT, LOCK=NONE`
3. For index additions/drops, use `ALGORITHM=INPLACE, LOCK=NONE` — allows concurrent DML during the rebuild
4. Always specify both ALGORITHM and LOCK explicitly — never rely on DEFAULT
5. If the operation doesn't support the specified ALGORITHM, MySQL raises an error rather than silently falling back to COPY
6. Test the ALTER on staging with production-scale data to measure actual lock duration

## Validation Checklist

- [ ] ALGORITHM and LOCK are both specified explicitly
- [ ] INSTANT preferred for supported operations on MySQL 8.0.12+
- [ ] INPLACE with LOCK=NONE for index operations
- [ ] COPY operations are scheduled during maintenance windows
- [ ] Tested on staging before production

## Common Failures

### Silent fallback to COPY
Specifying `ALGORITHM=DEFAULT` or omitting the clause entirely lets MySQL choose. It may choose COPY, holding EXCLUSIVE locks and blocking all DML for potentially hours. Always specify explicit ALGORITHM.

### LOCK=NONE not supported
Some operations (adding FULLTEXT index, dropping PK) don't support LOCK=NONE. MySQL raises an error — the migration fails. Test on staging first to discover unsupported combinations.

## Decision Points

### INSTANT vs INPLACE vs COPY?
INSTANT for metadata-only operations (column add, rename). INPLACE for operations requiring table rebuild (index add/drop, column drop). COPY only as last resort during maintenance windows.

### NONE vs SHARED vs EXCLUSIVE?
NONE for zero-downtime (allows concurrent DML). SHARED when reads must work but writes can pause. EXCLUSIVE for maintenance windows. Prefer NONE for production.

## Performance Considerations

INPLACE operations rebuild the entire table — ~2x table size in IO. INSTANT operations have negligible performance impact. COPY operations require disk space for the full table copy. Monitor `innodb_lock_wait_timeout` for long-running ALTER statements.

## Security Considerations

Specifying ALGORITHM=INPLACE, LOCK=NONE on an operation that doesn't support it causes an error — the migration fails, which may block deployment. Always test on staging first.

## Related Rules

- Always specify explicit ALGORITHM and LOCK
- Prefer INSTANT, then INPLACE with LOCK=NONE
- Test on staging with production-scale data

## Related Skills

- Use MySQL ALGORITHM=INSTANT for Metadata-Only DDL
- Run MySQL Online Schema Changes with gh-ost
- Run MySQL Online Schema Changes with pt-osc

## Success Criteria

- Every production ALTER TABLE specifies explicit ALGORITHM and LOCK
- No silent fallback to COPY blocks application traffic
- INSTANT used for column additions on MySQL 8.0.12+
- INPLACE with LOCK=NONE used for index operations
- COPY operations are rare and scheduled during maintenance windows
