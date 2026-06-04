# Skill: Design B-Tree Indexes for Equality and Range Queries

## Purpose

Design B-Tree indexes (the default) for O(log n) lookup performance on equality (`WHERE id = 5`), range (`WHERE id > 100`), prefix (`WHERE name LIKE 'Jon%'`), and sort (`ORDER BY name`) queries — understanding clustered vs non-clustered structures and leftmost prefix matching for composite indexes.

## When To Use

- Most indexable columns (default index type)
- Equality and range conditions
- ORDER BY optimization
- Composite indexes requiring leftmost prefix matching

## When NOT To Use

- Full-text search (use FULLTEXT or GIN)
- JSONB containment queries (use GIN)
- Spatial queries (use GiST or R-Tree)
- Low-cardinality columns indexed alone

## Prerequisites

- Understanding of B-Tree structure (root, internal nodes, leaf pages)
- Knowledge of leftmost prefix rule for composite indexes

## Inputs

- Table and column(s) to index
- Query pattern (equality, range, sort, prefix)
- Cardinality of indexed columns

## Workflow

1. Identify the query pattern: equality, range, sort, or prefix
2. Confirm B-Tree supports the pattern (yes for all except LIKE '%suffix')
3. For composite indexes: place equality columns first, range/sort columns after
4. Create index: `$table->index(['tenant_id', 'created_at'])` in migration
5. Verify with EXPLAIN that the index is used

## Validation Checklist

- [ ] Low-cardinality columns are not indexed alone (composite with selective column)
- [ ] B-Tree index is appropriate for the query pattern
- [ ] LIKE '%suffix' queries don't expect B-Tree index usage
- [ ] Composite index follows leftmost prefix rule

## Common Failures

### Indexing low-cardinality columns alone
An index on `status` (with only 3 distinct values) is rarely used by the optimizer — scanning 33% of a table is cheaper than the index.

### Assuming B-Tree for text search
`LIKE '%value%'` cannot use B-Tree range scan. It falls back to full table scan.

## Decision Points

### B-Tree vs Hash?
B-Tree for equality + range + sort. Hash for PostgreSQL equality-only — smaller but no range support.

### B-Tree vs BRIN?
B-Tree for general purpose. BRIN for time-series on large ordered tables — 100-1000x smaller but only for range queries on correlated data.

## Performance Considerations

B-Tree indexes provide O(log n) lookup. Each additional index adds write amplification. For low-cardinality columns, composite with a high-cardinality column.

## Security Considerations

Indexes don't directly affect security. However, ensure RLS policies and partial indexes are aligned for multi-tenant data isolation.

## Related Rules

- Don't index low-cardinality columns alone
- Use composite indexes for queries with multiple conditions
- Verify index usage with EXPLAIN

## Related Skills

- Design Composite Indexes with Correct Column Ordering
- Use Covering Indexes for Index-Only Scans
- Design BRIN Indexes for Time-Series Data

## Success Criteria

- B-Tree indexes serve the intended query patterns
- Low-cardinality columns combined with selective columns in composites
- EXPLAIN confirms index usage
- Index maintenance planned for bloat management
