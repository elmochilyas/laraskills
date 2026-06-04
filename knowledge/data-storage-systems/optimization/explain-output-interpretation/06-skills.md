# Skill: Interpret EXPLAIN Output

## Purpose
Read and understand database query execution plans to identify performance bottlenecks and optimization opportunities.

## When To Use
- When diagnosing slow queries
- Before and after adding indexes to verify improvement
- When reviewing query performance in code review

## When NOT To Use
- For queries running under 5ms with low frequency
- When simpler caching or replica offloading would suffice

## Prerequisites
- Understanding of B-Tree indexes
- Basic SQL query structure

## Inputs
- Slow query from production or development
- Database access with EXPLAIN/EXPLAIN ANALYZE permissions

## Workflow
1. Run `EXPLAIN` or `EXPLAIN ANALYZE` on the target query
2. Identify the `type` column (const > eq_ref > ref > range > index > ALL)
3. Check `possible_keys` vs `key` (index chosen vs candidates)
4. Examine `rows` for estimated scan size
5. Read `Extra` flags (Using index, Using filesort, Using temporary, Using where)
6. Identify red flags: ALL scans, filesort, temporary on large datasets
7. Compare before/after plans when making changes

## Validation Checklist
- [ ] `type` is not `ALL` for large tables (>10K rows)
- [ ] `key` shows an index being used
- [ ] `rows` is proportional to expected result size
- [ ] No `Using filesort` on large result sets
- [ ] No `Using temporary` on high-cardinality GROUP BY

## Common Failures
- Running EXPLAIN without ANALYZE (estimates vs actuals)
- Ignoring `filtered` column (MySQL) showing low selectivity
- Not comparing before/after plans

## Decision Points
- If `type=ALL` with `rows > 1000`: add index on WHERE columns
- If `Extra: Using filesort`: add ORDER BY column to index
- If `Extra: Using temporary`: ensure GROUP BY column is leftmost in index

## Performance
- EXPLAIN has negligible overhead
- EXPLAIN ANALYZE executes the query (safe for SELECT, not INSERT/UPDATE/DELETE)

## Security
- EXPLAIN does not modify data
- EXPLAIN ANALYZE on write queries executes them — wrap in transaction or use EXPLAIN only

## Related Rules
- 4-1-1: Always EXPLAIN Before Optimizing
- 4-1-4: Review And Apply Core Concepts

## Related Skills
- Explain Analyze
- Type Column Values
- Extra Column Flags

## Success Criteria
- Query plan is read and understood
- Bottleneck operation is identified
- Before/after plans show clear improvement after optimization
