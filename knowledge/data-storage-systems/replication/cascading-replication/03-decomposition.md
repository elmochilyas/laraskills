# Decomposition: 7.12 Cascading replication (replica → replica chain)

## Topic Overview
Cascading replication: a replica replicates from another replica (not directly from the primary). Reduces load on the primary (fewer direct replica connections). Used for multi-region: region-A replica → region-B replica → region-C replica.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-12-cascading-replication/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.12 Cascading replication (replica → replica chain)
- **Purpose:** Cascading replication: a replica replicates from another replica (not directly from the primary). Reduces load on the primary (fewer direct replica connections).
- **Difficulty:** Advanced
- **Dependencies:** 7.1 Master-replica topology, 7.10 Multi-region replication

## Dependency Graph
**Depends on:** "7.1 Master-replica topology", "7.10 Multi-region replication"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Chained topology**: Primary → Replica A → Replica B → Replica C. A replicates from primary. B replicates from A. C replicates from B.; - **Lag accumulation**: Each hop adds network RTT + apply time. 3-hop chain: 3x the lag of a direct replica.; - **Primary load reduction**: Primary handles only one replica connection instead of many. Reduces binlog dump overhead..
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