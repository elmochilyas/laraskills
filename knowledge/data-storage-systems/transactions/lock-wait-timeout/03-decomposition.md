# Decomposition: 9.10 Lock wait timeout (innodb_lock_wait_timeout, deadlock_timeout, lock_timeout)

## Topic Overview
Lock wait timeout controls how long a transaction waits for a lock before giving up. MySQL: `innodb_lock_wait_timeout` (default 50s). PostgreSQL: `deadlock_timeout` (default 1s) and `lock_timeout` (default 0 = no timeout).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-10-lock-wait-timeout/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.10 Lock wait timeout (innodb_lock_wait_timeout, deadlock_timeout, lock_timeout)
- **Purpose:** Lock wait timeout controls how long a transaction waits for a lock before giving up. MySQL: `innodb_lock_wait_timeout` (default 50s).
- **Difficulty:** Advanced
- **Dependencies:** 9.8 Deadlock detection, 9.5 Row-level locks

## Dependency Graph
**Depends on:** "9.8 Deadlock detection", "9.5 Row-level locks"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **innodb_lock_wait_timeout**: MySQL. Time (seconds) a transaction waits for a row/table lock. After timeout, MySQL rolls back the waiting transaction (not the lock holder).; - **deadlock_timeout**: PostgreSQL. Time to wait before checking for deadlock. Not a lock wait timeout per se — checks for deadlock after this duration.; - **lock_timeout**: PostgreSQL (v9.6+). `SET lock_timeout = '5s'` — transaction fails if a lock is not acquired within this time..
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