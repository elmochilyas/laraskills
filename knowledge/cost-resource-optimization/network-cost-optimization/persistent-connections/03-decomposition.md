# Decomposition: Persistent Connections

## Topic Overview
Persistent database connections reuse a single connection across multiple requests, avoiding TCP handshake and MySQL/PostgreSQL auth overhead on every request. With PHP-FPM, connections are persistent per-worker (worker lives for multiple requests). With Octane, connections persist across all requests in a worker's lifecycle. Persistent connections reduce database CPU usage (fewer auth cycles) and improve response times, but require careful connection management to prevent stale connection issues.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-persistent-connections/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Persistent Connections
- **Purpose:** Persistent database connections reuse a single connection across multiple requests, avoiding TCP handshake and MySQL/PostgreSQL auth overhead on every request. With PHP-FPM, connections are persistent per-worker (worker lives for multiple requests). With Octane, connections persist across all requests in a worker's lifecycle. Persistent connections reduce database CPU usage (fewer auth cycles) and improve response times, but require careful connection management to prevent stale connection issues.
- **Difficulty:** Foundation
- **Dependencies:** - Connection Pool Sizing (ku-01), - Region Data Affinity (ku-03), - Database Connection Pool (ku-09 in compute-optimization), - RDS Proxy vs PgBouncer

## Dependency Graph
**Depends on:**
- Connection Pool Sizing (ku-01)
- Region Data Affinity (ku-03)
- Database Connection Pool (ku-09 in compute-optimization)
- RDS Proxy vs PgBouncer

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- PHP-FPM: Enable persistent connections when request volume > 100 req/s per worker pool
- Octane: Connections are persistent by default (no extra configuration needed)
- High-latency connections: Cross-AZ database connections benefit more from persistence (saving 5-15ms per request)
- SSL connections: SSL handshake overhead (2 RTT) is avoided with persistence
- Queue workers: Workers process many jobs sequentially; persistence saves auth overhead per job
**Out of scope:**
- PHP-FPM with low max_requests: If max_requests = 100, persistence benefit is limited (worker restarts frequently)
- Connection pooler in front: RDS Proxy/PgBouncer already multiplexes connections; per-worker persistence doesn't help
- PHP-FPM with low traffic: <10 req/s per worker; connection overhead isn't significant
- Apps with frequent database server changes: Blue/green deployment or failover causes stale connections
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization