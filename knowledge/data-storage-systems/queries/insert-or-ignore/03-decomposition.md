# Decomposition: 2.22 insertOrIgnore

## Topic Overview
`insertOrIgnore` inserts rows and silently ignores any rows that would cause duplicate key violations. Unlike `upsert`, it does NOT update existing rows — it simply skips them. Useful for batch inserts where some rows may already exist and should not be updated.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-22-insert-or-ignore/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.22 insertOrIgnore
- **Purpose:** `insertOrIgnore` inserts rows and silently ignores any rows that would cause duplicate key violations. Unlike `upsert`, it does NOT update existing rows — it simply skips them.
- **Difficulty:** Intermediate
- **Dependencies:** 2.21 upsert, 2.26 updateOrCreate, firstOrCreate

## Dependency Graph
**Depends on:** "2.21 upsert", "2.26 updateOrCreate, firstOrCreate"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Silent skip**: Rows that violate unique constraints are not inserted. No error thrown, no update performed.; - **Batch operation**: Accepts an array of rows. `Model::insertOrIgnore([...])`.; - **No model events**: Like `upsert`, does not fire model lifecycle events..
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