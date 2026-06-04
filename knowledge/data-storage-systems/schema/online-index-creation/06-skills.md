# Skill: Create Indexes Online Without Blocking Writes

## Purpose

Use PostgreSQL `CREATE INDEX CONCURRENTLY` or MySQL `ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE` to build indexes on large production tables without blocking concurrent INSERT, UPDATE, or DELETE operations, while respecting the limitation that CONCURRENTLY cannot run inside a transaction.

## When To Use

- Adding indexes to tables with > 10M rows receiving live traffic
- Any index creation on 24/7 production tables
- Environments where even brief write blocking is unacceptable

## When NOT To Use

- Small tables (< 1M rows) where standard index creation is fast enough
- During maintenance windows where locking is acceptable
- Tables that are read-only or have no concurrent write load

## Prerequisites

- PostgreSQL 9.2+ for CONCURRENTLY support
- Understanding that CONCURRENTLY cannot run inside a transaction
- MySQL 5.6+ for online DDL support

## Inputs

- Index definition (columns, index type, name)
- Table size and write throughput
- Database engine and version

## Workflow

1. For PostgreSQL: create a separate, single-operation migration file
2. Use `DB::statement('CREATE INDEX CONCURRENTLY idx_orders_status ON orders (status)')` — raw SQL outside any transaction
3. Ensure this migration is the ONLY operation in its file
4. For MySQL: use `DB::statement('ALTER TABLE orders ADD INDEX idx_status (status) ALGORITHM=INPLACE, LOCK=NONE')`
5. Verify the index was created successfully — for PostgreSQL, check for INVALID state
6. For multiple concurrent indexes, create separate migration files for each

## Validation Checklist

- [ ] CONCURRENTLY is used for PostgreSQL indexes on large tables
- [ ] PostgreSQL migration is the only operation in its file
- [ ] MySQL ALTER TABLE specifies ALGORITHM=INPLACE, LOCK=NONE
- [ ] Index state is VALID after creation (PostgreSQL)
- [ ] No invalid indexes left after failed CONCURRENTLY builds

## Common Failures

### CONCURRENTLY inside a transaction
PostgreSQL prohibits this. The migration must use raw `DB::statement()` outside any transaction wrapper. If Laravel wraps migrations in transactions, disable for this specific migration.

### Multiple CONCURRENTLY statements in one migration
Each TRIGGERs an implicit COMMIT, but the second fails. Create separate, single-operation migration files for each CONCURRENTLY index.

## Decision Points

### CONCURRENTLY vs standard index creation?
CONCURRENTLY for all indexes on tables > 1M rows with active write traffic. Standard for smaller tables where the lock duration is acceptable.

### Single vs multiple migration files?
One migration per CONCURRENTLY index. They cannot share a transaction, and separate files ensure each gets its own batch.

## Performance Considerations

CONCURRENTLY takes 2-3x longer than standard index creation. Additional IO may slow write operations slightly. The `maintenance_work_mem` setting in PostgreSQL affects build speed. Monitor replication lag during index creation.

## Security Considerations

A failed CONCURRENTLY operation leaves an invalid index that takes up space but is unused. Monitor for invalid indexes and clean up. The brief exclusive lock at finalization can block if long-running transactions are active.

## Related Rules

- Use CONCURRENTLY for indexes on large PostgreSQL tables
- Each CONCURRENTLY index in its own migration
- Monitor for invalid index state after failed builds

## Related Skills

- Define Indexes in Migrations
- Configure MySQL ALGORITHM/LOCK Options
- Monitor Index Bloat and Maintenance

## Success Criteria

- Indexes on large tables are created without write blocking
- PostgreSQL CONCURRENTLY indexes are in separate migration files
- No invalid indexes remain after failed builds
- MySQL indexes use INPLACE with LOCK=NONE
- Application traffic is unaffected during index creation
