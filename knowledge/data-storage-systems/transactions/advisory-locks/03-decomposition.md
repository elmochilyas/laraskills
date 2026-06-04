# Decomposition: 9.7 Advisory locks (application-level coordination via PostgreSQL pg_advisory_lock)

## Topic Overview
PostgreSQL advisory locks are application-level locks managed by the database but not tied to any table row. `pg_advisory_lock(key)` — exclusive. `pg_advisory_lock_shared(key)` — shared.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-7-advisory-locks/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.7 Advisory locks (application-level coordination via PostgreSQL pg_advisory_lock)
- **Purpose:** PostgreSQL advisory locks are application-level locks managed by the database but not tied to any table row. `pg_advisory_lock(key)` — exclusive.
- **Difficulty:** Advanced
- **Dependencies:** 9.5 Row-level locks, 9.11 Transaction scoping

## Dependency Graph
**Depends on:** "9.5 Row-level locks", "9.11 Transaction scoping"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Session-level lock**: `pg_advisory_lock(key)` — held until session ends or explicitly unlocked. Must explicitly unlock.; - **Transaction-level lock**: `pg_advisory_xact_lock(key)` — held until transaction ends. Automatically released on COMMIT/ROLLBACK.; - **Use cases**: Prevent concurrent job processing, coordinate backup operations, enforce sequential processing of specific resources..
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