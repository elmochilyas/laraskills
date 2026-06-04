# Decision Trees for 4-26 Row Count Vs Response Time

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-26 |
| Title | Row Count Vs Response Time |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: Index access pattern → response time estimation
- D2: Buffer pool sizing for working set
- D3: COUNT optimization approach

## Architecture-Level Decision Trees

### D1: Index access pattern → response time estimation

**Decision Context**: Estimate query response time based on index access pattern and expected row count.

**Criteria**:
- Access method (PK lookup, index range, full scan)
- Buffer pool hit rate
- Row size and network transfer

**Tree**:
```
Which access pattern does EXPLAIN show?
├── PK lookup (const) → O(1), 0.5-2ms regardless of table size
├── Index range scan → O(log N + range), 2-10ms per 100 rows
├── Covering index (Using index) → O(log N + range), 1-5ms per 100 rows
├── Full scan → O(N), proportional to table size
└── Full scan + filesort → O(N log N), worst case
```

**Rationale**: Response time follows the algorithm complexity of the access method. NL-joins with nested loops add factor of join_rows.

**Default**: Target index access (range or ref type) for all hot queries.

**Risks**: Buffer pool miss turns an index lookup from 0.5ms to 10ms (disk I/O).

**Related Rules/Skills**: 3-10 (index types), 4-4 (extra column flags)

---

### D2: Buffer pool sizing for working set

**Decision Context**: Size InnoDB buffer pool or PostgreSQL shared_buffers to keep hot data in memory.

**Criteria**:
- Working set size
- Available RAM
- Cache hit ratio

**Tree**:
```
Does the working set fit in available RAM?
├── Yes (data < 70% of RAM)
│   └── Set innodb_buffer_pool_size = 70-80% of RAM
└── No (data > RAM)
    └── Identify hot subset
        └── Can hot subset fit in RAM?
            ├── Yes → Size pool for hot subset
            └── No → Accept disk I/O or scale up
```

**Rationale**: Response time degrades sharply when the working set exceeds buffer pool (the "buffer pool cliff").

**Default**: `innodb_buffer_pool_size = 70% of RAM` for MySQL; `shared_buffers = 25% of RAM` for PostgreSQL.

**Risks**: Oversized buffer pool causes swapping. Monitor `innodb_buffer_pool_reads` vs `read_requests`.

**Related Rules/Skills**: 13-4 (buffer pool sizing)

---

### D3: COUNT optimization approach

**Decision Context**: Count rows efficiently on large InnoDB tables.

**Criteria**:
- Exact count requirement
- WHERE clause presence
- Table size

**Tree**:
```
Need exact count?
├── Yes
│   └── Does query have WHERE clause?
│       ├── Yes → Use covering index for the filter column
│       └── No → Accept full PK scan or cache result
└── No (approximate acceptable)
    └── Use SHOW TABLE STATUS (MySQL) or pg_class.reltuples (Pg)
```

**Rationale**: InnoDB has no built-in row count. COUNT(*) without WHERE scans the PK. Approximate counts from statistics are instant.

**Default**: Cache exact counts with periodic refresh. Use approximate counts for dashboards.

**Risks**: Cached counts are stale. Approximate counts may be off by 10%+ after large changes.

**Related Rules/Skills**: 4-29 (query caching strategies), 4-20 (memory optimization)

---
