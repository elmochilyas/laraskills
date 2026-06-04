# Decomposition: 7.11 Replica promotion and failover (manual vs. automated)

## Topic Overview
Failover promotes a replica to primary when the current primary fails. Manual: ops team runs `ALTER TABLE ...`, updates DNS, Laravel config. Automated: orchestrator (Orchestrator, RDS Multi-AZ, Patroni) handles promotion, VIP reassignment, and app routing update.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-11-replica-promotion-failover/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.11 Replica promotion and failover (manual vs. automated)
- **Purpose:** Failover promotes a replica to primary when the current primary fails. Manual: ops team runs `ALTER TABLE ...`, updates DNS, Laravel config.
- **Difficulty:** Advanced
- **Dependencies:** 7.1 Master-replica topology, 7.5 Replica lag, 7.12 Cascading replication

## Dependency Graph
**Depends on:** "7.1 Master-replica topology", "7.5 Replica lag", "7.12 Cascading replication"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Manual failover**: Ops identifies failure, promotes replica (`SET GLOBAL read_only = OFF`), updates application config/connections, restarts workers. RTO: 5-30 minutes.; - **Automated failover**: Orchestrator detects primary failure, promotes the most advanced replica, reassigns VIP. RTO: 10-60 seconds.; - **RPO**: Data loss during failover. Async: up to N seconds of writes. Semi-sync: zero data loss..
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