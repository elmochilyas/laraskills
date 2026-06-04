# Decomposition: 2.10 Query builder methods (select, where, join, groupBy, having, orderBy, limit, offset)

## Topic Overview
Laravel's query builder provides a fluent interface for constructing SQL queries. The core methods — select, where, join, groupBy, having, orderBy, limit, offset — map directly to SQL clauses. Understanding their generated SQL and index requirements is essential.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-10-query-builder-methods/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.10 Query builder methods (select, where, join, groupBy, having, orderBy, limit, offset)
- **Purpose:** Laravel's query builder provides a fluent interface for constructing SQL queries. The core methods — select, where, join, groupBy, having, orderBy, limit, offset — map directly to SQL clauses.
- **Difficulty:** Foundation
- **Dependencies:** 2.11 Where clause types, 2.13 Joins, 4.16 Offset pagination deep-page problems

## Dependency Graph
**Depends on:** "2.11 Where clause types", "2.13 Joins", "4.16 Offset pagination deep-page problems"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **select()**: Specifies columns. `select('id', 'name')` generates `SELECT id, name`. Default is `SELECT *`.; - **where()**: Adds WHERE conditions. Multiple `where()` calls are ANDed.; - **join()**: Adds JOIN clauses. Supports inner, left, right, cross joins.; - **groupBy() / having()**: For aggregation queries. GROUP BY columns must appear in SELECT if not aggregated.; - **orderBy()**: Adds ORDER BY. `orderBy('created_at', 'desc')`..
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