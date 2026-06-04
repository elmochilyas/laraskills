# Decomposition: 9.4 MySQL InnoDB isolation specifics (REPEATABLE READ, next-key locking, gap locks)

## Topic Overview
MySQL InnoDB's default REPEATABLE READ uses next-key locks (record lock + gap lock) to prevent phantom reads. Gap locks lock ranges between index entries, preventing INSERT of new rows in that range. This causes more lock contention than PostgreSQL's MVCC REPEATABLE READ.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-4-mysql-innodb-isolation-specifics/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.4 MySQL InnoDB isolation specifics (REPEATABLE READ, next-key locking, gap locks)
- **Purpose:** MySQL InnoDB's default REPEATABLE READ uses next-key locks (record lock + gap lock) to prevent phantom reads. Gap locks lock ranges between index entries, preventing INSERT of new rows in that range.
- **Difficulty:** Advanced
- **Dependencies:** 9.2 Isolation levels, 9.8 Deadlock detection

## Dependency Graph
**Depends on:** "9.2 Isolation levels", "9.8 Deadlock detection"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Next-key lock**: Combination of row lock + gap lock on the gap before the row. `SELECT * FROM orders WHERE id > 100 FOR UPDATE` locks rows with id > 100 AND the gap after the last row (prevents INSERT id > max).; - **Gap lock**: Locks a range between index entries. Can cause deadlocks when transactions insert into overlapping ranges.; - **REPEATABLE READ implementation**: InnoDB uses consistent read (MVCC snapshot) for plain SELECT. `SELECT ... FOR UPDATE/LOCK IN SHARE MODE` uses next-key locks for the index scanned range..
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