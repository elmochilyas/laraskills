# Skill: Manage Indexes in Laravel Migrations

## Purpose

Define indexes in Laravel migrations using Blueprint methods (`index`, `unique`, `fullText`, `spatialIndex`) for standard cases, and `DB::statement` for advanced features (partial, expression, concurrent, custom-named indexes) — creating composite indexes at migration time rather than as separate single-column indexes.

## When To Use

- Creating new tables with known query patterns
- Adding indexes to existing tables for performance
- Composite indexes that require specific column ordering
- Advanced index types not supported by Blueprint

## When NOT To Use

- Ad-hoc index creation for one-off queries (add after profiling)
- Over-indexing before understanding query patterns

## Prerequisites

- Understanding of Laravel schema builder
- Knowledge of the database-specific DDL syntax

## Inputs

- Table and column(s) to index
- Index type (B-Tree, unique, full-text, spatial)
- Advanced options (partial, expression, concurrent)

## Workflow

1. For standard indexes: `$table->index(['tenant_id', 'status'])` in migration
2. For unique: `$table->unique('email')`
3. For full-text: `$table->fullText('body')`
4. For spatial: `$table->spatialIndex('location')`
5. For advanced types: use `DB::statement('CREATE INDEX CONCURRENTLY ...')`
6. Use named indexes: `$table->index(['a', 'b'], 'idx_my_name')` for clarity

## Validation Checklist

- [ ] Composite indexes defined as one index, not separate single-column indexes
- [ ] Named indexes used for clarity and to prevent auto-generated name collisions
- [ ] Advanced index types use raw DDL with proper syntax
- [ ] Index names follow naming conventions

## Common Failures

### Not using composite indexes
Creating individual indexes on `(tenant_id)`, `(status)`, `(created_at)` instead of one composite `(tenant_id, status, created_at)`.

### Indexing without understanding query patterns
Adding indexes before profiling what queries actually run.

## Decision Points

### Blueprint vs raw DDL?
Blueprint for standard indexes. Raw DDL for partial, expression, concurrent, and custom types.

### Named vs auto-named indexes?
Named indexes prevent collisions when renaming tables/columns. Auto-named is fine for simple cases.

## Performance Considerations

Composite indexes in migrations should be designed based on actual query patterns, not theoretical access paths. Add indexes after profiling.

## Security Considerations

Migration DDL requires appropriate database permissions. Ensure migrations are reviewed for security implications.

## Related Rules

- Define composite indexes, not multiple single-column indexes
- Use raw DDL for advanced index types
- Name indexes explicitly for clarity

## Related Skills

- Create Indexes Concurrently for Zero-Downtime
- Design Composite Indexes with Correct Leftmost Prefix
- Apply Partial Indexes for Targeted Data Subsets

## Success Criteria

- Indexes defined at migration time based on query analysis
- Composite indexes used instead of redundant single-column indexes
- Advanced indexes use correct raw DDL syntax
- Index names follow project conventions
