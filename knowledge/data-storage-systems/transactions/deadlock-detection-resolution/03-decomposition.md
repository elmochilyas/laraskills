# Decomposition: 9.8 Deadlock detection and resolution (innodb_deadlock_detect, wait-for graph)

## Topic Overview
Deadlock occurs when two transactions each hold a lock the other needs. MySQL InnoDB detects deadlocks via wait-for graph. InnoDB automatically rolls back the transaction that detected the deadlock (the one with the fewest locks).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-8-deadlock-detection-resolution/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.8 Deadlock detection and resolution (innodb_deadlock_detect, wait-for graph)
- **Purpose:** Deadlock occurs when two transactions each hold a lock the other needs. MySQL InnoDB detects deadlocks via wait-for graph.
- **Difficulty:** Advanced
- **Dependencies:** 9.9 Deadlock prevention, 9.20 Transaction retry logic

## Dependency Graph
**Depends on:** "9.9 Deadlock prevention", "9.20 Transaction retry logic"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **InnoDB deadlock detection**: Runs when a transaction waits for a lock. Builds wait-for graph. If cycle detected, chooses victim transaction (rolls back, releases locks).; - **PostgreSQL deadlock timeout**: Doesn't actively detect. When a lock wait exceeds `deadlock_timeout` (default 1s), checks if waiting would cause a deadlock. If yes, aborts one transaction.; - **Deadlock error code**: MySQL: `1213 (40001)`, PostgreSQL: `40P01`. Both are serialization failures — retry the transaction..
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