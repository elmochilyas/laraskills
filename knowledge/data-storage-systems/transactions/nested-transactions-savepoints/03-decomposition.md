# Decomposition: 9.12 Nested transactions and savepoints (SAVEPOINT, ROLLBACK TO SAVEPOINT)

## Topic Overview
Laravel supports nested transactions via database savepoints. Inner `DB::transaction()` creates a savepoint (not a true nested transaction). On inner rollback, only the changes since the savepoint are undone.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-12-nested-transactions-savepoints/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.12 Nested transactions and savepoints (SAVEPOINT, ROLLBACK TO SAVEPOINT)
- **Purpose:** Laravel supports nested transactions via database savepoints. Inner `DB::transaction()` creates a savepoint (not a true nested transaction).
- **Difficulty:** Intermediate
- **Dependencies:** 9.11 Transaction scoping, 9.13 Transaction length

## Dependency Graph
**Depends on:** "9.11 Transaction scoping", "9.13 Transaction length"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Savepoint**: A marker within a transaction. `SAVEPOINT sp1`. `ROLLBACK TO SAVEPOINT sp1` — rolls back to the savepoint, keeping earlier transaction changes.; - **Laravel nesting**: `DB::transaction(fn() => DB::transaction(...))` — outer creates transaction, inner creates savepoint. Inner rollback doesn't abort outer.; - **Transaction count**: `DB::transactionLevel()` — 0 = no transaction, 1 = outer, 2 = inner (savepoint)..
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