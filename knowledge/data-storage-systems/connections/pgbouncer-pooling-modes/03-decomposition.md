# Decomposition: 10.3 PgBouncer pooling modes (session, transaction, statement)

## Topic Overview
PgBouncer has three pooling modes. Transaction mode (recommended for Laravel): client gets a connection for one transaction, then returns it to pool. Session mode: client holds connection for entire session duration (less efficient).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-3-pgbouncer-pooling-modes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.3 PgBouncer pooling modes (session, transaction, statement)
- **Purpose:** PgBouncer has three pooling modes. Transaction mode (recommended for Laravel): client gets a connection for one transaction, then returns it to pool.
- **Difficulty:** Advanced
- **Dependencies:** 7.18 pgbouncer modes, 10.2 Pool architecture

## Dependency Graph
**Depends on:** "7.18 pgbouncer modes", "10.2 Pool architecture"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Session pooling**: Connection is assigned to a client until the client disconnects. Pool utilization = active clients / pool size. Inefficient for web apps.; - **Transaction pooling**: Connection assigned for duration of one transaction. After COMMIT/ROLLBACK, connection returns to pool. Next client may get a different connection. No session state (prepared statements, SET SESSION) persists.; - **Statement pooling**: Connection assigned per statement. Even less state persistence..
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