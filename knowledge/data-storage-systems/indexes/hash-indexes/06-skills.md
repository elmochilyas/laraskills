# Skill: Apply Hash Indexes for Equality-Only Lookups

## Purpose

Use PostgreSQL hash indexes for fast equality lookups on large tables where only `WHERE col = ?` queries are needed — hash indexes are smaller than B-Tree for the same column but do not support range queries, sorting, or prefix matching.

## When To Use

- PostgreSQL only (MySQL doesn't support hash indexes)
- Equality-only lookup columns
- Storage-constrained environments where B-Tree size is a concern
- Columns that never need range or sort queries

## When NOT To Use

- Range queries (>, <, BETWEEN)
- ORDER BY queries
- LIKE or prefix matching
- Composite indexes for multi-column access

## Prerequisites

- PostgreSQL 10+ (hash indexes are WAL-logged and crash-safe from PG 10)
- Confirmation that no range or sort queries exist on the column

## Inputs

- Column to index
- Confirmation of equality-only query pattern

## Workflow

1. Verify all queries on the column are equality-only (`WHERE col = ?`)
2. Confirm there are no ORDER BY or range queries on this column
3. Create with raw DDL: `DB::statement('CREATE INDEX hash_idx ON table USING HASH (col)')`
4. Verify with EXPLAIN that the hash index is used

## Validation Checklist

- [ ] Column has no range queries (>, <, BETWEEN)
- [ ] Column has no ORDER BY clauses
- [ ] Column has no LIKE or prefix queries
- [ ] PostgreSQL version is 10+

## Common Failures

### Using hash when B-Tree is needed
Adding a hash index for a column that later requires range queries or ORDER BY. Must switch to B-Tree.

## Decision Points

### Hash vs B-Tree?
Use hash when storage savings matter and all queries are equality-only. Use B-Tree when there's any possibility of range or sort queries.

### Hash vs no index?
Hash index only helps if the column is selective enough. For low-cardinality columns, no index may be better.

## Performance Considerations

Hash indexes are typically smaller than B-Tree for the same column. They cannot support range scans or sort order. Lookup speed is comparable to B-Tree for equality.

## Security Considerations

Hash indexes don't affect security. They're a pure performance optimization for PostgreSQL equality lookups.

## Related Rules

- Use hash indexes only for equality-only query patterns
- Verify no range/sort queries exist before choosing hash
- PostgreSQL 10+ required for crash-safe hash indexes

## Related Skills

- Design B-Tree Indexes for Equality and Range Queries
- Design GIN Indexes for JSONB and Full-Text
- Design BRIN Indexes for Time-Series Data

## Success Criteria

- Hash index used only for equality-only columns
- No range or sort queries on hash-indexed columns
- EXPLAIN confirms hash index usage
- Storage savings realized compared to B-Tree alternative
