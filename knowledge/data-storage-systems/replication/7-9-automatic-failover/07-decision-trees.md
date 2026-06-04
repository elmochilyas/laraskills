# Decision Trees for 7-9 Automatic Failover

## Metadata

| Field | Value |
|-------|-------|
| ID | 7-9 |
| Title | Automatic Failover |
| Decision Type | Replication |

## Decision Inventory

- D1: Orchestration tool selection
- D2: Health check configuration
- D3: Split-brain prevention strategy

## Architecture-Level Decision Trees

### D1: Orchestration tool selection

**Decision Context**: Choose the tool for automatic failover management.

**Criteria**:
- Database type
- Infrastructure complexity tolerance
- Cloud vs self-managed

**Tree**:
```
Which database?
├── MySQL
│   ├── Self-managed → Orchestrator or ProxySQL
│   └── Cloud → RDS Multi-AZ or Aurora
├── PostgreSQL
│   ├── Self-managed → Patroni or repmgr
│   └── Cloud → Cloud SQL HA or RDS Multi-AZ
└── MariaDB → Galera (built-in automatic recovery)
```

**Rationale**: Cloud-managed databases provide automatic failover as a managed feature. Self-managed requires third-party tooling.

**Default**: Cloud-managed HA for managed databases; Orchestrator for self-managed MySQL; Patroni for self-managed PostgreSQL.

**Risks**: Orchestrator misconfiguration can cause false failovers. Test thoroughly before production.

**Related Rules/Skills**: 7-8 (replica promotion and failover), 7-9-1 (always validate health checks)

---

### D2: Health check configuration

**Decision Context**: Configure health checks to detect primary failure without false positives.

**Criteria**:
- Network stability
- Check frequency
- Failure threshold

**Tree**:
```
Is the network stable (within same DC/AZ)?
├── Yes
│   └── Connection check every 1 second
│       Fail after 3 consecutive failures → ~3s detection
└── No (cross-region, less stable)
    └── Connection + query check every 5 seconds
        Fail after 5 consecutive failures → ~25s detection
```

**Rationale**: Health check frequency balances detection speed vs false positives. Too-fast detection in unstable networks causes false failovers.

**Default**: Same-region: 1s check, 3 failures. Cross-region: 5s check, 5 failures.

**Risks**: False positive failover causes unnecessary downtime. False negative delays actual failover.

**Related Rules/Skills**: 7-9-1 (always validate health checks before automatic failover)

---

### D3: Split-brain prevention strategy

**Decision Context**: Prevent both old and new primary from accepting writes simultaneously.

**Criteria**:
- Network partition handling
- STONITH capability
- Fencing mechanism

**Tree**:
```
Can STONITH (shoot other node) be implemented?
├── Yes → Force-kill old primary on failover
│   Prevents dual-write scenario
└── No → Use quorum-based approach
    Require majority of nodes for write acceptance
    Minority side rejects writes
```

**Rationale**: Split-brain causes data divergence that is extremely difficult to repair. Prevention must be absolute.

**Default**: STONITH when infrastructure supports it; quorum-based fencing otherwise.

**Risks**: Split-brain recovery may require manual intervention and data reconciliation.

**Related Rules/Skills**: 7-9-2 (never allow split-brain in automatic failover)

---
