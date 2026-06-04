# Decomposition: 4.22 Eloquent anti-patterns: nested whereHas chains, broad orWhereHas, sorting by related columns, polymorphic filters, repeated aggregate subqueries

## Topic Overview
Common Eloquent anti-patterns that degrade query performance: deeply nested `whereHas` chains, broad `orWhereHas` without proper indexing, sorting by related columns (requires JOIN or subquery), polymorphic filters on large tables, and repeated aggregate subqueries in paginated queries.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-22-eloquent-anti-patterns/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.22 Eloquent anti-patterns: nested whereHas chains, broad orWhereHas, sorting by related columns, polymorphic filters, repeated aggregate subqueries
- **Purpose:** Common Eloquent anti-patterns that degrade query performance: deeply nested `whereHas` chains, broad `orWhereHas` without proper indexing, sorting by related columns (requires JOIN or subquery), polymorphic filters on large tables, and repeated aggregate subqueries in paginated queries.
- **Difficulty:** Advanced
- **Dependencies:** 2.6 Relationship existence filtering, 2.8 Subquery selects

## Dependency Graph
**Depends on:** "2.6 Relationship existence filtering", "2.8 Subquery selects"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Nested whereHas**: `whereHas('a.b.c.d')` generates deeply nested EXISTS subqueries. Consider JOIN or denormalization.; - **Poly filters**: `where('type', 'Post')->orWhere('type', 'Video')` on polymorphic columns — the two-type query can't use a simple index.; - **Repeated aggregates**: `Post::withCount('comments')->withCount('likes')->withCount('shares')` — three separate subqueries in SELECT..
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