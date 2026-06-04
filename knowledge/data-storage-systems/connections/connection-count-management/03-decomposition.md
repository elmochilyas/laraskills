# Decomposition: 10.7 Connection count management (max_connections, pool sizing, avoiding connection storms)

## Topic Overview
Database `max_connections` limits concurrent connections. Pool sizing: total pool ≤ max_connections - admin connections. Connection storms: traffic spike → many workers open connections simultaneously → max_connections exceeded → errors.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-7-connection-count-management/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.7 Connection count management (max_connections, pool sizing, avoiding connection storms)
- **Purpose:** Database `max_connections` limits concurrent connections. Pool sizing: total pool ≤ max_connections - admin connections.
- **Difficulty:** Intermediate
- **Dependencies:** 10.2 Pool architecture, 10.8 Connection tags observability

## Dependency Graph
**Depends on:** "10.2 Pool architecture", "10.8 Connection tags observability"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **max_connections**: MySQL default 151. PostgreSQL default 100. Configurable. Each connection uses ~2-10MB RAM. 500 connections = 1-5GB RAM.; - **Pool sizing formula**: Pool = (PHP-FPM workers × connections per worker) / multiplexing ratio. With pgbouncer transaction mode: 50 connections may serve 300 workers.; - **Connection storm**: New deployment or restart: 200 workers all connect simultaneously. Database sees 200 new connections in 1 second. Can overwhelm connection handler..
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