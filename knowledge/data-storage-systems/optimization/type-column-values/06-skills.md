# Skill: Evaluate Access Type Column

## Purpose
Assess query efficiency by reading the `type` column in EXPLAIN output, ranking from const (best) to ALL (worst).

## When To Use
- When reviewing any EXPLAIN output
- When deciding whether an index is effective
- When comparing index alternatives

## When NOT To Use
- When query performance is already acceptable without optimization

## Prerequisites
- EXPLAIN output interpretation
- Understanding of B-Tree index mechanics

## Inputs
- EXPLAIN output for a target query

## Workflow
1. Locate the `type` column in EXPLAIN output
2. Classify: const/eq_ref (optimal), ref (good), range (acceptable), index (poor), ALL (worst)
3. For const/eq_ref: verify unique index or PK is used
4. For ref: verify the referenced column is indexed
5. For range: check if the range is narrow relative to table size
6. For index/ALL: identify missing indexes or query rewrites

## Validation Checklist
- [ ] PK lookups show `const` or `eq_ref`
- [ ] FK joins show `ref` or `eq_ref`
- [ ] Range queries show `range` (not ALL)
- [ ] No `ALL` scans on tables with >1000 rows

## Common Failures
- Accepting `ALL` on small tables that will grow
- Confusing `ref` (non-unique, multiple rows) with `eq_ref` (unique, one row)
- Not checking `type` after adding an index

## Decision Points
- `ALL` + high rows: add index on WHERE columns
- `index` (full index scan): consider narrowing query or adding covering index
- `ref` when expecting one row: add unique constraint

## Performance
- const/eq_ref: O(1) or O(log n) — microseconds
- ref: O(log n + m) where m = matching rows
- range: O(log n + range_size)
- index: O(n) — scans entire index
- ALL: O(n) — scans entire table (worst I/O)

## Security
- No direct security implications

## Related Rules
- 4-3-1: Always EXPLAIN Before Optimizing
- 4-3-4: Review And Apply Core Concepts

## Related Skills
- Interpret EXPLAIN Output
- Explain Analyze
- Extra Column Flags

## Success Criteria
- Access type correctly identified and classified
- Missing indexes identified from `ALL` or `index` types
- Verification that PK/FK lookups use optimal access types
