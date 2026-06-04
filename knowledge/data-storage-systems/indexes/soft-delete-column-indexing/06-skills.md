# Skill: Index Soft Delete Columns Effectively

## Purpose

Design indexes that account for the automatic `WHERE deleted_at IS NULL` filter added by Eloquent's `SoftDeletes` trait — including `deleted_at` as the last column in composite indexes, or using partial indexes (PostgreSQL) to index only active rows for smaller, faster indexes.

## When To Use

- Eloquent models using the SoftDeletes trait
- Tables with a soft-delete column that is frequently queried
- Composite index design on soft-deletable tables

## When NOT To Use

- Tables without soft deletes
- Tables where most rows are soft-deleted (partial index on active rows is still useful)

## Prerequisites

- Understanding of how SoftDeletes adds `WHERE deleted_at IS NULL`
- Knowledge of partial indexes (PostgreSQL)

## Inputs

- Soft delete column (typically `deleted_at`)
- Existing index design and query patterns
- Ratio of active to soft-deleted rows

## Workflow

1. Identify all queries affected by the soft-delete global scope
2. For composite indexes: add `deleted_at` as the last column
3. For PostgreSQL: consider partial index `WHERE deleted_at IS NULL` for optimal performance
4. Avoid standalone index on `deleted_at` alone (low selectivity)
5. Verify with EXPLAIN that queries using soft-delete filter use the index

## Validation Checklist

- [ ] deleted_at included in composite indexes for soft-deletable tables
- [ ] No standalone index on deleted_at alone
- [ ] PostgreSQL partial index considered for active-only queries
- [ ] Partial index predicate matches the global scope condition

## Common Failures

### Indexing deleted_at alone
An index on just `deleted_at` is rarely used — 50-90% of rows are IS NULL, making the index less efficient than a table scan.

### Not considering soft delete in index design
Adding indexes for hot queries without including `deleted_at`. The index covers WHERE conditions but not the soft delete filter, causing residual filtering.

## Decision Points

### Composite with deleted_at vs partial index?
Composite with deleted_at for general compatibility (MySQL and PostgreSQL). Partial index for PostgreSQL-only optimization where most rows are active.

### deleted_at as first or last column?
Always last in the composite index. The soft-delete filter is a boolean-like condition (IS NULL or IS NOT NULL) with low selectivity.

## Performance Considerations

The soft-delete filter adds a condition to every query. If the index doesn't account for it, the database must perform residual filtering after index access.

## Security Considerations

Soft-delete filtering prevents deleted records from being returned by default. Ensure queries that need soft-deleted records use `withTrashed()` intentionally.

## Related Rules

- Include deleted_at in composite indexes for soft-deletable tables
- Don't index deleted_at alone
- Use partial indexes for PostgreSQL soft-delete optimization

## Related Skills

- Apply Partial Indexes for Targeted Data Subsets
- Design Composite Indexes with Correct Leftmost Prefix
- Create RLS-Compatible Partial Indexes

## Success Criteria

- All composite indexes on soft-deletable tables include deleted_at (or use partial index)
- No standalone deleted_at index
- EXPLAIN confirms soft-delete filter uses index without residual filtering
- PostgreSQL partial indexes considered for active-only queries
