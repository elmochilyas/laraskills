# Decomposition: 4.18 Keyset pagination (efficient for large datasets, stable sort required)

## Topic Overview
Keyset pagination (also called "seek pagination") is similar to cursor pagination but uses composite keys to paginate through sorted result sets with non-unique sort columns. It requires a stable sort order and a tiebreaker column (typically the primary key).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-18-keyset-pagination/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.18 Keyset pagination (efficient for large datasets, stable sort required)
- **Purpose:** Keyset pagination (also called "seek pagination") is similar to cursor pagination but uses composite keys to paginate through sorted result sets with non-unique sort columns. It requires a stable sort order and a tiebreaker column (typically the primary key).
- **Difficulty:** Advanced
- **Dependencies:** 4.16 Offset pagination, 4.17 Cursor pagination

## Dependency Graph
**Depends on:** "4.16 Offset pagination", "4.17 Cursor pagination"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Multi-column cursor**: `WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT 20` — supports sorting by non-unique columns.; - **Tiebreaker**: The second column (usually PK) ensures stability when multiple rows share the same sort value.; - **No OFFSET**: Like cursor pagination, performance is constant per page..
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