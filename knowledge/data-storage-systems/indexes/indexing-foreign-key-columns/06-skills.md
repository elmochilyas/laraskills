# Skill: Index Foreign Key Columns for JOIN Performance

## Purpose

Ensure all foreign key columns are indexed — using Laravel's `constrained()` which auto-indexes, or adding explicit `index()` when using manual FK definitions — to prevent full table scans on JOIN queries between related tables.

## When To Use

- Defining foreign keys in migrations
- Adding indexes to existing FK columns
- Code review of migration files

## When NOT To Use

- FK columns already covered by a composite index (check for redundancy)
- Very small lookup tables where full table scan is cheaper than index lookup

## Prerequisites

- Understanding of FK and index relationship
- Knowledge of `constrained()` vs manual foreign() behavior

## Inputs

- FK column definition in migration
- Related table and column
- Existing indexes on the FK column

## Workflow

1. Use `$table->foreignId('user_id')->constrained()` — this creates FK + index automatically
2. If using manual FK: `$table->foreign('user_id')->references('id')->on('users')` — also add `$table->index('user_id')`
3. Check if FK column is already covered by a composite index
4. Verify with EXPLAIN that JOINs on the FK use an index

## Validation Checklist

- [ ] All FK columns have an index (either standalone or as part of a composite)
- [ ] constrained() is preferred over manual foreign() for simplicity
- [ ] No redundant standalone FK index if composite already covers it
- [ ] MySQL InnoDB auto-indexes FKs; PostgreSQL does not

## Common Failures

### Manual FK without index
The most common FK performance mistake. JOIN queries on the FK column perform full table scans.

## Decision Points

### constrained() vs manual foreign() + index()?
Use constrained() for simplicity and safety. Use manual for custom index names or specific index types.

### Standalone FK index vs composite?
If queries also filter by other columns, include the FK in a composite index. If only JOINs use the FK, a standalone index is sufficient.

## Performance Considerations

Unindexed FK columns cause nested-loop joins to perform a full table scan for every row in the outer table. This is the most common cause of slow JOIN queries.

## Security Considerations

FK indexes don't affect security. FK constraints themselves enforce referential integrity at the database level.

## Related Rules

- Always index foreign key columns
- Prefer constrained() over manual foreign() definitions
- Check for composite index coverage before adding standalone FK index

## Related Skills

- Design Composite Indexes with Correct Leftmost Prefix
- Manage Indexes in Laravel Migrations
- Use Covering Indexes for Index-Only Scans

## Success Criteria

- All FK columns are indexed
- constrained() is the default approach in migrations
- No redundant FK indexes where composite already covers
- EXPLAIN confirms index usage on FK JOIN columns
