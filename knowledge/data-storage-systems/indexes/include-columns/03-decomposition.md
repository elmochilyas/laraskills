# Decomposition: 3.16 INCLUDE columns (PostgreSQL, non-key columns in unique index)

## Topic Overview
`INCLUDE` adds non-key columns to a PostgreSQL index. These columns are stored in the index leaf pages but do not participate in the tree structure, uniqueness enforcement, or leftmost prefix rules. This enables covering indexes without expanding the B-Tree depth or affecting uniqueness constraints.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-16-include-columns/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.16 INCLUDE columns (PostgreSQL, non-key columns in unique index)
- **Purpose:** `INCLUDE` adds non-key columns to a PostgreSQL index. These columns are stored in the index leaf pages but do not participate in the tree structure, uniqueness enforcement, or leftmost prefix rules.
- **Difficulty:** Advanced
- **Dependencies:** 3.10 Covering indexes, 3.17 NULLS NOT DISTINCT

## Dependency Graph
**Depends on:** "3.10 Covering indexes", "3.17 NULLS NOT DISTINCT"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Non-key payload**: `CREATE UNIQUE INDEX ON users (email) INCLUDE (name, avatar_url)`. The index is unique on `email` but stores `name` and `avatar_url` as payload.; - **Index-only scans**: The included columns enable the database to satisfy queries without heap fetches.; - **No tree overhead**: INCLUDE columns don't affect the B-Tree structure, so they don't increase tree depth or affect uniqueness checks..
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