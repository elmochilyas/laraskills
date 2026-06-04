# Decomposition: 2.21 upsert operation (upsert, upsert with unique keys)

## Topic Overview
`upsert` inserts rows that don't exist and updates rows that do, in a single atomic operation. It uses unique indexes or primary keys to determine whether a row exists. Essential for idempotent imports, sync operations, and batch data ingestion.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-21-upsert/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.21 upsert operation (upsert, upsert with unique keys)
- **Purpose:** `upsert` inserts rows that don't exist and updates rows that do, in a single atomic operation. It uses unique indexes or primary keys to determine whether a row exists.
- **Difficulty:** Advanced
- **Dependencies:** 2.22 insertOrIgnore, 2.26 updateOrCreate, firstOrCreate

## Dependency Graph
**Depends on:** "2.22 insertOrIgnore", "2.26 updateOrCreate, firstOrCreate"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **upsert(array_values, unique_columns, update_columns)**: Insert new rows or update existing ones.; - **Atomic**: Single database transaction. No race condition between check and insert.; - **Unique key requirement**: The unique columns must have a unique index or primary key for conflict detection.; - **Batch upsert**: Multiple rows in one operation. `upsert([['email' => 'a@b.com', 'name' => 'A'], [...]], 'email', 'name')`..
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