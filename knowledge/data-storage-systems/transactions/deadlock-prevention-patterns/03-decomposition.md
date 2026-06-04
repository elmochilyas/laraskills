# Decomposition: 9.9 Deadlock prevention patterns (consistent lock ordering, index-based locking, shorter transactions)

## Topic Overview
Deadlock prevention strategies: consistent lock ordering (always lock table A before B), use indexes to narrow lock ranges (without index, entire table may be locked), keep transactions short, and avoid user interaction within transactions. Prevention is better than detection — retries add latency and complexity.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-9-deadlock-prevention-patterns/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.9 Deadlock prevention patterns (consistent lock ordering, index-based locking, shorter transactions)
- **Purpose:** Deadlock prevention strategies: consistent lock ordering (always lock table A before B), use indexes to narrow lock ranges (without index, entire table may be locked), keep transactions short, and avoid user interaction within transactions. Prevention is better than detection — retries add latency and complexity.
- **Difficulty:** Advanced
- **Dependencies:** 9.5 Row-level locks, 9.8 Deadlock detection

## Dependency Graph
**Depends on:** "9.5 Row-level locks", "9.8 Deadlock detection"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Consistent ordering**: If Transaction 1 locks user then order, Transaction 2 must also lock user then order. Prevents cyclic lock waits.; - **Index-based locking**: `UPDATE orders SET status = ? WHERE user_id = ? AND created_at < ?` with index on `(user_id, created_at)` locks specific rows. Without index, locks all examined rows (gap locks).; - **Short transactions**: Minimize time between first lock and COMMIT. Do all computation before starting the transaction..
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