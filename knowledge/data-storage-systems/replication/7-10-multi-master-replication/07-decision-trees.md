# Decision Trees for 7-10 Multi-Master Replication

## Metadata

| Field | Value |
|-------|-------|
| ID | 7-10 |
| Title | Multi-Master Replication |
| Decision Type | Replication |

## Decision Inventory

- D1: Multi-master technology selection
- D2: Synchronous vs asynchronous tradeoff
- D3: Schema change strategy in multi-master

## Architecture-Level Decision Trees

### D1: Multi-master technology selection

**Decision Context**: Choose multi-master implementation based on database and requirements.

**Criteria**:
- Consistency requirements
- Conflict tolerance
- Write latency budget

**Tree**:
```
Which database?
├── MySQL
│   ├── Need strong consistency? → Group Replication (multi-primary)
│   └── Need high throughput? → Tungsten (async, JDBC proxy)
├── MariaDB → Galera Cluster (sync, FCC)
└── PostgreSQL → BDR (async, conflict resolution)
```

**Rationale**: Galera provides synchronous replication with automatic conflict detection. Group Replication uses consensus protocol. BDR is asynchronous with configurable conflict resolution.

**Default**: Galera for MySQL/MariaDB (mature, proven); Group Replication for MySQL 8.0+; BDR for PostgreSQL.

**Risks**: All multi-master solutions add write latency proportional to the slowest node.

**Related Rules/Skills**: 7-10-1 (always test conflict resolution before production), 7-11 (conflict resolution)

---

### D2: Synchronous vs asynchronous tradeoff

**Decision Context**: Choose between synchronous and asynchronous multi-master replication.

**Criteria**:
- Write latency tolerance
- Data loss tolerance
- Geographic distribution

**Tree**:
```
Are all nodes in the same region/datacenter?
├── Yes → Synchronous replication is viable
│   (1-5ms additional latency)
└── No → Asynchronous preferred
    (cross-region sync latency = RTT, unacceptable for most)
```

**Rationale**: Synchronous replication provides strong consistency but write latency = max(all node latencies). Cross-region synchronous replication adds 50-200ms to every write.

**Default**: Synchronous for same-region; asynchronous for cross-region.

**Risks**: Asynchronous replication introduces conflict windows. Synchronous replication reduces write throughput.

**Related Rules/Skills**: 7-10-2 (never assume all nodes are consistent at all times)

---

### D3: Schema change strategy in multi-master

**Decision Context**: Apply schema changes in a multi-master topology without downtime.

**Criteria**:
- DDL locking behavior
- Online DDL support
- Change urgency

**Tree**:
```
Does the technology support online DDL?
├── Galera → DDL locks all nodes. Use rolling schema upgrade
├── Group Replication → Online DDL possible with mysql-shell
└── BDR → Per-node DDL, apply to each node sequentially
```

**Rationale**: Galera's synchronous nature requires careful DDL coordination. Online schema change tools (gh-ost, pt-osc) help but may conflict with the replication protocol.

**Default**: Rolling schema upgrade for Galera; online DDL for Group Replication; sequential per-node for BDR.

**Risks**: DDL on multi-master can cause cluster-wide locking if not handled correctly.

**Related Rules/Skills**: 1-24 (online index creation), 1-18 (zero-downtime schema change patterns)

---
