# Decision Trees for 7-8 Replica Promotion and Failover

## Metadata

| Field | Value |
|-------|-------|
| ID | 7-8 |
| Title | Replica Promotion and Failover |
| Decision Type | Replication |

## Decision Inventory

- D1: Controlled vs automatic failover decision
- D2: Replica selection for promotion
- D3: Connection update strategy

## Architecture-Level Decision Trees

### D1: Controlled vs automatic failover decision

**Decision Context**: Choose between planned (controlled) and unplanned (automatic) failover.

**Criteria**:
- Failover type (planned maintenance vs failure)
- RTO requirement
- Data loss tolerance

**Tree**:
```
Is this a planned maintenance event?
├── Yes (controlled failover)
│   1. Quiesce writes (read-only mode)
│   2. Wait for replica lag = 0
│   3. Promote replica
│   4. Point application to new primary
└── No (unplanned failure)
    └── Automatic detection and promotion
        (may have data loss if lag > 0)
```

**Rationale**: Controlled failover achieves zero data loss (RPO=0). Unplanned failover may lose transactions not yet replicated.

**Default**: Controlled failover for maintenance; automatic failover with monitoring for failures.

**Risks**: Automatic failover with lag means data loss equal to lag duration × write rate.

**Related Rules/Skills**: 7-8-1 (always check lag before promoting), 7-8-2 (never promote with lag > RPO)

---

### D2: Replica selection for promotion

**Decision Context**: Choose which replica to promote when multiple replicas exist.

**Criteria**:
- Replication lag
- Geographic proximity
- Hardware/version compatibility

**Tree**:
```
Which replica has the least lag?
├── Same region, least lag → Promote this replica
└── Cross-region replica with acceptable lag?
    ├── Yes → Promote cross-region if primary region is down
    └── No → Wait for local replica to catch up
```

**Rationale**: The replica with least lag minimizes data loss. Cross-region promotion is only needed when the entire primary region is unavailable.

**Default**: Promote the replica with the least lag in the same region.

**Risks**: Promoting the wrong replica (highest lag) causes maximum data loss.

**Related Rules/Skills**: 7-8-1 (always check lag before promoting)

---

### D3: Connection update strategy

**Decision Context**: Update application connections after failover.

**Criteria**:
- Connection management approach
- DNS propagation time
- Application retry capability

**Tree**:
```
How are connections managed?
├── DNS-based
│   └── Update DNS record → Wait for TTL propagation
├── VIP/load balancer
│   └── Move VIP to new primary → Instant failover
└── Application configuration
    └── Update config → Restart/reload application
```

**Rationale**: VIP/load balancer provides the fastest failover (seconds). DNS updates are slowest (minutes). Application config restart is in-between.

**Default**: VIP/load balancer for sub-second failover; DNS for simpler setups with higher tolerance.

**Risks**: DNS cache in application servers may point to old primary for minutes after update.

**Related Rules/Skills**: 7-9 (automatic failover)

---
