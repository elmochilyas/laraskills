# Skill: Interpret Extra Column Flags

## Purpose
Read the `Extra` column in EXPLAIN output to identify covering indexes, sort penalties, temporary tables, and post-filter operations.

## When To Use
- When analyzing EXPLAIN output for optimization
- When verifying index effectiveness after changes

## When NOT To Use
- When the query already meets performance targets

## Prerequisites
- EXPLAIN output interpretation
- Understanding of index coverage

## Inputs
- EXPLAIN output for a target query

## Workflow
1. Locate the `Extra` column in EXPLAIN output
2. Check for `Using index` — confirms covering index (all columns in index)
3. Check for `Using filesort` — indicates sort not using index
4. Check for `Using temporary` — indicates temp table for GROUP BY/DISTINCT
5. Check for `Using where` — post-filter applied (index didn't fully cover WHERE)
6. Check for `Using index condition` (ICP) — good, MySQL pushes conditions down

## Validation Checklist
- [ ] No `Using filesort` on large result sets
- [ ] No `Using temporary` on high-cardinality GROUP BY
- [ ] `Using index` (covering) achieved for frequent queries
- [ ] `Using index condition` present when beneficial

## Common Failures
- Optimizing filesort when result set is small (negligible impact)
- Optimizing temporary for low-cardinality GROUP BY (small temp table)
- Not checking Extra flags after index changes

## Decision Points
- `Using filesort`: add ORDER BY column to index as last column
- `Using temporary`: ensure GROUP BY column is leftmost in index
- `Using where` (no index): add composite index covering WHERE columns
- `Not Using index` after index exists: verify index column order matches query

## Performance
- `Using index` (covering): fastest — no heap fetches
- `Using index condition`: good — storage engine pre-filters
- `Using filesort`: avoid for >1000 row sorts
- `Using temporary`: avoid for high-cardinality GROUP BY

## Security
- No direct security implications

## Related Rules
- 4-4-1: Always EXPLAIN Before Optimizing
- 4-4-4: Review And Apply Core Concepts

## Related Skills
- Interpret EXPLAIN Output
- Evaluate Access Type Column
- Explain Analyze

## Success Criteria
- Extra flags correctly interpreted
- Filesort eliminated for large sorts
- Covering indexes identified and created for hot queries
