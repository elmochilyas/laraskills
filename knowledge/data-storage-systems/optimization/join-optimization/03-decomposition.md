# Decomposition: 4.24 Join optimization (join type selection, join order, index requirements for joins)

## Topic Overview
Join performance depends on: selecting the correct join type (INNER vs LEFT), ensuring the join column on the inner table is indexed, and letting the optimizer determine join order. The most important rule: the column used in the ON clause of the INNER/joined table MUST be indexed.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-24-join-optimization/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.24 Join optimization (join type selection, join order, index requirements for joins)
- **Purpose:** Join performance depends on: selecting the correct join type (INNER vs LEFT), ensuring the join column on the inner table is indexed, and letting the optimizer determine join order. The most important rule: the column used in the ON clause of the INNER/joined table MUST be indexed.
- **Difficulty:** Intermediate
- **Dependencies:** 2.13 Joins, 3.24 Indexing foreign key columns

## Dependency Graph
**Depends on:** "2.13 Joins", "3.24 Indexing foreign key columns"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Join column index**: `JOIN orders ON orders.user_id = users.id` — `orders.user_id` must be indexed. Without it, the database performs a full table scan on `orders` for every row in `users`.; - **INNER vs LEFT**: INNER JOIN can optimize by using the smaller table as the driving table. LEFT JOIN always drives from the left table.; - **Join order**: The optimizer usually determines the best join order. Use `STRAIGHT_JOIN` (MySQL) only when the optimizer chooses poorly..
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