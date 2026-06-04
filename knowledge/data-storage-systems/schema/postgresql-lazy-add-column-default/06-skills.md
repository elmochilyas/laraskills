# Skill: Use PostgreSQL Lazy ADD COLUMN DEFAULT for Instant DDL

## Purpose

Add columns with non-volatile defaults to PostgreSQL 11+ tables as metadata-only operations that complete in milliseconds regardless of table size, leveraging PostgreSQL's catalog-based default storage to avoid table rewrites and enable zero-downtime schema evolution.

## When To Use

- Adding columns with constant or immutable defaults to any PostgreSQL table
- Adding NOT NULL columns with defaults to large production tables
- PostgreSQL 11+ environments

## When NOT To Use

- Adding columns with volatile defaults (gen_random_uuid, clock_timestamp, random)
- PostgreSQL < 11
- Adding columns that require immediate NOT NULL validation on existing rows

## Prerequisites

- PostgreSQL 11+
- Understanding of default volatility (immutable vs stable vs volatile)
- Knowledge of `pg_attrdef` catalog

## Inputs

- Column name, type, and default value expression
- NOT NULL requirement
- Table name

## Workflow

1. Determine the default value expression — must be non-volatile for metadata-only addition
2. Execute: `ALTER TABLE orders ADD COLUMN status INT NOT NULL DEFAULT 0;` — instant in PG 11+
3. Verify the column exists and existing rows return the default value on read
4. If the column must enforce NOT NULL, add as nullable first, then use `NOT VALID` + `VALIDATE` for zero-lock constraint addition
5. For volatile defaults (gen_random_uuid), add the column as nullable with no default, then backfill, then set default

## Validation Checklist

- [ ] PostgreSQL version is 11+
- [ ] Default expression is non-volatile
- [ ] DDL completes in milliseconds regardless of table size
- [ ] Existing rows return the default value correctly
- [ ] NOT NULL validation uses NOT VALID + VALIDATE pattern if needed

## Common Failures

### Volatile default triggers rewrite
`ALTER TABLE ... ADD COLUMN ... DEFAULT gen_random_uuid()` rewrites the entire table. Use stable defaults only for metadata-only addition. Backfill volatile defaults separately.

### NOT NULL validation table scan
Setting NOT NULL on an existing nullable column requires a full table scan with ACCESS EXCLUSIVE lock. Use `NOT VALID` + `VALIDATE` to avoid blocking writes.

## Decision Points

### Add with default vs add nullable then backfill?
Add with default when a sensible constant default exists. Add nullable for columns where existing rows should remain NULL. The default approach is instant; the nullable approach requires an additional ALTER for NOT NULL.

### Non-volatile vs volatile default?
Non-volatile (constant, NOW()) — metadata-only. Volatile (random, gen_random_uuid) — table rewrite. Choose non-volatile defaults when possible.

## Performance Considerations

Read performance is slightly slower for existing rows (catalog lookup). After enough UPDATE operations rewrite all rows, the default is physically stored. The initial addition is O(1).

## Security Considerations

Verify default volatility using `SELECT pg_get_expr(adbin, adrelid) FROM pg_attrdef`. Monitor catalog bloat from frequent add/drop default operations. Physical standbys must run PG 11+ for compatibility.

## Related Rules

- Use non-volatile defaults for metadata-only additions
- Add NOT NULL via NOT VALID + VALIDATE for zero-lock
- Verify default volatility before execution

## Related Skills

- Execute Zero-Downtime Schema Changes
- Run PostgreSQL Zero-Downtime Migrations with pgroll
- Reclaim PostgreSQL Bloat with pg_repack

## Success Criteria

- Column additions complete in milliseconds regardless of table size
- Non-volatile defaults enable metadata-only operation
- NOT NULL constraints use NOT VALID for zero-downtime
- Existing physical standbys are PG 11+ compatible
