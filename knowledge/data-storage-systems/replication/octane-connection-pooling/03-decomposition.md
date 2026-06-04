# Decomposition: 7.14 Octane connection pool for read replicas (persistent connections)

## Topic Overview
Laravel Octane maintains persistent database connections across requests. Read replica connections in Octane benefit from connection pooling: fewer `connect()` calls, lower per-request latency, controlled connection count. Octane's `PDOConnectionPool` manages configurable min/max connections per replica per worker.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-14-octane-connection-pooling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.14 Octane connection pool for read replicas (persistent connections)
- **Purpose:** Laravel Octane maintains persistent database connections across requests. Read replica connections in Octane benefit from connection pooling: fewer `connect()` calls, lower per-request latency, controlled connection count.
- **Difficulty:** Advanced
- **Dependencies:** 7.8 Connection pooling replicas, 9.9 Octane connection configuration

## Dependency Graph
**Depends on:** "7.8 Connection pooling replicas", "9.9 Octane connection configuration"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Persistent connections**: Octane worker starts, connects to replicas, keeps connections alive across requests. No connect/disconnect per request.; - **PDOConnectionPool**: Octane 2.x+ includes connection pooling. Pool size per replica: `'pool' => ['min' => 2, 'max' => 10]`.; - **Connection reuse**: Worker holds connections to replicas. If PHP-FPM: connect per request. Octane: connect once per worker lifetime..
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