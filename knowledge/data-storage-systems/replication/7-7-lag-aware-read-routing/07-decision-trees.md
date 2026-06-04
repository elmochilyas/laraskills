# Decision Trees for 7-7 Lag-Aware Read Routing

## Metadata

| Field | Value |
|-------|-------|
| ID | 7-7 |
| Title | Lag-Aware Read Routing |
| Decision Type | Replication |

## Decision Inventory

- D1: Lag threshold per query type
- D2: Lag check frequency strategy
- D3: Fallback behavior on high lag

## Architecture-Level Decision Trees

### D1: Lag threshold per query type

**Decision Context**: Set per-query-type lag thresholds for read routing.

**Criteria**:
- Data freshness requirements
- User-facing vs batch processing
- Performance budget

**Tree**:
```
What type of data does the query access?
├── User-facing (profile, orders) → 1-2 seconds threshold
├── Reporting/analytics → 30-60 seconds threshold
├── Admin dashboard → 0-1 seconds threshold
└── Session/authentication → Always primary (0 lag tolerance)
```

**Rationale**: Different content types have different staleness tolerance. User-facing dashboards need fresh data; historical reports can tolerate minutes of lag.

**Default**: 1 second for user-facing, 30 seconds for reporting, 0 for auth/session reads.

**Risks**: Threshold too low defeats read scaling (all reads go to primary). Threshold too high serves stale data.

**Related Rules/Skills**: 7-7-1 (always check lag before reading from replica), 7-7-2 (never route time-sensitive reads to lagging replicas)

---

### D2: Lag check frequency strategy

**Decision Context**: Decide how often to check replica lag before routing reads.

**Criteria**:
- Read volume
- Lag check overhead
- Staleness tolerance

**Tree**:
```
Is read volume high (> 1000 reads/second)?
├── Yes → Cache lag value (10-100ms stale)
│   Reduces per-read overhead
└── No → Check lag on each read
    Acceptable overhead for low read volume
```

**Rationale**: Every lag check adds ~1ms to read latency. Caching the lag value reduces overhead but may serve slightly stale lag data.

**Default**: Cache lag value for 100ms on high-traffic systems; fresh check per read on low-traffic.

**Risks**: Cached lag value may be stale, causing reads to route to a replica that has since fallen behind.

**Related Rules/Skills**: 7-7-1 (always check lag before reading from replica)

---

### D3: Fallback behavior on high lag

**Decision Context**: Decide what happens when all replicas exceed the lag threshold.

**Criteria**:
- Availability requirements
- Read scaling goals
- Application error tolerance

**Tree**:
```
Is it acceptable to read from primary?
├── Yes → Fallback to primary
│   (reads still served, but replica scale benefit lost)
└── No → Error or serve stale data with warning
    (acceptable for read-only analytics tools)
```

**Rationale**: Falling back to primary preserves availability but adds load to the primary database. For most apps, this is the right choice.

**Default**: Fallback to primary when all replicas exceed threshold.

**Risks**: During prolonged lag events, primary may become overloaded by both writes and reads.

**Related Rules/Skills**: 7-7-2 (never route time-sensitive reads to lagging replicas)

---
