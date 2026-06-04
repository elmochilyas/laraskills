# Decomposition: 9.15 Pessimistic locking (sharedLock, lockForUpdate in Eloquent)

## Topic Overview
Pessimistic locking explicitly acquires locks on rows before modifying them. Eloquent methods: `sharedLock()` (shared lock — SELECT ... FOR SHARE), `lockForUpdate()` (exclusive lock — SELECT ...

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-15-pessimistic-locking/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.15 Pessimistic locking (sharedLock, lockForUpdate in Eloquent)
- **Purpose:** Pessimistic locking explicitly acquires locks on rows before modifying them. Eloquent methods: `sharedLock()` (shared lock — SELECT ...
- **Difficulty:** Advanced
- **Dependencies:** 9.5 Row-level locks, 9.14 Optimistic locking

## Dependency Graph
**Depends on:** "9.5 Row-level locks", "9.14 Optimistic locking"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **sharedLock()**: `Model::where(...)->sharedLock()->get()` — adds `LOCK IN SHARE MODE` (MySQL) or `FOR SHARE` (PostgreSQL). Shared lock: others can read but not update/delete.; - **lockForUpdate()**: `Model::where(...)->lockForUpdate()->get()` — adds `FOR UPDATE`. Exclusive lock: others cannot update, delete, or SELECT FOR UPDATE on locked rows.; - **Lock release**: All locks released on COMMIT or ROLLBACK. Holding locks for minimum duration is critical..
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