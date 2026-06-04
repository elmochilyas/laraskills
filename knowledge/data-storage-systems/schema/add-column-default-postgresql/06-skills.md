# Skill: Add Columns with Defaults on PostgreSQL 11+ for Zero Downtime

## Purpose

Use PostgreSQL 11+ metadata-only `ALTER TABLE ADD COLUMN ... DEFAULT` for non-volatile defaults to add columns instantly without table rewrites, then use `NOT VALID` + `VALIDATE` for zero-lock NOT NULL constraint enforcement — enabling zero-downtime column additions on any size table.

## When To Use

- Adding columns with constant defaults to any PostgreSQL table
- Adding NOT NULL columns to large production tables
- PostgreSQL 11+ environments

## When NOT To Use

- Adding columns with volatile defaults (gen_random_uuid, clock_timestamp)
- PostgreSQL < 11
- Columns where the default must be computed at insert time from application state

## Prerequisites

- PostgreSQL 11+
- Default expression must be immutable or stable (non-volatile)

## Inputs

- Column name, type, and default value
- NOT NULL requirement
- Table name

## Workflow

1. Determine default volatility — must be non-volatile for metadata-only addition
2. For additive columns: `ALTER TABLE orders ADD COLUMN status INT NOT NULL DEFAULT 0` — instant
3. For adding NOT NULL to existing column: `ALTER TABLE orders ADD CONSTRAINT status_not_null CHECK (status IS NOT NULL) NOT VALID`
4. Then: `ALTER TABLE orders VALIDATE CONSTRAINT status_not_null` — scans table without blocking writes
5. Finally: `ALTER TABLE orders ALTER COLUMN status SET NOT NULL` — metadata-only after constraint validation

## Validation Checklist

- [ ] Default expression is non-volatile (constant, immutable function)
- [ ] Column addition completes in milliseconds
- [ ] NOT NULL uses NOT VALID + VALIDATE pattern
- [ ] Existing rows return the default value correctly on read
- [ ] No table rewrite occurred

## Common Failures

### Volatile default triggers rewrite
`gen_random_uuid()`, `clock_timestamp()`, `random()` as default force full table rewrite. Use stable defaults only for metadata addition.

### NOT NULL validation table scan
`ALTER COLUMN SET NOT NULL` on an existing nullable column requires full table scan with ACCESS EXCLUSIVE lock. Use NOT VALID + VALIDATE pattern instead.

## Decision Points

### Add with default vs add nullable?
Add with default when a sensible constant exists. Add nullable for columns where existing data should remain NULL. The default approach uses the catalog; nullable requires no default storage.

### NOT VALID + VALIDATE vs simple SET NOT NULL?
NOT VALID + VALIDATE for zero-lock constraint enforcement on large tables. Simple SET NOT NULL for small tables where a brief lock is acceptable.

## Performance Considerations

Read performance for existing rows is slightly slower (catalog lookup). After enough UPDATE operations rewrite all rows, the value is physically stored. The initial addition is O(1). The VALIDATE phase scans the table but only holds a SHARE UPDATE EXCLUSIVE lock.

## Security Considerations

Verify default volatility using `pg_get_expr()`. Monitor catalog bloat from frequent add/drop operations. Physical standbys must run PostgreSQL 11+ for DDL compatibility.

## Related Rules

- Use non-volatile defaults for metadata-only additions
- Add NOT NULL via NOT VALID + VALIDATE for zero-lock
- Verify default volatility before execution

## Related Skills

- Execute pgroll Migrations
- Select Zero-Downtime Migration Approach
- Configure MySQL ALGORITHM/LOCK Options

## Success Criteria

- Column additions complete in milliseconds regardless of table size
- Non-volatile defaults enable metadata-only operation
- NOT NULL constraints use NOT VALID + VALIDATE
- No table rewrites or lock contention during migration
