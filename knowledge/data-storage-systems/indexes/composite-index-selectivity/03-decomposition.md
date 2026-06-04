# Decomposition: 3.18 Composite index selectivity and cardinality analysis

## Topic Overview
Cardinality (number of distinct values) determines index selectivity. High cardinality columns (ID, email) are highly selective — they narrow results to few rows. Low cardinality columns (status, boolean) are poorly selective.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-18-composite-index-selectivity/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.18 Composite index selectivity and cardinality analysis
- **Purpose:** Cardinality (number of distinct values) determines index selectivity. High cardinality columns (ID, email) are highly selective — they narrow results to few rows.
- **Difficulty:** Advanced
- **Dependencies:** 3.8 Composite indexes, 3.9 Column ordering, 3.1 B-Tree

## Dependency Graph
**Depends on:** "3.8 Composite indexes", "3.9 Column ordering", "3.1 B-Tree"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Selectivity**: Fraction of rows returned per distinct value. `1/cardinality`. Higher = more selective = better index.; - **Cardinality distribution**: A column may have high cardinality overall but low cardinality in the queried subset.; - **Leading column selectivity**: The index's leading column should be selective enough to meaningfully reduce the search space..
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