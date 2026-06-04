# Decomposition: 9.13 Transaction length management (keeping transactions short)

## Topic Overview
Long transactions hold locks for extended duration, increasing deadlock probability and reducing concurrency. Rule: keep transactions as short as possible — acquire locks, do the minimal work, commit. Move pre-computation before BEGIN and post-processing after COMMIT.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-13-transaction-length-management/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.13 Transaction length management (keeping transactions short)
- **Purpose:** Long transactions hold locks for extended duration, increasing deadlock probability and reducing concurrency. Rule: keep transactions as short as possible — acquire locks, do the minimal work, commit.
- **Difficulty:** Intermediate
- **Dependencies:** 9.11 Transaction scoping, 9.19 Long-running transaction risks

## Dependency Graph
**Depends on:** "9.11 Transaction scoping", "9.19 Long-running transaction risks"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Lock duration**: Locks acquired at row-level lock statement (SELECT FOR UPDATE) or row modification (UPDATE/DELETE). Released at COMMIT/ROLLBACK.; - **Transaction length = lock holding time**: Longer transaction = more contention. One slow operation in a transaction blocks others.; - **Non-database operations in transaction**: HTTP calls, file I/O, external API calls inside a transaction — lock held during network latency..
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