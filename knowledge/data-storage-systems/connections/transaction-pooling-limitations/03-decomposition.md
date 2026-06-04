# Decomposition: 10.10 Transaction pooling limitations (prepared statements, session state, SET commands)

## Topic Overview
Transaction pooling (pgbouncer, ProxySQL) returns connections to the pool after each transaction. Since the next request may get a different connection, session-level state (prepared statements, SET SESSION, LISTEN/NOTIFY, session variables) is lost. Laravel's prepared statement usage requires `PDO::ATTR_EMULATE_PREPARES = true`.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-10-transaction-pooling-limitations/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.10 Transaction pooling limitations (prepared statements, session state, SET commands)
- **Purpose:** Transaction pooling (pgbouncer, ProxySQL) returns connections to the pool after each transaction. Since the next request may get a different connection, session-level state (prepared statements, SET SESSION, LISTEN/NOTIFY, session variables) is lost.
- **Difficulty:** Advanced
- **Dependencies:** 10.3 pgbouncer modes, 7.18 Transaction pooling

## Dependency Graph
**Depends on:** "10.3 pgbouncer modes", "7.18 Transaction pooling"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Lost prepared statements**: Laravel prepares statements by default. With transaction pooling, a prepared statement created in transaction 1 is not available in transaction 2 (different connection).; - **Emulate prepares**: `'options' => [PDO::ATTR_EMULATE_PREPARES => true]` — PHP emulates prepared statements by inlining parameters into queries. No server-side prepare. Works with transaction pooling.; - **SET session variables**: `SET timezone = 'UTC'` — lost after connection returns to pool. Set per-transaction or use connection initialization queries..
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