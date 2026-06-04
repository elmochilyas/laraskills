# Decision Trees for 7-18 Replication Throttling

## Metadata

| Field | Value |
|-------|-------|
| ID | 7-18 |
| Title | Replication Throttling |
| Decision Type | Replication |

## Decision Inventory

- D1: Throttle method selection
- D2: Flow control configuration (Group Replication)
- D3: Application-level backpressure implementation

## Architecture-Level Decision Trees

### D1: Throttle method selection

**Decision Context**: Choose how to limit replication apply rate on overloaded replicas.

**Criteria**:
- Bottleneck type (CPU, IO, network)
- Database type
- Throttling precision requirements

**Tree**:
```
What is the bottleneck on the replica?
├── CPU (replica apply thread CPU-bound)
│   └── Reduce write rate on primary (application backpressure)
├── IO (replica IO-bound)
│   └── Consider replica upgrade (throttling rarely helps)
└── Network (replica serving reads + applying writes)
    └── Separate read replica from write apply replica
```

**Rationale**: True replication throttling is limited in standard MySQL/PostgreSQL. pt-slave-delay provides intentional delay but doesn't reduce resource consumption.

**Default**: Address bottlenecks directly (replica upgrade, dedicated replicas) rather than throttling.

**Risks**: Throttling too aggressively makes replica useless for reads without reducing primary write rate.

**Related Rules/Skills**: 7-18-1 (always monitor replica resource utilization before throttling), 7-18-2 (never throttle without testing effect on user traffic)

---

### D2: Flow control configuration (Group Replication)

**Decision Context**: Configure MySQL Group Replication flow control to throttle the whole group.

**Criteria**:
- Number of group members
- Replica lag tolerance
- Write throughput requirements

**Tree**:
```
Is replica lag consistently exceeding threshold?
├── Yes → Enable flow control
│   SET group_replication_flow_control_mode = 'QUOTA'
│   Adjust quota percent based on throughput requirements
└── No → Flow control disabled (default)
```

**Rationale**: Flow control throttles the entire group (including primary) when a replica falls behind. This prevents unbounded lag but reduces write throughput.

**Default**: Flow control disabled unless replica lag is a persistent problem.

**Risks**: Flow control reduces overall write throughput. It's a tradeoff between lag and throughput.

**Related Rules/Skills**: 7-18-1 (always monitor replica resource utilization)

---

### D3: Application-level backpressure implementation

**Decision Context**: Implement backpressure in the application layer to reduce write rate when replicas lag.

**Criteria**:
- Replica lag monitoring
- Write volume
- User experience impact

**Tree**:
```
Can the application detect replica lag?
├── Yes
│   └── When lag > threshold:
│       - Reduce write throughput (queue writes, slow down batch jobs)
│       - Return 429 (Too Many Requests) to non-critical writes
└── No → Monitor lag but don't modulate application
```

**Rationale**: Application-level backpressure is the most effective throttling mechanism because it addresses the root cause (write rate).

**Default**: Implement lag-monitoring middleware that returns 429 for non-critical writes during high lag events.

**Risks**: Aggressive backpressure can cause queue buildup and timeouts.

**Related Rules/Skills**: 7-18-2 (never throttle without testing effect on user traffic)

---
