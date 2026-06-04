# Decision Trees for 7-13 Plan Replication Topology

## Metadata

| Field | Value |
|-------|-------|
| ID | 7-13 |
| Title | Plan Replication Topology |
| Decision Type | Replication |

## Decision Inventory

- D1: Replica count determination
- D2: Topology layout (single-tier vs multi-tier)
- D3: Replica placement (same-AZ vs multi-AZ vs multi-region)

## Architecture-Level Decision Trees

### D1: Replica count determination

**Decision Context**: Determine how many replicas are needed based on requirements.

**Criteria**:
- Read traffic (peak QPS)
- High availability requirements
- Disaster recovery scope

**Tree**:
```
What is the primary requirement?
├── HA only (failover target) → 1 replica
├── HA + read scaling → 2 replicas
├── HA + read scaling + regional DR → 3 replicas
└── Heavy read scaling (QPS > 100k) → N replicas for N-1 read scaling
```

**Rationale**: Each replica adds ~5-10% CPU overhead on primary (binlog processing). Balance read scaling needs with primary overhead.

**Default**: 2 replicas — one for failover (HA), one for read scaling.

**Risks**: Too few replicas causes overload during traffic spikes. Too many replicas adds write overhead.

**Related Rules/Skills**: 7-13-1 (always place replicas in different AZs), 7-13-2 (never design topology without RPO/RTO targets)

---

### D2: Topology layout (single-tier vs multi-tier)

**Decision Context**: Design the replication hierarchy.

**Criteria**:
- Network topology
- Failover complexity tolerance
- Replica management overhead

**Tree**:
```
Is the application in a single region?
├── Yes → Single-tier topology (primary → N replicas)
│   Simple, all replicas equal
└── No (multi-region deployment)
    └── Multi-tier topology
        Primary → intermediate replicas (same region)
        → leaf replicas (other regions)
```

**Rationale**: Single-tier is simpler and has lower latency. Multi-tier reduces failover blast radius but adds latency.

**Default**: Single-tier topology within a region; multi-tier for cross-region with cascading replication.

**Risks**: Cascading replication adds latency at each hop. Leaf replicas may lag significantly behind primary.

**Related Rules/Skills**: 7-12 (multi-region replication)

---

### D3: Replica placement (same-AZ vs multi-AZ vs multi-region)

**Decision Context**: Decide where to place replicas physically.

**Criteria**:
- Availability requirements (RTO/RPO)
- Latency budgets
- Cost constraints

**Tree**:
```
What is the target availability?
├── 99.9% → Same-AZ replicas (cheapest, lower latency)
├── 99.99% → Multi-AZ (AZ-fault tolerant)
└── 99.999% → Multi-region (region-fault tolerant)
```

**Rationale**: Same-AZ has lowest latency (0.1-0.5ms RTT) but single point of failure (AZ outage). Multi-AZ protects against AZ failure. Multi-region protects against region failure.

**Default**: Multi-AZ placement for production workloads. Same-AZ for dev/staging.

**Risks**: All replicas in same AZ = entire database unavailable during AZ outage.

**Related Rules/Skills**: 7-13-1 (always place replicas in different AZs)

---
