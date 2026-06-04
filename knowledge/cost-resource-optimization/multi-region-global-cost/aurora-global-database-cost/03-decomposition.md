# Decomposition: Aurora Global Database Cost

## Topic Overview
Aurora Global Database provides storage-level replication across AWS regions, enabling low-latency reads and disaster recovery. Costs include: compute in each region, storage replication ($0.20/M replicated write I/Os), and cross-region data transfer. Active-passive setups (compute only in primary, serverless readers in secondary) minimize cost.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k52-aurora-global-database-cost/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Aurora Global Database Cost
- **Purpose:** Aurora Global Database provides storage-level replication across AWS regions, enabling low-latency reads and disaster recovery.
- **Difficulty:** Intermediate
- **Dependencies:** K51: Cross-Region Data Transfer, K53: Active-Passive Multi-Region, K54: Route 53 Routing Costs

## Dependency Graph
**Depends on:**
- K51: Cross-Region Data Transfer
- K53: Active-Passive Multi-Region
- K54: Route 53 Routing Costs

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Replication cost
- Secondary compute
- Storage
- Data transfer
- Headless DR
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K51: Cross-Region Data Transfer, K53: Active-Passive Multi-Region, K54: Route 53 Routing Costs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization