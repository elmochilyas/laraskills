# Decomposition: 7.10 Multi-region replication (cross-region replicas, latency considerations)

## Topic Overview
Multi-region replication maintains replicas in different geographic regions for read latency optimization and disaster recovery. Cross-region latency (50-200ms) causes higher replication lag. Async replication is standard — the primary doesn't wait for cross-region replicas.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-10-multi-region-replication/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.10 Multi-region replication (cross-region replicas, latency considerations)
- **Purpose:** Multi-region replication maintains replicas in different geographic regions for read latency optimization and disaster recovery. Cross-region latency (50-200ms) causes higher replication lag.
- **Difficulty:** Advanced
- **Dependencies:** 7.5 Replica lag, 7.11 Failover, 5.23 Multi-region tenant placement

## Dependency Graph
**Depends on:** "7.5 Replica lag", "7.11 Failover", "5.23 Multi-region tenant placement"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Cross-region latency**: Physical distance adds propagation delay. US-West to US-East: ~40ms. US to Europe: ~100ms. US to Asia: ~150-200ms.; - **Replication lag across regions**: Lag = network round-trip + apply time. Typically 1-5 seconds for cross-region async replication.; - **DR (disaster recovery)**: Cross-region replica serves as failover target if primary region goes down..
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