# Decomposition: 2.6 Relationship existence filtering (whereHas, whereDoesntHave, orWhereHas)

## Topic Overview
`whereHas` filters the parent query based on conditions on related models. It generates a correlated `EXISTS` subquery. While expressive, `whereHas` on large tables or with deeply nested closures can be expensive.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-6-relationship-existence-filtering/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.6 Relationship existence filtering (whereHas, whereDoesntHave, orWhereHas)
- **Purpose:** `whereHas` filters the parent query based on conditions on related models. It generates a correlated `EXISTS` subquery.
- **Difficulty:** Intermediate
- **Dependencies:** 2.3 Eager loading, 4.24 Join optimization, 2.7 Relationship counting

## Dependency Graph
**Depends on:** "2.3 Eager loading", "4.24 Join optimization", "2.7 Relationship counting"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **whereHas('relation', closure)**: Filters parents that have at least one matching related record. SQL: `WHERE EXISTS (SELECT 1 FROM related WHERE parent_id = parents.id AND ...)`.; - **whereDoesntHave('relation')**: Filters parents that have no matching related records.; - **orWhereHas**: OR combination with existing WHERE conditions.; - **Nested whereHas**: `whereHas('comments.user', fn($q) => ...)` — filters by nested relationship conditions..
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