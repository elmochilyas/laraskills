# Decomposition: 9.16 Phantom reads vs. non-repeatable reads

## Topic Overview
Non-repeatable read: same row, different value on re-read (another transaction updated it). Phantom read: same query, different set of rows on re-read (another transaction inserted/deleted rows). REPEATABLE READ prevents non-repeatable reads but may allow phantoms (depends on implementation).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-16-phantom-reads-vs-non-repeatable/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.16 Phantom reads vs. non-repeatable reads
- **Purpose:** Non-repeatable read: same row, different value on re-read (another transaction updated it). Phantom read: same query, different set of rows on re-read (another transaction inserted/deleted rows).
- **Difficulty:** Advanced
- **Dependencies:** 9.2 Isolation levels, 9.17 SSI, 9.18 Write skew

## Dependency Graph
**Depends on:** "9.2 Isolation levels", "9.17 SSI", "9.18 Write skew"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Non-repeatable read**: T1 reads balance = 100. T2 updates balance to 200, commits. T1 reads balance again → 200. Same row, different value.; - **Phantom read**: T1: `SELECT COUNT(*) FROM orders WHERE status = 'pending'` → 5. T2 inserts a pending order, commits. T1 re-executes → 6. Different row count.; - **Prevention per DB**: PostgreSQL REPEATABLE READ prevents both via snapshot isolation. MySQL REPEATABLE READ prevents non-repeatable via MVCC, prevents phantoms in SELECT ... FOR UPDATE via next-key locks..
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