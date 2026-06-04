# Decomposition: 4.1 EXPLAIN output interpretation (type, possible_keys, key, rows, Extra, filtered)

## Topic Overview
EXPLAIN shows how the database executes a query. Key columns: `type` (access method), `possible_keys` (candidate indexes), `key` (chosen index), `rows` (rows examined estimate), `Extra` (additional operations), `filtered` (percentage of rows kept after WHERE). Reading EXPLAIN is the primary skill for query optimization.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-1-explain-output-interpretation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.1 EXPLAIN output interpretation (type, possible_keys, key, rows, Extra, filtered)
- **Purpose:** EXPLAIN shows how the database executes a query. Key columns: `type` (access method), `possible_keys` (candidate indexes), `key` (chosen index), `rows` (rows examined estimate), `Extra` (additional operations), `filtered` (percentage of rows kept after WHERE).
- **Difficulty:** Foundation
- **Dependencies:** 4.2 EXPLAIN ANALYZE, 4.3 Type column values, 4.4 Extra column flags

## Dependency Graph
**Depends on:** "4.2 EXPLAIN ANALYZE", "4.3 Type column values", "4.4 Extra column flags"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **type (access method)**: const > eq_ref > ref > range > index > ALL. const = best (unique lookup). ALL = worst (full table scan).; - **possible_keys vs key**: possible_keys shows which indexes could be used. key shows which was chosen. If possible_keys is non-empty but key is NULL, the optimizer chose not to use any index.; - **rows**: Estimated rows the database must examine. Lower is better. Compare to actual row count to see estimation accuracy.; - **Extra flags**: "Using index" = covering index (no table access). "Using filesort" = sort not using index. "Using temporary" = temp table created. "Using where" = post-filter applied..
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