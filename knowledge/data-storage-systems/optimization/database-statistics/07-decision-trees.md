# Decision Trees for 4-29 Database Statistics

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-29 |
| Title | Database Statistics |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: ANALYZE timing after bulk data changes
- D2: Auto-analyze threshold tuning
- D3: Histogram management for non-uniform distributions

## Architecture-Level Decision Trees

### D1: ANALYZE timing after bulk data changes

**Decision Context**: Determine when to run ANALYZE after data modifications.

**Criteria**:
- Volume of changes
- Table size
- Query plan sensitivity

**Tree**:
```
Has there been a bulk change (> 10% of rows)?
├── Yes → Run ANALYZE immediately
│   Fresh statistics prevent bad query plans
└── No → Rely on auto-analyze / automatic stats update
```

**Rationale**: InnoDB automatically recalculates stats after > 10% rows change. PostgreSQL auto-analyze fires based on threshold + scale factor. Manual ANALYZE after imports or bulk deletes prevents degraded plans.

**Default**: Run `ANALYZE TABLE` (MySQL) or `ANALYZE` (PostgreSQL) after any bulk import, migration, or mass delete.

**Risks**: ANALYZE on large tables takes time (full scan). Schedule during low-traffic periods.

**Related Rules/Skills**: 3-9 (query optimizer internals), 4-28 (EXPLAIN output interpretation)

---

### D2: Auto-analyze threshold tuning

**Decision Context**: Tune PostgreSQL autovacuum_analyze settings for frequently updated tables.

**Criteria**:
- Update frequency
- Table size
- Query plan sensitivity to stale stats

**Tree**:
```
Is the table frequently updated (> 10% of rows/day)?
├── Yes
│   └── Lower autovacuum_analyze_scale_factor (e.g., 0.01 for 1%)
│       ALTER TABLE large_table SET (autovacuum_analyze_scale_factor = 0.01);
└── No → Default settings are sufficient
```

**Rationale**: Default PostgreSQL auto-analyze triggers after 0.05 × rows + 50 changes. For large tables, this means 500k changes on a 10M-row table before analyze — too slow.

**Default**: Per-table tuning: lower `autovacuum_analyze_scale_factor` for hot tables, keep defaults for cold tables.

**Risks**: Too-frequent analyze adds CPU load. Balance with query plan quality.

**Related Rules/Skills**: 4-28 (EXPLAIN output interpretation)

---

### D3: Histogram management for non-uniform distributions

**Decision Context**: Ensure the optimizer has correct data distribution information for non-uniform columns.

**Criteria**:
- Data distribution skew
- Range predicate frequency
- Database version

**Tree**:
```
Does the column have non-uniform distribution (80/20 pattern)?
├── Yes
│   └── MySQL 8.0+: Use ANALYZE TABLE with histogram
│       ANALYZE TABLE orders UPDATE HISTOGRAM ON status;
│   PostgreSQL: Built-in histogram via auto-analyze
└── No → Default statistics sufficient
```

**Rationale**: Histograms capture column data distribution, enabling better range predicate selectivity estimates for non-uniform data.

**Default**: Create histograms on columns with known non-uniform distributions (status, type, region).

**Risks**: Histograms add storage overhead. Re-analyze after significant distribution changes.

**Related Rules/Skills**: 4-28 (EXPLAIN output interpretation)

---
