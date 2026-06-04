# Decomposition: 4.5 MySQL Slow Query Log configuration and analysis (mysqldumpslow, pt-query-digest)

## Topic Overview
The MySQL Slow Query Log records queries exceeding a time threshold. Combined with `mysqldumpslow` (aggregation) and `pt-query-digest` (detailed analysis), it provides the definitive production dataset for identifying optimization targets.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-5-mysql-slow-query-log/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.5 MySQL Slow Query Log configuration and analysis (mysqldumpslow, pt-query-digest)
- **Purpose:** The MySQL Slow Query Log records queries exceeding a time threshold. Combined with `mysqldumpslow` (aggregation) and `pt-query-digest` (detailed analysis), it provides the definitive production dataset for identifying optimization targets.
- **Difficulty:** Intermediate
- **Dependencies:** 4.6 PostgreSQL slow query config, 4.30 Production optimization workflow

## Dependency Graph
**Depends on:** "4.6 PostgreSQL slow query config", "4.30 Production optimization workflow"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Configuration**: `slow_query_log = 1`, `long_query_time = 0.5` (seconds), `log_queries_not_using_indexes = 1`.; - **mysqldumpslow**: Summarizes slow log by query pattern. `-s t` sorts by total time, `-t 10` shows top 10.; - **pt-query-digest**: Percona's comprehensive analyzer. Groups queries by fingerprint, shows histogram, query times, index usage..
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