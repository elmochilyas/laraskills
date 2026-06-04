# Decomposition: 9.18 Write skew prevention (the anomaly that REPEATABLE READ misses)

## Topic Overview
Write skew: two transactions read the same overlapping data, both check a condition that is true individually, both write based on that condition. Individually consistent, collectively the invariant is violated. REPEATABLE READ does NOT prevent write skew.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-18-write-skew-prevention/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.18 Write skew prevention (the anomaly that REPEATABLE READ misses)
- **Purpose:** Write skew: two transactions read the same overlapping data, both check a condition that is true individually, both write based on that condition. Individually consistent, collectively the invariant is violated.
- **Difficulty:** Advanced
- **Dependencies:** 9.2 Isolation levels, 9.17 SSI

## Dependency Graph
**Depends on:** "9.2 Isolation levels", "9.17 SSI"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Classic example**: Doctor on-call schedule. Two doctors check: "Is another doctor on call?" Both see none → both set themselves as on-call. Invariant: at least one doctor on call → violated.; - **Why REPEATABLE READ fails**: Each transaction reads a snapshot showing no conflicting data. Both writes succeed because they modify different rows. No lock conflict.; - **Prevention**: `SELECT ... FOR UPDATE` on related rows (pessimistic lock) or use SERIALIZABLE isolation level..
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