# Decomposition: 7.18 PgBouncer modes (session, transaction, statement)

## Topic Overview
PgBouncer is a PostgreSQL connection pooler. Three modes: session (connection held for entire session — least efficient), transaction (connection returned to pool after transaction ends — recommended), statement (connection returned after each statement — fastest but limited by SET requirements). Transaction pooling is the standard for web applications.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-18-pgbouncer-modes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.18 PgBouncer modes (session, transaction, statement)
- **Purpose:** PgBouncer is a PostgreSQL connection pooler. Three modes: session (connection held for entire session — least efficient), transaction (connection returned to pool after transaction ends — recommended), statement (connection returned after each statement — fastest but limited by SET requirements).
- **Difficulty:** Advanced
- **Dependencies:** 10.3 PgBouncer, 10.4 Connection pooling

## Dependency Graph
**Depends on:** "10.3 PgBouncer", "10.4 Connection pooling"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Session pooling**: Client holds connection until disconnect. Same as persistent connections. Max connections = pool size.; - **Transaction pooling**: Client gets a connection for one transaction. Connection returned to pool on COMMIT/ROLLBACK. Efficient. Doesn't support session-level features (SET SESSION, LISTEN/NOTIFY, prepared statements).; - **Statement pooling**: Connection returned after each statement. Rarely used..
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