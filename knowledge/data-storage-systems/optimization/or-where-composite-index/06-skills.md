# Skill: Optimize orWhere with Composite Indexes

## Purpose
Prevent full table scans from `orWhere` conditions on composite indexes by grouping OR conditions and using UNION alternatives.

## When To Use
- When writing queries with `orWhere` on composite-indexed columns
- When EXPLAIN shows `ALL` despite composite index existing
- In code review for OR query patterns

## When NOT To Use
- When each OR branch filters the same column (single index can handle)
- When the table is small

## Prerequisites
- Understanding of composite indexes and leftmost prefix rule
- Knowledge of UNION queries

## Inputs
- Eloquent or SQL query with `orWhere` clauses

## Workflow
1. Identify `orWhere` clauses referencing different columns
2. Check if a composite index covers the columns
3. If OR spans columns in a composite index: group OR conditions with closure
4. Alternatively, rewrite as UNION of two separate indexed queries
5. Verify with EXPLAIN that type is no longer `ALL`

## Validation Checklist
- [ ] OR conditions grouped with closure `where(fn($q) => ...)`
- [ ] EXPLAIN does not show full table scan from OR conditions
- [ ] UNION used when each OR branch is highly selective

## Common Failures
- Unintentional OR scope: `where('a', 1)->orWhere('b', 2)` applies OR to entire WHERE clause
- Not grouping ORs — MySQL may choose full scan over index_merge

## Decision Points
- Closure grouping for OR: use when branches share a logical group
- UNION for OR: use when each branch has its own optimal index
- IN clause: use for same-column OR alternatives

## Performance
- OR without grouping: full table scan — O(n)
- Grouped OR with index: index range scan — O(log n)
- UNION with indexes: O(log n) per branch

## Security
- No direct security implications

## Related Rules
- 4-11-1: Always EXPLAIN Before Optimizing
- 4-11-4: Review And Apply Core Concepts

## Related Skills
- Write Sargable WHERE Conditions
- Join Optimization

## Success Criteria
- OR queries use indexes instead of full table scans
- EXPLAIN confirms index access for all branches
- Query results remain unchanged after rewrite
