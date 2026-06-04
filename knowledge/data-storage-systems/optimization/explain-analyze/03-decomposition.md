# Decomposition: 4.2 EXPLAIN ANALYZE (actual time, loops, actual rows)

## Topic Overview
`EXPLAIN ANALYZE` executes the query and returns actual execution metrics: actual time per node, loop count, actual rows returned, and execution time. Unlike `EXPLAIN` (estimates), `EXPLAIN ANALYZE` shows ground truth, revealing plan inaccuracies, parameterized plan issues, and time distribution.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-2-explain-analyze/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.2 EXPLAIN ANALYZE (actual time, loops, actual rows)
- **Purpose:** `EXPLAIN ANALYZE` executes the query and returns actual execution metrics: actual time per node, loop count, actual rows returned, and execution time. Unlike `EXPLAIN` (estimates), `EXPLAIN ANALYZE` shows ground truth, revealing plan inaccuracies, parameterized plan issues, and time distribution.
- **Difficulty:** Intermediate
- **Dependencies:** 4.1 EXPLAIN output interpretation, 4.26 Correlation between row count and query response time

## Dependency Graph
**Depends on:** "4.1 EXPLAIN output interpretation", "4.26 Correlation between row count and query response time"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Actual vs estimated**: `EXPLAIN` shows the planner's estimates. `EXPLAIN ANALYZE` shows what actually happened. Widely divergent actual vs estimated rows indicates stale statistics.; - **Timing per node**: Each query plan node shows actual startup time and total time. Identifies which operation is the bottleneck.; - **Loops**: Number of times a node is executed. High loops with low actual rows = nested loop problem..
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