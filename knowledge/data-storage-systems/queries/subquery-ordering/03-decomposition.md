# Decomposition: 2.9 Subquery ordering (orderBy with subquery)

## Topic Overview
Subquery ordering sorts parent results by a computed value from related tables. For example, ordering users by their most recent order date or by total spending. This avoids the N+1 pattern of sorting in PHP after loading all data.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-9-subquery-ordering/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.9 Subquery ordering (orderBy with subquery)
- **Purpose:** Subquery ordering sorts parent results by a computed value from related tables. For example, ordering users by their most recent order date or by total spending.
- **Difficulty:** Advanced
- **Dependencies:** 2.8 Subquery selects, 4.25 Subquery optimization, 3.26 Index alignment with query patterns

## Dependency Graph
**Depends on:** "2.8 Subquery selects", "4.25 Subquery optimization", "3.26 Index alignment with query patterns"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **orderBy with subquery**: `User::orderByDesc(Order::select('created_at')->whereColumn('user_id', 'users.id')->latest()->limit(1))`.; - **Performance**: The subquery executes as part of the query plan. An index on the subquery's WHERE and ORDER BY columns is critical..
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