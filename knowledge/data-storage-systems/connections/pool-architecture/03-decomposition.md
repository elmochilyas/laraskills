# Decomposition: 10.2 Pool architecture (client-side vs server-side, ProxySQL, pgBouncer, RDS Proxy)

## Topic Overview
Client-side pooling: the application (Octane connection pool) manages connections. Server-side pooling: a proxy (ProxySQL, pgbouncer, RDS Proxy) sits between app and database, managing connections. Server-side pools share a fixed set of backend connections across many client connections.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-2-pool-architecture/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.2 Pool architecture (client-side vs server-side, ProxySQL, pgBouncer, RDS Proxy)
- **Purpose:** Client-side pooling: the application (Octane connection pool) manages connections. Server-side pooling: a proxy (ProxySQL, pgbouncer, RDS Proxy) sits between app and database, managing connections.
- **Difficulty:** Intermediate
- **Dependencies:** 10.3 pgbouncer, 10.4 Octane connections, 10.9 Read/write separation

## Dependency Graph
**Depends on:** "10.3 pgbouncer", "10.4 Octane connections", "10.9 Read/write separation"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Client-side pool**: Octane's `PDOConnectionPool`. Pool lives in worker memory. Simple, no extra infrastructure. Requires Octane.; - **Server-side pool**: ProxySQL/pgbouncer. One proxy handles connections from many workers. Proxy manages backend connections. Works with any runtime (PHP-FPM, Octane, Swoole).; - **Multiplexing**: A server-side pool with 50 backend connections can serve 500 client connections by transaction multiplexing (pgbouncer transaction mode)..
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