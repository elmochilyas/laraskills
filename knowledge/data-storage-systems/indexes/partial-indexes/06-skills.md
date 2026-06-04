# Skill: Apply Partial Indexes for Targeted Data Subsets

## Purpose

Use PostgreSQL partial indexes (index on a subset of rows matching a `WHERE` condition) to reduce index size, write maintenance overhead, and query time — for active records, unprocessed queue items, and non-deleted rows.

## When To Use

- Filtering queries on a subset of rows (active, pending, non-deleted)
- Soft delete optimization (index only non-deleted rows)
- Queue processing (index only unprocessed items)
- Storage and write-constrained environments

## When NOT To Use

- MySQL databases (MySQL doesn't support partial indexes)
- Columns whose filter condition changes frequently (volatile columns)
- Queries that need to search the full table

## Prerequisites

- PostgreSQL database
- Understanding of index predicate matching

## Inputs

- Filter condition (WHERE predicate)
- Key columns for the indexed subset
- Percentage of rows that match the predicate

## Workflow

1. Identify the query pattern that filters by a specific condition
2. Confirm the condition is stable (doesn't change rapidly)
3. Create partial index: `DB::statement('CREATE INDEX ON orders (tenant_id, created_at) WHERE status = 'pending'')`
4. Ensure queries match or imply the index predicate
5. Verify with EXPLAIN

## Validation Checklist

- [ ] Index predicate matches the query's WHERE clause (or is implied by it)
- [ ] Filter condition is stable (not volatile)
- [ ] Partial index significantly smaller than full index (20-50% of rows)
- [ ] MySQL is not the target database

## Common Failures

### Query predicate doesn't match index predicate
PostgreSQL recognizes implied predicates. However, `WHERE status IN ('active', 'pending')` does NOT match `WHERE status = 'active'`.

### Partial index on volatile columns
Status changes frequently. Each change requires deleting+inserting the index entry. On a table with rapid status changes, the partial index maintenance overhead may exceed the benefit.

## Decision Points

### Partial vs full index?
Partial if the query always includes the filter condition and the subset is 20-50% of rows. Full index if queries need to search all rows.

### Partial vs composite with filter column?
Composite index `(status, col)` includes all rows. Partial index `(col) WHERE status = 'active'` only includes active rows. Partial is smaller.

## Performance Considerations

Partial indexes are smaller, faster to scan, and generate less write amplification. But they only work when the query predicate matches the index predicate.

## Security Considerations

Partial indexes with RLS-aligned predicates can improve multi-tenant query performance. See RLS-compatible partial indexes.

## Related Rules

- Ensure query predicate matches or implies index predicate
- Avoid partial indexes on volatile columns
- Use partial indexes for soft-delete optimization

## Related Skills

- Design Functional/Expression Indexes
- Index Soft Delete Columns Effectively
- Create RLS-Compatible Partial Indexes

## Success Criteria

- Partial index correctly matches the target query subset
- Significant size reduction vs full index
- EXPLAIN confirms partial index usage
- Filter condition is stable (not rapidly changing)
