# Decomposition: 7.13 Synchronous replication (Galera, Group Replication, quorum)

## Topic Overview
Synchronous replication: all nodes must acknowledge a write before it commits. Galera Cluster (MariaDB/Percona XtraDB Cluster) and MySQL Group Replication implement this. Provides strong consistency and zero data loss.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-13-synchronous-replication/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.13 Synchronous replication (Galera, Group Replication, quorum)
- **Purpose:** Synchronous replication: all nodes must acknowledge a write before it commits. Galera Cluster (MariaDB/Percona XtraDB Cluster) and MySQL Group Replication implement this.
- **Difficulty:** Advanced
- **Dependencies:** 7.1 Master-replica topology, 7.11 Failover

## Dependency Graph
**Depends on:** "7.1 Master-replica topology", "7.11 Failover"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Certification-based replication**: All nodes receive the write, certify it (check for conflicts), commit simultaneously. If certification fails on any node, the write is rolled back.; - **Quorum**: Cluster requires > N/2 nodes to accept writes. 3-node cluster: tolerate 1 failure. 5-node: tolerate 2 failures. Split-brain prevention.; - **Write latency**: = max(node_ack_latency). In a 3-node cluster spanning 2 regions, write latency = cross-region round trip..
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