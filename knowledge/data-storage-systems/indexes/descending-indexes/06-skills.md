# Skill: Apply Descending Indexes for Order By Optimization

## Purpose

Use descending indexes (`ORDER BY col DESC`) in PostgreSQL and MySQL 8.0+ to align index sort order with query sort direction — avoiding reverse scans for composite indexes where one column sorts ascending and another descending.

## When To Use

- `ORDER BY col DESC` queries on composite indexes
- Mixed-direction ORDER BY (ascending on one column, descending on another)
- Latest-record-first queries on filtered result sets

## When NOT To Use

- Single-column indexes (both databases reverse-scan efficiently)
- All-ascending ORDER BY (default index order works)

## Prerequisites

- PostgreSQL or MySQL 8.0+
- Understanding of B-Tree index direction semantics

## Inputs

- ORDER BY columns and their directions
- WHERE filter columns (for composite index design)

## Workflow

1. Identify the ORDER BY direction for each sort column
2. For DESC columns, add `DESC` to the index definition
3. Create index: `DB::statement('CREATE INDEX ON orders (user_id, created_at DESC)')`
4. For mixed directions: `CREATE INDEX ON orders (status ASC, created_at DESC)`
5. Verify with EXPLAIN — no "Backward index scan" or "Sort" should appear

## Validation Checklist

- [ ] DESC index used only in composite indexes (single-column doesn't benefit)
- [ ] Index direction matches query ORDER BY direction
- [ ] EXPLAIN doesn't show "Backward scan" or "Sort"
- [ ] Query pattern justifies the specialized index

## Common Failures

### Not needed for single-column DESC
MySQL and PostgreSQL both reverse-scan single-column indexes efficiently. Descending indexes matter most for composite indexes.

## Decision Points

### Descending index vs regular index with reverse scan?
Regular index with reverse scan is fine for single columns. Descending index is beneficial for composite indexes where different columns sort in different directions.

### Two descending indexes vs one composite with mixed direction?
One composite with mixed direction (ASC, DESC) serves queries with both sort orders. Multiple single-column indexes don't help with composite ORDER BY.

## Performance Considerations

Descending indexes eliminate the reverse scan step for composite indexes. The benefit is most noticeable for queries that filter by one column and sort descending by another.

## Security Considerations

Index direction doesn't affect security. It's a pure performance optimization.

## Related Rules

- Use descending indexes only in composite indexes
- Match index direction to query ORDER BY direction
- Verify EXPLAIN for backward scan elimination

## Related Skills

- Design Composite Indexes with Correct Column Ordering
- Design Composite Indexes with Correct Leftmost Prefix
- Use Covering Indexes for Index-Only Scans

## Success Criteria

- DESC index eliminates reverse scan for composite-index queries
- Index direction matches query ORDER BY
- Single-column queries don't use DESC index (unnecessary)
- EXPLAIN confirms no "Backward scan" or "Sort"
