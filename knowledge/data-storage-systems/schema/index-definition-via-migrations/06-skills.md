# Skill: Define Indexes in Migrations for Query Performance

## Purpose

Add `index()`, `unique()`, `fullText()`, and `spatial()` Blueprint methods in migration files to create database indexes at schema-definition time, ensuring query optimization is built into the schema rather than added reactively when queries become slow in production.

## When To Use

- Columns used in WHERE, JOIN, ORDER BY, or GROUP BY clauses
- Business-unique constraints (email, slug, composite uniqueness)
- Full-text search on text columns
- Spatial/GIS queries

## When NOT To Use

- Very small tables (< 1000 rows) where table scans are cheaper
- Write-heavy columns where index maintenance overhead exceeds query benefit
- Columns with very low cardinality (boolean, tiny enum)

## Prerequisites

- Understanding of the query patterns for the table
- Knowledge of B-Tree, full-text, and spatial index behavior
- Awareness of write amplification from multiple indexes

## Inputs

- Column(s) to index
- Index type (standard, unique, full-text, spatial)
- Composite index column order (leftmost prefix rule)
- Database engine capabilities for the chosen index type

## Workflow

1. Identify columns used in WHERE, JOIN, and ORDER BY clauses
2. For single-column filters, add `$table->index('email')`
3. For multi-column filters, add a composite index: `$table->index(['status', 'created_at'])` with the most selective column first
4. For business-unique constraints, use `$table->unique(['email', 'tenant_id'])` to enforce at DB level
5. For full-text search, use `$table->fullText('body')` and query with `whereFullText()`
6. For spatial data, use `$table->spatial('location')` and query with spatial methods
7. Avoid redundant indexes: if `unique('email')` exists, don't add `index('email')` separately

## Validation Checklist

- [ ] All foreign key columns are indexed (automatic with constrained())
- [ ] Composite indexes have columns ordered by selectivity
- [ ] Unique indexes exist for all business-unique constraints
- [ ] No redundant indexes (unique + index on same column)
- [ ] Full-text indexes used only for text search queries
- [ ] Index count is proportional to query patterns, not exhaustive

## Common Failures

### FK column without index
`$table->foreignId('user_id')` without `->constrained()` or `->index()` creates the FK constraint but not the index. Joins on this column perform full table scans.

### Redundant indexes
Creating both `unique('email')` and `index('email')` wastes storage and adds write overhead. The unique index already provides B-Tree index functionality.

## Decision Points

### index vs unique?
Use `unique()` when the column(s) must be unique at the database level. Use `index()` for performance-only columns that allow duplicates.

### Single-column vs composite?
Use composite indexes when queries filter by multiple columns. Single-column indexes on each column do NOT provide the same optimization for multi-column filters.

## Performance Considerations

Every index adds write amplification — each INSERT must update all indexes on the table. Indexes consume disk space and buffer pool memory. Full-text indexes are particularly large. Unique indexes add constraint-check overhead on write operations.

## Security Considerations

Unique indexes prevent duplicate data at the database level, catching race conditions that application-level validation misses. Application code must handle unique constraint violations gracefully.

## Related Rules

- Index all foreign key columns automatically
- No redundant indexes on already-unique columns
- Composite indexes for multi-column queries

## Related Skills

- Define Foreign Key Constraints
- Select Optimal Blueprint Column Types
- Configure Migration Ordering and Naming

## Success Criteria

- All FK columns are indexed
- Composite indexes follow leftmost prefix with correct column order
- Business rules are enforced via unique indexes
- No redundant or unused indexes exist
- Full-text and spatial indexes are used only when query patterns require them
