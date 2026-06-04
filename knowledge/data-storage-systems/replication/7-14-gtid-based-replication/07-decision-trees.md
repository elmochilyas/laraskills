# Decision Trees for 7-14 GTID-Based Replication

## Metadata

| Field | Value |
|-------|-------|
| ID | 7-14 |
| Title | GTID-Based Replication |
| Decision Type | Replication |

## Decision Inventory

- D1: GTID vs file-based replication
- D2: GTID migration strategy from file-based replication
- D3: GTID skip-transaction error handling

## Architecture-Level Decision Trees

### D1: GTID vs file-based replication

**Decision Context**: Choose between GTID-based and traditional file-position-based replication.

**Criteria**:
- Database version
- Failover frequency
- Topology complexity

**Tree**:
```
Does the database support GTID (MySQL 5.6+ / MariaDB 10.0+)?
├── Yes
│   └── Is failover simplicity important?
│       ├── Yes → Use GTID
│       └── No → File-based acceptable
└── No → File-based replication (legacy)
```

**Rationale**: GTID simplifies failover by eliminating the need to find binlog positions. Any replica can be promoted without manual position lookup.

**Default**: GTID-based replication for all new setups on supported versions.

**Risks**: GTID migration from existing file-based replication requires careful planning and validation.

**Related Rules/Skills**: 7-14-1 (always enable enforce_gtid_consistency), 7-14-2 (never switch GTID mode without full cluster validation)

---

### D2: GTID migration strategy from file-based replication

**Decision Context**: Migrate existing file-based replication to GTID.

**Criteria**:
- Existing replication health
- Downtime tolerance
- Cluster size

**Tree**:
```
Can the application tolerate a brief read-only window?
├── Yes → Online GTID migration
│   1. Set gtid_mode = ON_PERMISSIVE (all nodes)
│   2. Wait for all nodes to process existing transactions
│   3. Set gtid_mode = ON
│   4. Switch replicas to MASTER_AUTO_POSITION=1
└── No → Schedule maintenance window
```

**Rationale**: GTID migration follows a specific sequence (OFF → OFF_PERMISSIVE → ON_PERMISSIVE → ON) that must be followed exactly.

**Default**: Online migration with permissive mode transition steps.

**Risks**: Skipping the permissive step causes GTID gaps and replication failures.

**Related Rules/Skills**: 7-14-2 (never switch GTID mode without full cluster validation)

---

### D3: GTID skip-transaction error handling

**Decision Context**: Handle transaction errors in GTID mode without sql_slave_skip_counter.

**Criteria**:
- Error type (duplicate key, missing row)
- Transaction impact
- Data consistency

**Tree**:
```
Is the error from a known-safe transaction to skip?
├── Yes → Inject empty transaction with the problematic GTID
│   STOP SLAVE; SET GTID_NEXT='uuid:seq'; BEGIN; COMMIT;
│   SET GTID_NEXT='AUTOMATIC'; START SLAVE;
└── No → Investigate root cause
```

**Rationale**: GTID mode doesn't support `sql_slave_skip_counter`. Instead, inject an empty transaction with the same GTID to mark it as executed.

**Default**: Investigate all replication errors rather than blindly skipping.

**Risks**: Skipping transactions can cause data divergence between primary and replica.

**Related Rules/Skills**: 7-14-1 (always enable enforce_gtid_consistency)

---
