# Decision Trees for 4-28 Explain Output Interpretation

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-28 |
| Title | Explain Output Interpretation |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: MySQL EXPLAIN red flag detection
- D2: PostgreSQL EXPLAIN red flag detection
- D3: EXPLAIN ANALYZE vs plain EXPLAIN selection

## Architecture-Level Decision Trees

### D1: MySQL EXPLAIN red flag detection

**Decision Context**: Identify problematic patterns in MySQL EXPLAIN output.

**Criteria**:
- Access type (type column)
- Extra flags
- Rows estimate vs actual

**Tree**:
```
Check MySQL EXPLAIN output:
├── type=ALL (full table scan)?
│   └── Add missing index on WHERE column
├── Extra="Using filesort"?
│   └── Add ORDER BY column to index
├── Extra="Using temporary"?
│   └── Add GROUP BY column as index leftmost prefix
├── rows >> expected result count?
│   └── Update statistics (ANALYZE TABLE)
└── Extra="Impossible WHERE" → Bad query logic
```

**Rationale**: Each EXPLAIN flag has a known cause and fix. The `type` column descending quality: const > ref > range > index > ALL.

**Default**: Target `type=ref` or `range` for all hot queries.

**Risks**: `type=ALL` on small tables (< 1000 rows) is acceptable.

**Related Rules/Skills**: 4-4 (extra column flags), 3-10 (index types)

---

### D2: PostgreSQL EXPLAIN red flag detection

**Decision Context**: Identify problematic patterns in PostgreSQL EXPLAIN output.

**Criteria**:
- Scan type (Seq Scan vs Index Scan)
- Sort method
- Row count discrepancies

**Tree**:
```
Check PostgreSQL EXPLAIN output:
├── Seq Scan on large table (> 100k rows)?
│   └── Add index on WHERE column
├── Sort Method: external merge Disk?
│   └── Increase work_mem or add sort index
├── Large row count mismatch (estimate vs actual)?
│   └── Run ANALYZE to update statistics
└── Nested Loop with many inner rows?
    └── Consider hash join or index on inner column
```

**Rationale**: PostgreSQL EXPLAIN shows cost (startup..total), estimated rows, and actual rows with ANALYZE. Large discrepancies indicate stale statistics.

**Default**: Always use `EXPLAIN (ANALYZE, BUFFERS)` in PostgreSQL for accurate diagnostics.

**Risks**: Stale statistics cause the optimizer to choose bad plans. Auto-analyze handles most cases but may miss after bulk changes.

**Related Rules/Skills**: 4-29 (database statistics)

---

### D3: EXPLAIN ANALYZE vs plain EXPLAIN selection

**Decision Context**: Choose between estimated and actual execution plan.

**Criteria**:
- Need for actual timing
- Query safety (ANALYZE executes the query)
- Write vs read query type

**Tree**:
```
Is the query read-only (SELECT)?
├── Yes → Use EXPLAIN ANALYZE (shows actual timing)
└── No (INSERT/UPDATE/DELETE)
    └── Use EXPLAIN (plan only, wraps in transaction)
        Actual execution would modify data
```

**Rationale**: ANALYZE executes the query. For read queries this is safe. For write queries, wrap in transaction or use plain EXPLAIN.

**Default**: `EXPLAIN ANALYZE` for SELECT queries; `EXPLAIN` for write queries (or `BEGIN; EXPLAIN ANALYZE ...; ROLLBACK`).

**Risks**: EXPLAIN ANALYZE on a long-running query will actually execute it to completion.

**Related Rules/Skills**: 4-1 (EXPLAIN output interpretation)

---
