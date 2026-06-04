# Decomposition: 9.2 Isolation levels (READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE)

## Topic Overview
Four SQL standard isolation levels control what concurrent transactions can see. READ UNCOMMITTED (dirty reads). READ COMMITTED (no dirty reads — PostgreSQL default).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
9-2-isolation-levels/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 9.2 Isolation levels (READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE)
- **Purpose:** Four SQL standard isolation levels control what concurrent transactions can see. READ UNCOMMITTED (dirty reads).
- **Difficulty:** Intermediate
- **Dependencies:** 9.3 PostgreSQL isolation specifics, 9.4 MySQL InnoDB specifics

## Dependency Graph
**Depends on:** "9.3 PostgreSQL isolation specifics", "9.4 MySQL InnoDB specifics"

**Depended on by:** More advanced KUs in Transaction Management & Concurrency and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Dirty read**: Read uncommitted data from another transaction. Only READ UNCOMMITTED allows this.; - **Non-repeatable read**: Read the same row twice in a transaction; another transaction modified it between reads. READ COMMITTED allows this.; - **Phantom read**: A query returns different rows on re-execution (new rows inserted by another transaction). REPEATABLE READ in PostgreSQL prevents this via snapshot isolation.; - **Serialization anomaly**: Two concurrent transactions produce results that couldn't happen in any serial order. Only SERIALIZABLE prevents this..
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