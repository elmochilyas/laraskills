# Decomposition: 11.8 MySQL ALGORITHM options (INSTANT, INPLACE, COPY) and LOCK options (NONE, SHARED, EXCLUSIVE)

## Topic Overview
MySQL ALTER TABLE supports three algorithms: INSTANT (metadata only — MySQL 8.0.12+), INPLACE (rebuilds table but allows concurrent DML), COPY (full table copy, blocks DML). LOCK options: NONE (no lock — concurrent reads/writes), SHARED (read lock — concurrent reads), EXCLUSIVE (exclusive lock — no concurrent access). Choose algorithm + lock for zero-downtime DDL.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-8-mysql-algorithm-options/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.8 MySQL ALGORITHM options (INSTANT, INPLACE, COPY) and LOCK options (NONE, SHARED, EXCLUSIVE)
- **Purpose:** MySQL ALTER TABLE supports three algorithms: INSTANT (metadata only — MySQL 8.0.12+), INPLACE (rebuilds table but allows concurrent DML), COPY (full table copy, blocks DML). LOCK options: NONE (no lock — concurrent reads/writes), SHARED (read lock — concurrent reads), EXCLUSIVE (exclusive lock — no concurrent access).
- **Difficulty:** Advanced
- **Dependencies:** 13.5 Online DDL, 13.6 ALGORITHM=INSTANT

## Dependency Graph
**Depends on:** "13.5 Online DDL", "13.6 ALGORITHM=INSTANT"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **INSTANT**: ALGORITHM=INSTANT. Operations: ADD COLUMN (append only), DROP COLUMN (MySQL 8.0.29+), ADD/DROP DEFAULT, RENAME COLUMN (8.0.29+). Metadata only. No table rebuild.; - **INPLACE**: ALGORITHM=INPLACE. Operations: ADD/DROP INDEX, ADD/DROP FK, CHANGE COLUMN type (some). Rebuilds table. Concurrent DML allowed (LOCK=NONE).; - **COPY**: ALGORITHM=COPY. All operations that can't use INSTANT/INPLACE. Full table copy. Blocks DML..
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