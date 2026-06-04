# Decomposition: 3.20 Concurrent index creation (PostgreSQL CONCURRENTLY, MySQL INPLACE)

## Topic Overview
Concurrent index creation prevents table locking during index builds. PostgreSQL uses `CREATE INDEX CONCURRENTLY`. MySQL uses `ALGORITHM=INPLACE LOCK=NONE`.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-20-concurrent-index-creation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.20 Concurrent index creation (PostgreSQL CONCURRENTLY, MySQL INPLACE)
- **Purpose:** Concurrent index creation prevents table locking during index builds. PostgreSQL uses `CREATE INDEX CONCURRENTLY`.
- **Difficulty:** Advanced
- **Dependencies:** 1.27 Online index creation, 3.19 Index maintenance, 13.5 Online DDL

## Dependency Graph
**Depends on:** "1.27 Online index creation", "3.19 Index maintenance", "13.5 Online DDL"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **PostgreSQL CONCURRENTLY**: Builds index in background without blocking writes. Takes 2-3x longer. Can't run inside a transaction.; - **MySQL ALGORITHM=INPLACE LOCK=NONE**: Rebuilds table in-place while allowing concurrent DML. Supports most index operations.; - **Tradeoff**: Both methods take longer than standard index creation but allow zero-downtime index addition..
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