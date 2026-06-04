# Skill: Design Composite Indexes with Correct Leftmost Prefix

## Purpose

Design composite (multicolumn) B-Tree indexes respecting the leftmost prefix rule — queries must reference a leftmost subset of the indexed columns — placing equality columns first, range columns second, and sort columns last for optimal index utilization.

## When To Use

- Queries filtering by multiple columns
- Queries filtering by one column and sorting by another
- Covering indexes for index-only scans
- Queries with mixed equality and range conditions

## When NOT To Use

- Single-column filters (use single-column index)
- Queries that don't filter by the leading column

## Prerequisites

- Understanding of B-Tree index structure
- Knowledge of leftmost prefix rule

## Inputs

- Query WHERE conditions and their types (equality vs range)
- ORDER BY columns and direction
- JOIN columns

## Workflow

1. List all columns in the query: WHERE conditions, ORDER BY, SELECT
2. Classify each column: equality (=), range (>, <, BETWEEN), sort (ORDER BY)
3. Order columns: equality first, range second, sort last
4. Create composite index: `$table->index(['tenant_id', 'status', 'created_at'])`
5. Verify with EXPLAIN that the index is used

## Validation Checklist

- [ ] Leading column is referenced in the query's WHERE clause
- [ ] Equality columns before range columns
- [ ] Sort columns last in the index
- [ ] Index not redundant with existing indexes (check leftmost prefix)

## Common Failures

### Wrong column order
Index `(status, created_at)` but the query filters by `created_at` first. The index is not used.

### Indexing all queryable columns in one index
A 6-column composite index where only the first 2 columns serve the query. Remaining columns add maintenance cost without benefit.

### Not verifying index usage
Adding a composite index without running EXPLAIN. The optimizer may not use it as expected.

## Decision Points

### High cardinality vs low cardinality first?
High cardinality first for maximum early pruning. Exception: if low-cardinality column is always filtered, it may be better first.

### Composite vs multiple single-column indexes?
One composite index on (a, b, c) is better than three single-column indexes on (a), (b), (c). The optimizer can use only one index per table in most cases.

## Performance Considerations

A well-designed composite index can serve WHERE, ORDER BY, and cover the SELECT — all from the index alone. Misordered composite indexes are useless.

## Security Considerations

Composite indexes don't affect security. Ensure RLS policies are aligned with index design for multi-tenant filtering.

## Related Rules

- Equality columns first, range columns second, sort columns last
- Verify leftmost prefix with EXPLAIN
- Don't create redundant composite indexes

## Related Skills

- Design Composite Indexes with Correct Column Ordering
- Use Covering Indexes for Index-Only Scans
- Apply Composite Index Selectivity Principles

## Success Criteria

- Composite index columns ordered by query pattern (equality → range → sort)
- EXPLAIN shows index usage for the intended queries
- No redundant composite indexes
- Leftmost prefix rule satisfied for all target queries
