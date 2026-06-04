# Decomposition: 4.4 Extra column flags: Using index (covering), Using filesort, Using temporary, Using where, Using index condition

## Topic Overview
The `Extra` column in EXPLAIN reveals additional operations: "Using index" = covering index (no table access). "Using filesort" = sort penalty (add sort column to index). "Using temporary" = temp table (rework query or add indexes).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-4-extra-column-flags/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.4 Extra column flags: Using index (covering), Using filesort, Using temporary, Using where, Using index condition
- **Purpose:** The `Extra` column in EXPLAIN reveals additional operations: "Using index" = covering index (no table access). "Using filesort" = sort penalty (add sort column to index).
- **Difficulty:** Intermediate
- **Dependencies:** 4.1 EXPLAIN output interpretation, 4.3 Type column values

## Dependency Graph
**Depends on:** "4.1 EXPLAIN output interpretation", "4.3 Type column values"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Using index (cover)**: All needed columns are in the index. No heap fetches. Best case.; - **Using filesort**: Separate sort operation. Add ORDER BY column to index or align index order with sort direction.; - **Using temporary**: Temporary table created for GROUP BY, DISTINCT, or UNION. Usually indicates missing index for grouping column.; - **Using where**: Rows are fetched from storage, then filtered. The index didn't fully cover the WHERE. May indicate missing composite index.; - **Using index condition (ICP)**: MySQL pushes WHERE conditions down to the storage engine for evaluation. Good — reduces data transferred to server..
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