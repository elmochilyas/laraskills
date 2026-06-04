# Decomposition: 11.12 Migration locking (MySQL metadata locks, advisory locks for coordination)

## Topic Overview
MySQL DDL statements acquire metadata locks (MDL) to prevent concurrent DDL/DML conflicts. `ALTER TABLE` acquires exclusive MDL. If a long-running query holds a shared MDL (during table access), the ALTER TABLE waits.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-12-migration-locking/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.12 Migration locking (MySQL metadata locks, advisory locks for coordination)
- **Purpose:** MySQL DDL statements acquire metadata locks (MDL) to prevent concurrent DDL/DML conflicts. `ALTER TABLE` acquires exclusive MDL.
- **Difficulty:** Intermediate
- **Dependencies:** 11.8 MySQL ALGORITHM, 9.6 Table-level locks

## Dependency Graph
**Depends on:** "11.8 MySQL ALGORITHM", "9.6 Table-level locks"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Metadata lock (MDL)**: MySQL 5.5+. Any query on a table acquires shared MDL. `ALTER TABLE` requires exclusive MDL. If a query holds shared MDL, ALTER waits.; - **MDL queue**: While ALTER waits for MDL, all subsequent queries on the table are blocked. A simple `SELECT * FROM orders WHERE id = 1` can cause a chain reaction.; - **Prevention**: Kill long-running queries before ALTER. Use `ALTER TABLE ... WAIT N` (MySQL 8.0+) or online tools..
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