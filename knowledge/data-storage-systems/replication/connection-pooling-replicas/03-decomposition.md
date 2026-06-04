# Decomposition: 7.8 Connection pooling for replicas (max connections per replica)

## Topic Overview
Each PHP-FPM worker or Octane request holds a connection to a read replica. With N workers × M replicas, connection count adds up. Connection pooling (via ProxySQL, pgbouncer, or Octane's connection pool) limits concurrent connections to replicas, preventing replica overload during traffic spikes.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-8-connection-pooling-replicas/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.8 Connection pooling for replicas (max connections per replica)
- **Purpose:** Each PHP-FPM worker or Octane request holds a connection to a read replica. With N workers × M replicas, connection count adds up.
- **Difficulty:** Advanced
- **Dependencies:** 7.9 Load balancing replicas, 10.4 Connection pooling

## Dependency Graph
**Depends on:** "7.9 Load balancing replicas", "10.4 Connection pooling"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Per-worker connection**: 50 PHP-FPM workers × 3 replicas = up to 150 connections to replica pool. Each replica handles 50 concurrent connections.; - **Connection pool limit**: Max connections per replica (MySQL: `max_connections`, PostgreSQL: `max_connections`). Pool shares limited connections across many workers.; - **Queue wait**: When all pool connections are busy, requests queue. Queue timeout: return error or fall back to primary..
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