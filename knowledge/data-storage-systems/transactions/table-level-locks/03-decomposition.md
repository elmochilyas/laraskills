# Decomposition: 9.6 Table-level locks (LOCK TABLES, implications in production)

## Topic Overview
Table-level locks (`LOCK TABLES orders WRITE`, `LOCK TABLES orders READ`) block all other sessions from accessing the table. WRITE lock: exclusive — no other session can read or write. READ lock: shared — others can read but not write.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-6-table-level-locks/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.6 Table-level locks (LOCK TABLES, implications in production)
- **Purpose:** Table-level locks (`LOCK TABLES orders WRITE`, `LOCK TABLES orders READ`) block all other sessions from accessing the table. WRITE lock: exclusive — no other session can read or write.
- **Difficulty:** Intermediate
- **Dependencies:** 9.5 Row-level locks, 9.11 Transaction scoping

## Dependency Graph
**Depends on:** "9.5 Row-level locks", "9.11 Transaction scoping"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **LOCK TABLES ... WRITE**: Only the locking session can read/write. All other sessions wait. Blocks all queries against the table.; - **LOCK TABLES ... READ**: Locking session and others can read. No writes allowed.; - **DDL implication**: `ALTER TABLE`, `DROP TABLE` take an exclusive metadata lock. Does not require explicit `LOCK TABLES`. The lock is implicit..
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