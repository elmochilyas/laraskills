# Decision Trees for 7-20 Peer-to-Peer Replication

## Metadata

| Field | Value |
|-------|-------|
| ID | 7-20 |
| Title | Peer-to-Peer Replication |
| Decision Type | Replication |

## Decision Inventory

- D1: P2P technology selection
- D2: Node count and quorum design
- D3: Auto-increment configuration for multi-master writes

## Architecture-Level Decision Trees

### D1: P2P technology selection

**Decision Context**: Choose peer-to-peer replication technology based on requirements.

**Criteria**:
- Database type
- Consistency requirements
- Write topology

**Tree**:
```
Which database?
├── MySQL
│   ├── Synchronous P2P → Galera Cluster or Group Replication (multi-primary)
│   └── Asynchronous P2P → Tungsten (JDBC proxy)
├── MariaDB → Galera Cluster (synchronous P2P, FCC)
└── PostgreSQL → BDR (async, multi-master with conflict resolution)
```

**Rationale**: Galera provides synchronous replication with automatic conflict detection. Group Replication uses consensus (Paxos). BDR is asynchronous with configurable conflict resolution.

**Default**: Galera for MySQL/MariaDB synchronous P2P; BDR for PostgreSQL.

**Risks**: P2P write latency is determined by the slowest/quorum nodes. All nodes must process all writes.

**Related Rules/Skills**: 7-20-1 (always use odd number of nodes for quorum), 7-20-2 (never ignore flow control warnings)

---

### D2: Node count and quorum design

**Decision Context**: Determine the number of P2P nodes for quorum-based operation.

**Criteria**:
- Failure tolerance
- Write throughput requirements
- Infrastructure budget

**Tree**:
```
How many node failures must be tolerated?
├── 1 failure → 3 nodes (quorum = 2)
├── 2 failures → 5 nodes (quorum = 3)
└── 3 failures → 7 nodes (quorum = 4)
```

**Rationale**: P2P systems require majority quorum (N/2 + 1) for writes. Odd numbers prevent split-brain where both sides have equal votes.

**Default**: 3 nodes for most deployments (tolerates 1 failure).

**Risks**: Even-numbered clusters (4 nodes) can split 2-2 during network partition, both sides unable to write.

**Related Rules/Skills**: 7-20-1 (always use odd number of nodes for quorum)

---

### D3: Auto-increment configuration for multi-master writes

**Decision Context**: Configure auto-increment to prevent ID collisions across P2P nodes.

**Criteria**:
- Number of write nodes
- Auto-increment column type
- Application ID generation

**Tree**:
```
Is the application using auto-increment IDs?
├── Yes
│   └── Configure per-node increments:
│       SET auto_increment_increment = N (number of nodes)
│       SET auto_increment_offset = node_id (1, 2, 3...)
└── No (using UUIDs or application-generated IDs)
    → No auto-increment configuration needed
```

**Rationale**: Without configuration, two nodes can generate the same auto-increment ID. The increment/offset pattern ensures unique IDs per node.

**Default**: `auto_increment_increment = N`, `auto_increment_offset = unique_node_id`.

**Risks**: Node count changes (adding/removing nodes) requires careful auto-increment reconfiguration.

**Related Rules/Skills**: 7-20-1 (always use odd number of nodes for quorum), 7-10-1 (always test conflict resolution)

---
