# Decomposition: 4.30 Production optimization workflow: profile -> identify -> measure -> fix -> verify -> monitor

## Topic Overview
Systematic query optimization follows a closed-loop workflow: **Profile** the production workload, **Identify** the bottleneck queries, **Measure** their impact and baseline, **Fix** the root cause (index, query rewrite, schema change), **Verify** the improvement via A/B comparison, and **Monitor** for regression. Skipping any step produces guesswork optimization — fixing the wrong query, optimizing a 2ms query while a 2s query is ignored, or deploying a fix without verifying it works under production load.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-30-production-optimization-workflow/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.30 Production optimization workflow: profile -> identify -> measure -> fix -> verify -> monitor
- **Purpose:** Systematic query optimization follows a closed-loop workflow: **Profile** the production workload, **Identify** the bottleneck queries, **Measure** their impact and baseline, **Fix** the root cause (index, query rewrite, schema change), **Verify** the improvement via A/B comparison, and **Monitor** for regression. Skipping any step produces guesswork optimization — fixing the wrong query, optimizing a 2ms query while a 2s query is ignored, or deploying a fix without verifying it works under production load.
- **Difficulty:** Advanced
- **Dependencies:** 4.1 EXPLAIN output interpretation, 4.5 MySQL slow query log, 4.6 PostgreSQL slow query configuration, 4.27 Profiling tools, 4.28 Endpoint query governance

## Dependency Graph
**Depends on:** "4.1 EXPLAIN output interpretation", "4.5 MySQL slow query log", "4.6 PostgreSQL slow query configuration", "4.27 Profiling tools", "4.28 Endpoint query governance"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Profile**: Collect raw performance data from production — slow query log, pg_stat_statements, performance_schema, APM traces.; - **Identify**: Rank queries by total impact (frequency × average duration). Fix the queries that cost the most aggregate database time, not the single slowest query.; - **Measure**: Establish baseline metrics (p50/p95/p99 duration, rows examined, call frequency) before making changes.; - **Fix**: Apply the appropriate optimization — index addition, query rewrite, eager loading fix, schema change.; - **Verify**: Compare post-fix metrics against baseline. Confirm improvement under production-like concurrency, not just single-user dev..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization