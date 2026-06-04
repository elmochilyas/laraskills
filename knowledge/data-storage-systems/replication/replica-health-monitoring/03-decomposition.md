# Decomposition: 7.21 Replica health monitoring (connection failures, stale data)

## Topic Overview
Replica health monitoring tracks: connection availability (can the app connect to the replica?), replication status (is the IO and SQL thread running?), data freshness (is lag within threshold?). Unhealthy replicas must be removed from the read pool to prevent serving errors or stale data.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-21-replica-health-monitoring/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.21 Replica health monitoring (connection failures, stale data)
- **Purpose:** Replica health monitoring tracks: connection availability (can the app connect to the replica?), replication status (is the IO and SQL thread running?), data freshness (is lag within threshold?). Unhealthy replicas must be removed from the read pool to prevent serving errors or stale data.
- **Difficulty:** Advanced
- **Dependencies:** 7.6 Replica lag monitoring, 7.11 Failover, 7.17 ProxySQL routing

## Dependency Graph
**Depends on:** "7.6 Replica lag monitoring", "7.11 Failover", "7.17 ProxySQL routing"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Connection health**: Periodic connection test `SELECT 1`. If fails, mark replica as offline. Remove from read pool.; - **Replication thread status**: MySQL `SHOW REPLICA STATUS` → `Slave_IO_Running: Yes`, `Slave_SQL_Running: Yes`. If either is No, replication has stopped.; - **Data freshness**: `Seconds_Behind_Master` or `pt-heartbeat` lag. If > threshold (e.g., 60s), route reads to primary..
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