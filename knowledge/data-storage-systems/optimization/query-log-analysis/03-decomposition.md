# Decomposition: 4.26 Query log analysis and identifying slow queries in production

## Topic Overview
Production query log analysis identifies which queries consume the most database time: total time × frequency. A query taking 2ms but running 10,000 times/second is worse than a query taking 200ms running once/second. Log all queries with duration, group by query shape (normalized query), and rank by total time.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-26-query-log-analysis/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.26 Query log analysis and identifying slow queries in production
- **Purpose:** Production query log analysis identifies which queries consume the most database time: total time × frequency. A query taking 2ms but running 10,000 times/second is worse than a query taking 200ms running once/second.
- **Difficulty:** Advanced
- **Dependencies:** 4.5 EXPLAIN/EXPLAIN ANALYZE, 4.27 Profiling tools

## Dependency Graph
**Depends on:** "4.5 EXPLAIN/EXPLAIN ANALYZE", "4.27 Profiling tools"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Slow query log**: MySQL/MariaDB `long_query_time`, PostgreSQL `log_min_duration_statement`. Captures queries exceeding duration threshold. First line of defense.; - **Normalized query**: `SELECT * FROM posts WHERE id = ?`. Grouping by normalized form aggregates identical queries with different parameters.; - **Total time = avg time × frequency**: The query with the highest total database time is the most impactful candidate for optimization..
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