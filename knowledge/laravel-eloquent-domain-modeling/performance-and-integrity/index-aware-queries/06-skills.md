# Skill: Design Index-Aware Eloquent Queries for Optimal Performance

## Purpose
Structure Eloquent queries to leverage database indexes efficiently — designing composite and covering indexes proactively so the database can answer queries from the index without touching table rows.

## When To Use
- Any query on a table with more than 10k rows
- Query-heavy API endpoints — index the most common filter, sort, and select patterns
- Report generation — design covering indexes for specific query columns
- `whereHas()` with correlated subqueries — index the subquery WHERE columns

## When NOT To Use
- Small tables (< 1k rows) — full table scans may be faster
- Write-heavy tables with low read volume — each index slows writes
- Rarely executed queries — index overhead may not be justified
- Columns with very low cardinality (booleans) — standalone indexes rarely help

## Prerequisites
- Understanding of B-tree index structure and composite index column order
- Ability to read `EXPLAIN` output
- Knowledge of the table's query patterns

## Inputs
- Query patterns (WHERE, ORDER BY, JOIN, SELECT columns)
- Table schema and column types
- Query frequency and performance requirements
- Database engine (MySQL, PostgreSQL, SQLite)

## Workflow
1. Identify the top 5 query patterns for the table
2. For each pattern, list: WHERE columns, ORDER BY columns, SELECT columns, JOIN columns
3. Design composite indexes: order columns by selectivity (most unique first)
4. Design covering indexes: include all columns from SELECT, WHERE, ORDER BY, JOIN
5. Add indexes in the migration alongside the schema changes
6. Verify with `EXPLAIN` — check `type` is `ref`, `range`, or `const` (not `ALL`)
7. For write-heavy tables, minimize total index count to avoid write slowdown

## Validation Checklist
- [ ] Top 5 query patterns have designed indexes (not just individual columns)
- [ ] Composite index columns ordered by selectivity
- [ ] `EXPLAIN` confirms index usage (`type` is `ref`, `range`, or `const`)
- [ ] Write-heavy tables have a reviewed, minimal index set
- [ ] CI pipeline includes `EXPLAIN` assertions for critical queries
- [ ] Covering indexes designed for frequent queries

## Common Failures
- Indexing every column individually — combined filters need composite indexes
- Ignoring ORDER BY index — only indexing WHERE columns causes filesort
- Over-indexing write-heavy tables — write throughput degradation
- Not verifying with EXPLAIN — assuming an index is used
- Data type mismatch in WHERE — index usage prevented

## Decision Points
- Composite vs single-column indexes: prefer composite indexes for combined filter patterns; use single-column only for columns queried in isolation
- Leftmost prefix: place the most selective column first in composite indexes
- Covering indexes: add them for frequent queries to enable index-only scans (10-100x faster)

## Performance Considerations
- Covering index can be 10-100x faster than full table scan
- Each index slows INSERT/UPDATE/DELETE — 10 indexes = 11 structures per INSERT
- Range conditions (`>`, `<`, `BETWEEN`) use the index only up to the first range column
- `ORDER BY` with mixed ASC/DESC can prevent index usage

## Security Considerations
- No direct security implications — indexes are a performance structure
- `EXPLAIN` output can reveal schema structure — restrict access in production

## Related Rules
- Design Indexes in Parallel with Query Patterns (performance-and-integrity/index-aware-queries)
- Order Composite Index Columns by Selectivity (performance-and-integrity/index-aware-queries)
- Use Covering Indexes for Frequent Queries (performance-and-integrity/index-aware-queries)
- Verify Index Usage with EXPLAIN (performance-and-integrity/index-aware-queries)
- Prefer Composite Indexes Over Many Single-Column Indexes (performance-and-integrity/index-aware-queries)

## Related Skills
- Optimize Subquery Performance with Indexing
- Implement Select Constraints for I/O Reduction
- Define Database Constraints for Integrity

## Success Criteria
- `EXPLAIN` shows index usage (no full table scans) for all critical queries
- Top query patterns have covering indexes where beneficial
- Write performance impact of indexes is measured and acceptable
- CI pipeline catches regressions that introduce full table scans
