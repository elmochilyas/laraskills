# Decision Trees for 4-26 Query Log Analysis

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-26 |
| Title | Query Log Analysis |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: Slow query log vs pg_stat_statements vs application logging
- D2: Query prioritization by total impact
- D3: Normalized query grouping strategy

## Architecture-Level Decision Trees

### D1: Slow query log vs pg_stat_statements vs application logging

**Decision Context**: Choose the primary method for collecting production query performance data.

**Criteria**:
- Database type
- Overhead tolerance
- Need for execution plans vs aggregated stats

**Tree**:
```
Which database?
├── MySQL
│   ├── Need execution plans? → Performance Schema
│   └── Need only timing data? → Slow query log + pt-query-digest
└── PostgreSQL
    ├── Need top-N analysis? → pg_stat_statements
    └── Need plans for slow queries? → auto_explain
```

**Rationale**: pg_stat_statements has minimal overhead and tracks all queries. Slow query log only captures queries above threshold but saves disk space.

**Default**: MySQL: slow query log at 500ms + pt-query-digest. PostgreSQL: pg_stat_statements + auto_explain at 500ms.

**Risks**: Performance Schema in MySQL adds 10-15% overhead.

**Related Rules/Skills**: 4-5 (MySQL slow query log), 4-6 (PostgreSQL slow query config)

---

### D2: Query prioritization by total impact

**Decision Context**: Decide which query to optimize first among candidates.

**Criteria**:
- Frequency × average duration
- Optimization effort
- Expected improvement

**Tree**:
```
Calculate: Total Cost = Frequency × Average Duration
└── Rank queries by total cost descending
    └── Does the top query have a clear fix?
        ├── Yes → Optimize top query first
        └── No → Skip to next query with clearer optimization path
```

**Rationale**: The most impactful optimization is the query with the highest total database time, not the single slowest query.

**Default**: Fix top 5 queries by total execution time per day.

**Risks**: Optimizing the slowest individual query while ignoring high-frequency medium-speed queries misses bigger impact.

**Related Rules/Skills**: 4-30 (production optimization workflow)

---

### D3: Normalized query grouping strategy

**Decision Context**: Group identical query shapes for aggregate analysis.

**Criteria**:
- Query shape variability
- Parameter sensitivity
- Tool capability

**Tree**:
```
Is pt-query-digest available (MySQL)?
├── Yes → Use pt-query-digest (automatic fingerprinting)
└── No → Manual normalization
    Replace literal values with ?
    Group by normalized query text
```

**Rationale**: Normalized query grouping is the foundation of aggregate analysis. A query with different parameters is the same query shape and should be analyzed together.

**Default**: pt-query-digest for MySQL; custom normalization for PostgreSQL.

**Risks**: Queries with different WHERE clause structures are different shapes even if they use the same table.

**Related Rules/Skills**: 4-30 (production optimization workflow)

---
