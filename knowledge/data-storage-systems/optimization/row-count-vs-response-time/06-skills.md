# Skill: Analyze Row Count vs Response Time

## Purpose
Understand how row count, index access patterns, buffer pool, and network transfer affect query response time to predict performance at scale.

## When To Use
- When estimating query performance at production scale
- When designing queries that will handle growing data
- When setting up capacity planning

## When NOT To Use
- For queries on static, small datasets

## Prerequisites
- Understanding of B-Tree index O(log n) characteristics
- Knowledge of buffer pool mechanics

## Inputs
- Query, expected data volume, buffer pool size

## Workflow
1. Determine access pattern: PK lookup (O(1)), range scan (O(log n + range)), full scan (O(n))
2. Estimate if working set fits in buffer pool
3. Measure response time on production-like data volume
4. Check for short-circuit opportunities (LIMIT with correct order/index)
5. Identify inflection point where O(log n) becomes O(n)

## Validation Checklist
- [ ] Access pattern complexity estimated (O(log n) vs O(n))
- [ ] Buffer pool adequacy assessed for working set
- [ ] LIMIT queries have matching ORDER BY index
- [ ] No unbounded queries without LIMIT on list endpoints

## Common Failures
- Assuming row count is the only factor (ignoring filesort, buffer pool)
- Ignoring buffer pool cliff — dev machine fits in memory, production doesn't
- Using offset pagination on growing tables

## Decision Points
- If working set > buffer pool: increase pool size or add caching
- If query returns many rows but needs few: add LIMIT + filter
- If COUNT(*) on large InnoDB table: use approximate count or counter table

## Performance
- O(log n) via index: <5ms regardless of table size (for typical cardinalities)
- O(n) full scan: proportional to table size — 100ms at 1M rows
- Buffer pool cliff: response time spikes 10-100x when working set doesn't fit

## Security
- No direct security implications
- Unbounded queries can cause resource exhaustion (DoS risk)

## Related Rules
- 4-26-1: Always EXPLAIN Before Optimizing
- 4-26-4: Review And Apply Core Concepts

## Related Skills
- Avoid Deep Offset Pagination
- Evaluate Access Type Column

## Success Criteria
- Query response time complexity correctly predicted
- Working set size assessed against buffer pool
- Appropriate mitigations applied (indexes, LIMIT, caching)
