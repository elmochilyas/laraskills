# Decomposition: 4.16 Offset pagination deep-page problems (scanning discarded rows)

## Topic Overview
`LIMIT 20 OFFSET 100000` reads 100,020 rows from the table, then discards the first 100,000. As offset increases, pagination gets progressively slower. The database scans all discarded rows on every page.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-16-offset-pagination-deep-page/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.16 Offset pagination deep-page problems (scanning discarded rows)
- **Purpose:** `LIMIT 20 OFFSET 100000` reads 100,020 rows from the table, then discards the first 100,000. As offset increases, pagination gets progressively slower.
- **Difficulty:** Intermediate
- **Dependencies:** 4.17 Cursor pagination, 4.18 Keyset pagination, 4.19 chunk method tradeoffs

## Dependency Graph
**Depends on:** "4.17 Cursor pagination", "4.18 Keyset pagination", "4.19 chunk method tradeoffs"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **OFFSET cost**: Each OFFSET skips N rows by reading them. Page 5000 of 20 items reads 100,000 rows.; - **Cursor pagination fix**: `WHERE created_at < ? ORDER BY created_at DESC LIMIT 20` — no offset, always reads 20 rows.; - **Keyset pagination**: Like cursor but using a stable sort key..
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