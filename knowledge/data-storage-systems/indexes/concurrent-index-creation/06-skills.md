# Skill: Create Indexes Concurrently for Zero-Downtime

## Purpose

Use PostgreSQL `CREATE INDEX CONCURRENTLY` and MySQL `ALGORITHM=INPLACE LOCK=NONE` to add indexes to large tables under live traffic without blocking writes — essential for production index additions on tables with > 1M rows.

## When To Use

- Adding indexes to production tables with live traffic
- Large tables (> 1M rows) that can't tolerate write locks
- Online schema changes during business hours

## When NOT To Use

- Small tables (index creation is fast enough without concurrency)
- Tables in maintenance mode (where locks are acceptable)
- Inside a database transaction (CONCURRENTLY can't run in a transaction)

## Prerequisites

- Understanding of lock contention during DDL operations
- Knowledge that CONCURRENTLY takes 2-3x longer than standard creation

## Inputs

- Index definition (table, columns, type)
- Database type (PostgreSQL vs MySQL)
- Traffic pattern (read/write ratio during creation)

## Workflow

1. For PostgreSQL: `DB::statement('CREATE INDEX CONCURRENTLY idx_name ON table (col)')`
2. For MySQL: `DB::statement('ALTER TABLE table ADD INDEX idx_name (col), ALGORITHM=INPLACE, LOCK=NONE')`
3. Verify the index exists and is not in INVALID state (PostgreSQL)
4. Monitor for failures — if CONCURRENTLY fails, the index is left in INVALID state

## Validation Checklist

- [ ] CONCURRENTLY not used inside a transaction (PostgreSQL)
- [ ] Only one CONCURRENTLY per migration file (PostgreSQL)
- [ ] MySQL uses explicit ALGORITHM=INPLACE LOCK=NONE
- [ ] Invalid indexes are detected and recreated if CONCURRENTLY fails

## Common Failures

### CONCURRENTLY inside transaction
PostgreSQL raises error. Must use raw `DB::statement()` outside transaction.

### Multiple CONCURRENTLY in one migration
Each CONCURRENTLY triggers an implicit commit. Only one per migration file.

### Ignoring invalid indexes
If CONCURRENTLY fails, the index remains in INVALID state. Must be dropped and recreated.

## Decision Points

### CONCURRENTLY vs standard creation?
CONCURRENTLY for any table with live traffic. Standard creation for maintenance windows or small tables.

### One big migration vs multiple small ones?
Each CONCURRENTLY gets its own migration. This means more migration files but safer execution.

## Performance Considerations

CONCURRENTLY takes 2-3x longer and uses more resources (CPU, I/O) during creation. Monitor system resources during concurrent index builds.

## Security Considerations

Concurrent index creation doesn't affect security. Ensure proper permissions for DDL operations.

## Related Rules

- Always use CONCURRENTLY for production index creation
- Run CONCURRENTLY outside transactions
- One CONCURRENTLY per migration file

## Related Skills

- Maintain and Rebuild Indexes for Bloat Management
- Manage Indexes in Laravel Migrations
- Assess Over-Indexing Risks

## Success Criteria

- Index created without blocking writes on production
- PostgreSQL CONCURRENTLY not inside a transaction
- Invalid indexes detected and recreated if CONCURRENTLY fails
- MySQL uses explicit ALGORITHM=INPLACE LOCK=NONE
