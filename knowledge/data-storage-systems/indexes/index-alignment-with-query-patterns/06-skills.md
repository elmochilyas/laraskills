# Skill: Align Indexes with Full Query Access Patterns

## Purpose

Design indexes that align with the full query access pattern — WHERE conditions, JOIN conditions, and ORDER BY direction — using composite indexes that cover filter columns, include payload columns, and match sort order to eliminate both full table scans and explicit sort operations.

## When To Use

- Designing indexes for critical query paths
- Optimizing queries that filter, join, and sort
- Creating covering indexes for hot endpoints

## When NOT To Use

- Simple queries with only one filter column
- Ad-hoc or infrequent queries

## Prerequisites

- Understanding of composite index design
- Knowledge of index-only scan requirements

## Inputs

- Full query SQL including WHERE, JOIN, ORDER BY, SELECT
- Query execution frequency
- Performance requirements

## Workflow

1. Parse the query: identify WHERE columns, JOIN columns, ORDER BY columns, SELECT columns
2. Design index to cover: equality conditions → range conditions → sort column
3. Add covering columns (INCLUDE) for SELECT columns not in the index key
4. Ensure FK columns used in JOINs are indexed
5. Verify with EXPLAIN: "Index Only Scan" or "Using index" with no "Using filesort"

## Validation Checklist

- [ ] Index covers WHERE + ORDER BY (no filesort)
- [ ] JOIN columns are indexed on the joined table
- [ ] SELECT columns covered by index or INCLUDE where practical
- [ ] EXPLAIN shows no "Using filesort" and no "Using where" for residual filtering

## Common Failures

### Indexing WHERE without ORDER BY
The index narrows the search, but the database still sorts the result. Add the sort column to the index.

## Decision Points

### Covering vs not covering?
Covering if the query is hot (runs frequently) and SELECT columns are few. Not covering if the index would become too large.

### Composite vs multiple indexes?
One aligned composite index is better than multiple indexes that each serve part of the query pattern.

## Performance Considerations

An aligned index can eliminate both full table scans (via filtering) and sort operations (via index order). This is the optimal scenario for query performance.

## Security Considerations

Index alignment doesn't affect security. Ensure the indexed data doesn't expose sensitive information through statistics.

## Related Rules

- Align indexes with full query patterns (WHERE + ORDER BY + SELECT)
- Index JOIN columns
- Verify with EXPLAIN for optimal execution

## Related Skills

- Design Composite Indexes with Correct Leftmost Prefix
- Order Composite Index Columns by Query Access Pattern
- Use Covering Indexes for Index-Only Scans

## Success Criteria

- Index covers WHERE conditions, ORDER BY, and key SELECT columns
- No filesort in EXPLAIN for aligned queries
- JOIN columns indexed
- Index allows index-only scan where practical
