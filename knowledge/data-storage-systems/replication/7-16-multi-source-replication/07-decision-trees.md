# Decision Trees for 7-16 Multi-Source Replication

## Metadata

| Field | Value |
|-------|-------|
| ID | 7-16 |
| Title | Multi-Source Replication |
| Decision Type | Replication |

## Decision Inventory

- D1: Multi-source topology design
- D2: Table name collision strategy
- D3: Per-channel monitoring approach

## Architecture-Level Decision Trees

### D1: Multi-source topology design

**Decision Context**: Configure a replica that receives data from multiple primary sources.

**Criteria**:
- Number of source primaries
- Schema similarity
- Data isolation requirements

**Tree**:
```
Do source databases have the same schema?
├── Yes (sharded databases)
│   └── Use separate databases per source on replica
│       rewrite source_db → dest_db_1, source_db → dest_db_2
└── No (different applications)
    └── Use separate databases with source-specific naming
```

**Rationale**: Same-schema sources can be consolidated using `replicate_rewrite_db` to map each source to a different destination database.

**Default**: Separate databases per source on the replica for clear data isolation.

**Risks**: Table name collisions cause data overwrites between sources. Use unique database names per source.

**Related Rules/Skills**: 7-16-1 (always ensure unique table/database names across sources), 7-16-2 (never mix sources without per-channel monitoring)

---

### D2: Table name collision strategy

**Decision Context**: Prevent data overwrites when multiple sources have tables with the same name.

**Criteria**:
- Number of overlapping table names
- Schema flexibility
- Application read patterns

**Tree**:
```
Do sources share table names?
├── Yes
│   └── Can schemas be modified?
│       ├── Yes → Add source prefix to table names
│       └── No → Use replication filters
│           replicate_do_table / replicate_ignore_table per channel
└── No → No action needed (unique names)
```

**Rationale**: Table name collisions are the most common multi-source failure. Prefixing or separate databases per source prevents data mixing.

**Default**: Use separate databases per source with replication rewriting.

**Risks**: If both sources insert into `orders` table, data from source 2 overwrites source 1.

**Related Rules/Skills**: 7-16-1 (always ensure unique table/database names across sources)

---

### D3: Per-channel monitoring approach

**Decision Context**: Monitor each replication channel independently.

**Criteria**:
- Number of channels
- SLA per source
- Alerting requirements

**Tree**:
```
How many source channels?
├── 2-4 channels → Monitor each individually
│   SHOW SLAVE 'channel_name' STATUS per channel
└── 5+ channels → Aggregate monitoring with alert on max lag
```

**Rationale**: Each channel can lag independently. A single slow channel can go unnoticed without per-channel monitoring.

**Default**: Per-channel lag monitoring with alerts on any channel exceeding threshold.

**Risks**: One channel lagging can impact others if replica apply threads are shared.

**Related Rules/Skills**: 7-16-2 (never mix sources without per-channel monitoring)

---
