# Decomposition: 9.5 Row-level locks (SELECT ... FOR UPDATE, SKIP LOCKED, NOWAIT)

## Topic Overview
Row-level locks explicitly lock selected rows for update or share. `SELECT ... FOR UPDATE` (exclusive lock — other transactions can't read/write locked rows).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-5-row-level-locks/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.5 Row-level locks (SELECT ... FOR UPDATE, SKIP LOCKED, NOWAIT)
- **Purpose:** Row-level locks explicitly lock selected rows for update or share. `SELECT ...
- **Difficulty:** Advanced
- **Dependencies:** 9.1 ACID, 9.15 Pessimistic locking

## Dependency Graph
**Depends on:** "9.1 ACID", "9.15 Pessimistic locking"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **FOR UPDATE**: Exclusive row lock. No other transaction can SELECT FOR UPDATE, UPDATE, or DELETE the row. Plain SELECT still reads (MVCC).; - **FOR SHARE** (MySQL 8.0+: `FOR SHARE`, previously `LOCK IN SHARE MODE`): Shared lock. Other transactions can read but not update/delete. Blocks FOR UPDATE.; - **SKIP LOCKED** (MySQL 8.0+, PostgreSQL 9.5+): Skip any rows that are locked. Returns only unlocked rows. No waiting.; - **NOWAIT**: Return error immediately if any selected row is locked. No waiting..
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