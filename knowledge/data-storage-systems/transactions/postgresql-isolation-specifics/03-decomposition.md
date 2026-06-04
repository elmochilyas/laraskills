# Decomposition: 9.3 PostgreSQL isolation specifics (SSI, SERIALIZABLE snapshot isolation, REPEATABLE READ snapshot)

## Topic Overview
PostgreSQL implements SERIALIZABLE via Serializable Snapshot Isolation (SSI) — optimistic, detects conflicts via predicate locking. REPEATABLE READ uses snapshot isolation (SI) — read-only, no locks, detects conflicts on first write. READ COMMITTED also uses snapshots per statement.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-3-postgresql-isolation-specifics/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.3 PostgreSQL isolation specifics (SSI, SERIALIZABLE snapshot isolation, REPEATABLE READ snapshot)
- **Purpose:** PostgreSQL implements SERIALIZABLE via Serializable Snapshot Isolation (SSI) — optimistic, detects conflicts via predicate locking. REPEATABLE READ uses snapshot isolation (SI) — read-only, no locks, detects conflicts on first write.
- **Difficulty:** Advanced
- **Dependencies:** 9.2 Isolation levels, 9.17 Serializable snapshot isolation

## Dependency Graph
**Depends on:** "9.2 Isolation levels", "9.17 Serializable snapshot isolation"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **SSI (SERIALIZABLE)**: PostgreSQL v9.1+. Uses SIREAD locks (predicate-based) to detect serialization anomalies. Retry on serialization failure: `40001`.; - **Snapshot isolation (REPEATABLE READ)**: Transaction sees a snapshot of data at start. Modifications from other transactions are invisible. Write-write conflicts cause abort on first write.; - **No phantom reads in REPEATABLE READ**: PostgreSQL's snapshot isolation prevents phantoms (unlike MySQL, which prevents phantoms only in InnoDB REPEATABLE READ via next-key locks)..
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