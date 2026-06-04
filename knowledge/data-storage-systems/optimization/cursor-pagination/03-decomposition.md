# Decomposition: 4.17 Cursor pagination (whereValueOrderBy, seek method)

## Topic Overview
Cursor pagination uses WHERE conditions on a unique, ordered column to paginate without OFFSET. `Model::where('id', '>', $lastId)->orderBy('id')->limit(20)`. Each page reads exactly 20 rows.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-17-cursor-pagination/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.17 Cursor pagination (whereValueOrderBy, seek method)
- **Purpose:** Cursor pagination uses WHERE conditions on a unique, ordered column to paginate without OFFSET. `Model::where('id', '>', $lastId)->orderBy('id')->limit(20)`.
- **Difficulty:** Advanced
- **Dependencies:** 4.16 Offset pagination, 4.18 Keyset pagination

## Dependency Graph
**Depends on:** "4.16 Offset pagination", "4.18 Keyset pagination"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **WHERE-based pagination**: `WHERE id > ? ORDER BY id LIMIT 20` — no offset, always reads 20 rows.; - **Stable sort required**: The cursor column must be unique and monotonically increasing/decreasing.; - **Laravel cursorPaginate()**: Returns `CursorPaginator` with `nextCursor` and `previousCursor`. Works with `id`, `created_at`, or any unique, ordered column..
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