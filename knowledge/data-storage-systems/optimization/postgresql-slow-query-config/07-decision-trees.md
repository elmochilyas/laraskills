# Decision Trees for 4-6 PostgreSQL Slow Query Config

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-6 |
| Title | PostgreSQL Slow Query Config |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: Slow query threshold selection
- D2: auto_explain vs pg_stat_statements vs both
- D3: Plan capture strategy for post-hoc analysis
- D4: Log retention and rotation

## Architecture-Level Decision Trees

### D1: Slow query threshold selection

**Decision Context**: Set `log_min_duration_statement` to capture queries exceeding acceptable duration.

**Criteria**:
- Application latency requirements
- Disk space for log storage
- Query volume

**Tree**:
```
Is this OLTP or reporting workload?
├── OLTP (high throughput, low latency)
│   ├── Strict SLA (< 100ms) → Set to 200ms
│   └── Standard SLA (< 500ms) → Set to 500ms
└── Reporting/analytics (longer queries)
    └── Set to 1000ms or higher
```

**Rationale**: OLTP systems should flag any query exceeding normal latency. Reporting systems need higher thresholds to avoid noise.

**Default**: `log_min_duration_statement = 500ms` for standard OLTP workloads.

**Risks**: Too-low threshold generates excessive log volume; too-high threshold misses problematic queries.

**Related Rules/Skills**: 4-5 (MySQL slow query log), 4-30 (production optimization workflow)

---

### D2: auto_explain vs pg_stat_statements vs both

**Decision Context**: Choose tools for query performance analysis.

**Criteria**:
- Need for execution plans vs aggregated stats
- Overhead tolerance
- Debugging specific queries vs top-N analysis

**Tree**:
```
Need execution plans for slow queries?
├── Yes → Enable auto_explain
│   └── Also need top-N aggregated stats?
│       ├── Yes → Both auto_explain + pg_stat_statements
│       └── No → auto_explain only
└── No → pg_stat_statements for top-N analysis
```

**Rationale**: auto_explain captures plans for post-hoc analysis. pg_stat_statements provides aggregate statistics (total time, mean time, calls). Both together give complete picture.

**Default**: Enable both `auto_explain.log_min_duration = 500` and `pg_stat_statements`.

**Risks**: auto_explain adds plan capture overhead per slow query. pg_stat_statements memory grows with unique query count.

**Related Rules/Skills**: 4-27 (profiling tools)

---

### D3: Plan capture strategy for post-hoc analysis

**Decision Context**: Decide which query plans to log and how to store them.

**Criteria**:
- Query shape variability
- Reproducibility of slow queries
- Storage budget

**Tree**:
```
Are slow queries reproducible in dev/staging?
├── Yes → Use EXPLAIN ANALYZE manually
└── No (only happens in production at specific times)
    └── Enable auto_explain with log plan output
```

**Rationale**: auto_explain is essential for queries that are only slow under production conditions (data volume, concurrency, parameter values).

**Default**: Enable auto_explain logging plans for all queries exceeding slow query threshold.

**Risks**: Plan output increases log volume significantly.

**Related Rules/Skills**: 4-26 (query log analysis)

---
