# Decision Trees for 7-11 Conflict Resolution

## Metadata

| Field | Value |
|-------|-------|
| ID | 7-11 |
| Title | Conflict Resolution |
| Decision Type | Replication |

## Decision Inventory

- D1: Database-level vs application-level conflict resolution
- D2: Conflict resolution strategy selection
- D3: Retry strategy for Galera certification failures

## Architecture-Level Decision Trees

### D1: Database-level vs application-level conflict resolution

**Decision Context**: Choose where to handle write conflicts in multi-master replication.

**Criteria**:
- Data loss tolerance
- Application complexity budget
- Conflict frequency

**Tree**:
```
Are conflicts expected to be frequent?
├── Yes (concurrent writes to same rows)
│   └── Database-level resolution (FCC, LWW)
│       Lower latency, automatic
└── No (conflicts are rare)
    └── Can application tolerate data loss on conflict?
        ├── No → Application-level (store both versions, manual merge)
        └── Yes → Database-level (LWW)
```

**Rationale**: Database-level resolution is automatic but may lose data (LWW overwrites). Application-level stores both versions for manual resolution.

**Default**: Database-level conflict resolution (FCC in Galera) for low-conflict workloads; application-level for data-critical operations.

**Risks**: LWW can silently overwrite important updates with stale data.

**Related Rules/Skills**: 7-11-1 (always handle conflict rollback in application), 7-11-2 (never assume conflicts don't happen)

---

### D2: Conflict resolution strategy selection

**Decision Context**: Choose specific conflict resolution algorithm.

**Criteria**:
- Data type and semantics
- Business requirements for conflict handling
- Performance impact

**Tree**:
```
What type of conflict?
├── Update-update
│   ├── Last-Writer-Wins (LWW) → Simple, may lose data
│   └── First-Committer-Wins (FCC) → Galera default, rolls back losers
├── Insert-insert (unique key conflict)
│   └── Configure auto_increment_increment + offset per node
└── Delete-update
    └── LWW or FCC (delete wins or update wins based on ordering)
```

**Rationale**: Each conflict type has different resolution options. FCC is the safest (first valid writer wins, others retry). LWW is simplest but may lose data.

**Default**: FCC for synchronous (Galera); LWW for asynchronous.

**Risks**: FCC in Galera causes transaction rollbacks that application must retry.

**Related Rules/Skills**: 7-10 (multi-master replication), 7-20 (peer-to-peer replication)

---

### D3: Retry strategy for Galera certification failures

**Decision Context**: Handle Galera certification failures (conflict rollbacks) in application code.

**Criteria**:
- Rollback frequency
- Retry idempotency
- User experience impact

**Tree**:
```
Is the application prepared to handle deadlock errors?
├── Yes
│   └── Implement retry loop (3 attempts with exponential backoff)
└── No
    └── Restructure writes to avoid conflicts
        (partition data by node, use different primary key ranges)
```

**Rationale**: Galera certification failures throw deadlock errors. Applications must catch and retry. Retry loops with backoff handle transient conflicts.

**Default**: 3 retry attempts with 100ms, 200ms, 500ms backoff.

**Risks**: Without retry logic, certification failures cause application errors and data write failures.

**Related Rules/Skills**: 7-11-1 (always handle conflict rollback in application)

---
