# Decomposition: 4.10 function wraps in WHERE clause (LOWER, CAST: index bypass)

## Topic Overview
Any function that wraps an indexed column in a WHERE clause breaks sargability. Common culprits: `LOWER(col)`, `UPPER(col)`, `CAST(col AS type)`, `YEAR(col)`, `DATE(col)`, `TRIM(col)`. PostgreSQL functional indexes can mitigate some cases.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-10-function-wraps-where-clause/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.10 function wraps in WHERE clause (LOWER, CAST: index bypass)
- **Purpose:** Any function that wraps an indexed column in a WHERE clause breaks sargability. Common culprits: `LOWER(col)`, `UPPER(col)`, `CAST(col AS type)`, `YEAR(col)`, `DATE(col)`, `TRIM(col)`.
- **Difficulty:** Advanced
- **Dependencies:** 3.28 Sargability rule, 3.12 Functional/expression indexes, 4.7 Sargable vs non-sargable

## Dependency Graph
**Depends on:** "3.28 Sargability rule", "3.12 Functional/expression indexes", "4.7 Sargable vs non-sargable"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Rule**: If the column is wrapped in a function, the B-Tree index on the raw column cannot be used.; - **Functional index solution**: Index the expression. `CREATE INDEX ON users (LOWER(email))`. Query must use the exact same expression.; - **Cast sargability**: `CAST(id AS CHAR) = '123'` — casting the column breaks the index. Cast the input instead..
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