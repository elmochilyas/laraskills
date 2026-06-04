# Decomposition: 4.9 LIKE with leading wildcard sargability breakage

## Topic Overview
`LIKE '%value'` or `LIKE '%value%'` cannot use B-Tree indexes because the starting character is unknown. `LIKE 'value%'` (trailing wildcard only) IS sargable — it's a range scan over values starting with "value".

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-9-like-leading-wildcard/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.9 LIKE with leading wildcard sargability breakage
- **Purpose:** `LIKE '%value'` or `LIKE '%value%'` cannot use B-Tree indexes because the starting character is unknown. `LIKE 'value%'` (trailing wildcard only) IS sargable — it's a range scan over values starting with "value".
- **Difficulty:** Intermediate
- **Dependencies:** 3.13 Full-text indexes, 4.7 Sargable vs non-sargable

## Dependency Graph
**Depends on:** "3.13 Full-text indexes", "4.7 Sargable vs non-sargable"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Trailing wildcard only**: `LIKE 'prefix%'` — sargable. Uses B-Tree range scan `WHERE col >= 'prefix' AND col < 'prefiy'`.; - **Leading wildcard**: `LIKE '%suffix'` or `LIKE '%middle%'` — full table scan. No B-Tree index can help.; - **Alternatives**: Full-text index (FULLTEXT, GIN tsvector), pg_trgm (GIN trigram index), external search (Meilisearch, Algolia)..
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