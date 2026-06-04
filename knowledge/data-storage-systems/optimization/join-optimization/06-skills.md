# Skill: Optimize JOIN Queries

## Purpose
Ensure JOIN queries are performant by indexing foreign key columns, choosing the correct join type, and letting the optimizer determine join order.

## When To Use
- When writing or reviewing JOIN queries
- When EXPLAIN shows full table scans on the joined table
- When LEFT JOIN is used but INNER JOIN would suffice

## When NOT To Use
- For simple queries on small tables without JOINs

## Prerequisites
- Understanding of INNER vs LEFT JOIN mechanics
- Knowledge of foreign key indexing

## Inputs
- SQL or Eloquent query with JOINs

## Workflow
1. Identify all JOINs and their ON clause columns
2. Ensure the joined table's ON column is indexed (always index FK columns)
3. Verify INNER JOIN vs LEFT JOIN choice — prefer INNER when NULL rows aren't needed
4. Run EXPLAIN and check for full table scans on joined tables
5. If optimizer chooses poor join order, consider query restructuring

## Validation Checklist
- [ ] All FK columns on joined tables are indexed
- [ ] INNER JOIN used when the relationship is mandatory
- [ ] No full table scan on joined tables in EXPLAIN
- [ ] `type` shows `ref` or `eq_ref` for JOIN operations

## Common Failures
- JOIN without index on FK column — full table scan on joined table per driving row
- LEFT JOIN when INNER JOIN suffices — unnecessary NULL rows and slower
- Not checking EXPLAIN for join performance

## Decision Points
- Mandatory relationship: INNER JOIN (faster, less data)
- Optional relationship: LEFT JOIN (slower, includes NULLs)
- Use `STRAIGHT_JOIN` (MySQL) only when optimizer chooses poorly

## Performance
- Indexed FK JOIN: O(log n) per row — fast
- Unindexed FK JOIN: O(n) full scan per driving row — catastrophic on large tables
- INNER JOIN can reorder tables for optimization; LEFT JOIN cannot

## Security
- No direct security implications
- Ensure JOINs don't bypass row-level security (RLS)

## Related Rules
- 4-24-1: Always EXPLAIN Before Optimizing
- 4-24-4: Review And Apply Core Concepts

## Related Skills
- Write Sargable WHERE Conditions

## Success Criteria
- All JOIN columns indexed
- Correct join type chosen (INNER vs LEFT)
- EXPLAIN confirms efficient join execution
