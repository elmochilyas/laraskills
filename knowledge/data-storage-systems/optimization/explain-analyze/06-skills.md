# Skill: Run Explain Analyze

## Purpose
Execute EXPLAIN ANALYZE to get actual query execution metrics (time per node, actual rows, loop count) rather than planner estimates.

## When To Use
- When EXPLAIN (estimates) shows suspiciously low rows or costs
- When identifying the slowest node in a query plan
- Before/after optimization to measure actual improvement

## When NOT To Use
- On INSERT/UPDATE/DELETE queries (they execute) — use plain EXPLAIN or wrap in ROLLBACK transaction
- When the buffer pool is cold — run twice and compare

## Prerequisites
- EXPLAIN output interpretation
- Database write permissions (for ANALYZE on write queries, use transaction)

## Inputs
- Target SELECT query
- Database connection with EXPLAIN ANALYZE support

## Workflow
1. Run `EXPLAIN ANALYZE <query>` (PostgreSQL) or `EXPLAIN ANALYZE <query>` (MySQL 8.0.18+)
2. Compare actual rows vs estimated rows — large divergence indicates stale statistics
3. Identify the slowest node by actual total time
4. Check loop count — high loops + low rows per loop = nested loop problem
5. Run a second time for warm cache comparison

## Validation Checklist
- [ ] Actual vs estimated rows are within 10x of each other
- [ ] Slowest node is identified and understood
- [ ] Loop count matches expectations
- [ ] No plan nodes with disproportionate time

## Common Failures
- Not wrapping write queries in a transaction
- Interpreting cold cache results without running twice
- Missing the impact of high loop counts

## Decision Points
- If actual rows >> estimated rows: run ANALYZE TABLE to refresh statistics
- If a single node dominates total time: focus optimization there
- If loops are high and per-loop rows are low: consider JOIN rewrite

## Performance
- EXPLAIN ANALYZE adds minimal overhead over actual query execution
- On MySQL 8.0.18+, EXPLAIN ANALYZE shows actual execution time

## Security
- EXPLAIN ANALYZE on production should run during low-traffic periods
- Wrap write queries in `BEGIN; EXPLAIN ANALYZE ...; ROLLBACK;`

## Related Rules
- 4-2-1: Always EXPLAIN Before Optimizing
- 4-2-4: Review And Apply Core Concepts

## Related Skills
- Interpret EXPLAIN Output
- Type Column Values

## Success Criteria
- Actual execution metrics captured per plan node
- Bottleneck node identified by total time
- Statistics freshness validated (actual vs estimated comparison)
