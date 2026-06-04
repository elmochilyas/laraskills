# Decision Trees for 7-12 Multi-Region Replication

## Metadata

| Field | Value |
|-------|-------|
| ID | 7-12 |
| Title | Multi-Region Replication |
| Decision Type | Replication |

## Decision Inventory

- D1: Multi-region topology (active-passive vs active-active)
- D2: Cross-region replication mode (async vs sync)
- D3: Read routing to nearest region

## Architecture-Level Decision Trees

### D1: Multi-region topology (active-passive vs active-active)

**Decision Context**: Design the multi-region replication topology.

**Criteria**:
- Write volume per region
- Consistency requirements
- Budget for cross-region infrastructure

**Tree**:
```
Does each region need to accept writes?
├── Yes → Active-active (multi-master across regions)
│   - Each region writes locally
│   - Async replication to other regions
│   - Must handle conflicts
└── No → Active-passive (primary + replica regions)
    - Single primary region for writes
    - Replica regions for reads
    - Simpler, no conflicts
```

**Rationale**: Active-active provides local writes but adds conflict complexity. Active-passive is simpler but requires all writes to route to the primary region.

**Default**: Active-passive for most applications; active-active only when cross-region write latency is unacceptable.

**Risks**: Active-active requires thorough conflict resolution testing. Cross-region sync replication has unacceptable write latency.

**Related Rules/Skills**: 7-12-1 (always monitor cross-region replication lag)

---

### D2: Cross-region replication mode (async vs sync)

**Decision Context**: Choose asynchronous or synchronous replication for cross-region data transfer.

**Criteria**:
- Cross-region latency
- Data loss tolerance
- Write performance requirements

**Tree**:
```
Is cross-region RTT > 10ms?
├── Yes (typical cross-region: 50-200ms)
│   └── Async replication only
│       (sync would add RTT to every write)
└── No (same region, different AZs: 1-5ms)
    └── Semi-sync replication (RPO=0 within AZ)
```

**Rationale**: Synchronous replication latency = cross-region RTT. For 100ms RTT, every write takes at least 100ms. Asynchronous replication has zero write latency impact.

**Default**: Asynchronous for cross-region; semi-synchronous for cross-AZ within same region.

**Risks**: Asynchronous replication can lose up to seconds of data on primary failure.

**Related Rules/Skills**: 7-12-1 (always monitor cross-region replication lag), 7-10 (multi-master)

---

### D3: Read routing to nearest region

**Decision Context**: Route read queries to the geographically nearest replica.

**Criteria**:
- Geo-distribution of users
- Read latency requirements
- DNS/routing infrastructure

**Tree**:
```
Are users geographically distributed?
├── Yes
│   └── Geo-DNS or latency-based routing
│       Route reads to nearest replica region
│       Accept eventual consistency
└── No (single-region user base)
    └── No multi-region read routing needed
```

**Rationale**: Geo-routing reduces read latency by serving from the closest region. DNS-based routing is simplest; latency-based routing is more accurate.

**Default**: Geo-DNS routing with health checks per region.

**Risks**: Cross-region eventual consistency means users may see stale data after writes to a different region.

**Related Rules/Skills**: 7-12-2 (never replicate to geographically restricted regions)

---
