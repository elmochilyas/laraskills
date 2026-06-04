# Decision Trees for 7-15 MariaDB / MySQL Differences

## Metadata

| Field | Value |
|-------|-------|
| ID | 7-15 |
| Title | MariaDB / MySQL Differences |
| Decision Type | Replication |

## Decision Inventory

- D1: Database vendor selection for new projects
- D2: Cross-vendor replication feasibility
- D3: Parallel replication strategy by vendor

## Architecture-Level Decision Trees

### D1: Database vendor selection for new projects

**Decision Context**: Choose between MySQL and MariaDB for a new project.

**Criteria**:
- Feature requirements
- Ecosystem compatibility
- Replication topology complexity

**Tree**:
```
Which features are needed?
├── GTID, multi-source, parallel replication
│   ├── MySQL 8.0+ → MySQL (Group Replication, InnoDB Cluster)
│   └── MariaDB 10.0+ → MariaDB (native multi-source, optimistic parallel)
├── Oracle compatibility, enterprise features → MySQL
└── Open-source purity, permissive license → MariaDB
```

**Rationale**: Both databases have different strengths. MySQL has broader ecosystem support. MariaDB has native multi-source replication and optimistic parallel replication.

**Default**: MySQL 8.0+ for most new projects; MariaDB when specific features (multi-source, parallel) are primary requirements.

**Risks**: Mixing MySQL and MariaDB in replication topology is not recommended.

**Related Rules/Skills**: 7-15-1 (never replicate MySQL from MariaDB), 7-15-2 (always test cross-version replication before production)

---

### D2: Cross-vendor replication feasibility

**Decision Context**: Set up replication between MySQL and MariaDB instances.

**Criteria**:
- Direction (MySQL → MariaDB vs MariaDB → MySQL)
- Version compatibility
- Feature parity

**Tree**:
```
Which direction?
├── MySQL → MariaDB
│   └── Possible with GTID compatibility settings
│       (MariaDB can replicate from MySQL 8.0)
└── MariaDB → MySQL
    └── Not supported (GTID format incompatible)
        Use ETL or CDC instead
```

**Rationale**: MariaDB can act as a replica for MySQL (one-way). MySQL cannot replicate from MariaDB due to incompatible GTID formats.

**Default**: Avoid cross-vendor replication in production unless absolutely necessary.

**Risks**: Cross-vendor replication has subtle incompatibilities with default collation, data types, and SQL syntax.

**Related Rules/Skills**: 7-15-1 (never replicate MySQL from MariaDB)

---

### D3: Parallel replication strategy by vendor

**Decision Context**: Configure parallel replication based on database vendor.

**Criteria**:
- Database version
- Write workload characteristics
- Replica apply throughput requirements

**Tree**:
```
Which database?
├── MariaDB → Use optimistic parallel replication
│   slave_parallel_threads = 4-16
│   slave_parallel_mode = optimistic
└── MySQL → Use LOGICAL_CLOCK parallel replication
    slave_parallel_workers = 4-16
    slave_parallel_type = LOGICAL_CLOCK
```

**Rationale**: MariaDB's optimistic mode can apply transactions in parallel even when they touch different databases. MySQL's LOGICAL_CLOCK groups transactions by commit timestamp.

**Default**: 4-8 parallel threads/workers for OLTP workloads.

**Risks**: Too many parallel threads can overload replica CPU and increase contention.

**Related Rules/Skills**: 7-15-2 (always test cross-version replication before production)

---
