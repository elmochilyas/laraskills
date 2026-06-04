# Decomposition: 4.6 PostgreSQL slow query configuration (log_min_duration_statement, auto_explain)

## Topic Overview
PostgreSQL's `log_min_duration_statement` logs queries exceeding a duration threshold. The `auto_explain` extension logs EXPLAIN plans for slow queries, enabling post-hoc analysis without reproducing the slow query.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-6-postgresql-slow-query-config/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.6 PostgreSQL slow query configuration (log_min_duration_statement, auto_explain)
- **Purpose:** PostgreSQL's `log_min_duration_statement` logs queries exceeding a duration threshold. The `auto_explain` extension logs EXPLAIN plans for slow queries, enabling post-hoc analysis without reproducing the slow query.
- **Difficulty:** Intermediate
- **Dependencies:** 4.5 MySQL Slow Query Log, 4.30 Production optimization workflow

## Dependency Graph
**Depends on:** "4.5 MySQL Slow Query Log", "4.30 Production optimization workflow"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **log_min_duration_statement**: Set to 500 (ms). Logs SQL text and duration. `0` logs all queries.; - **auto_explain**: Extension that logs EXPLAIN plans for queries above a threshold. `auto_explain.log_min_duration = 500`.; - **pg_stat_statements**: Tracks execution statistics per normalized query. Total time, mean time, calls, rows, block hits/reads..
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