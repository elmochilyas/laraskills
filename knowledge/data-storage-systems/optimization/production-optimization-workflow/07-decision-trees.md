# Decision Trees for 4-30 Production Optimization Workflow

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-30 |
| Title | Production Optimization Workflow |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: Optimization target selection (which query to fix)
- D2: Verification methodology (before/after comparison)
- D3: Monitoring and regression detection approach

## Architecture-Level Decision Trees

### D1: Optimization target selection (which query to fix)

**Decision Context**: Choose which query to optimize based on production data.

**Criteria**:
- Total execution time (frequency × average duration)
- Optimization confidence
- Implementation effort

**Tree**:
```
Rank queries by Total Cost = Frequency × Average Duration
└── Does the top query have a known fix (missing index, N+1)?
    ├── Yes → Fix it (highest ROI)
    └── No → Move to next query
        Repeat until confident fix is available
```

**Rationale**: The query with the highest total database time may not be the slowest individually. Rank by total cost, not by individual duration.

**Default**: Fix top 3 queries by total execution time per optimization cycle.

**Risks**: Optimizing low-cost queries wastes effort. Always verify with production metrics.

**Related Rules/Skills**: 4-26 (query log analysis), 4-27 (profiling tools)

---

### D2: Verification methodology (before/after comparison)

**Decision Context**: Verify that an optimization produced the expected improvement.

**Criteria**:
- Baseline metrics availability
- Test environment similarity to production
- Concurrency simulation

**Tree**:
```
Are baseline metrics available?
├── Yes (p50/p95/p99 duration, rows examined, frequency)
│   └── Apply fix → Re-measure → Compare
│       Is the improvement significant (> 20%)?
│       ├── Yes → Deploy to production
│       └── No → Revert or refine fix
└── No
    └── First: establish baseline metrics
        (run query 10+ times, record stats)
```

**Rationale**: Without baseline, you can't prove the fix worked. Production-like data volume is critical — a query running 2ms on 10k rows may run 2s on 10M rows.

**Default**: Always capture EXPLAIN before and after. Compare plan changes, not just intuition.

**Risks**: Optimization that works on single-user dev may degrade under production concurrency.

**Related Rules/Skills**: 4-28 (EXPLAIN output interpretation)

---

### D3: Monitoring and regression detection approach

**Decision Context**: Continuously monitor optimized queries to detect regression.

**Criteria**:
- Query significance (was it in top-N?)
- Data growth rate
- Schema change frequency

**Tree**:
```
Was the query in the top-10 most expensive?
├── Yes
│   └── Set up per-query monitoring
│       - Alert on p95 increase > 20% from baseline
│       - Track rows examined trend
│       - Log plan changes
└── No → Standard monitoring (aggregate metrics)
```

**Rationale**: Optimized queries can regress as data grows, statistics change, or schema evolves. Continuous monitoring catches regression.

**Default**: Track p50/p95/p99 for optimized queries. Alert on significant deviation.

**Risks**: Ignoring regression allows gradual performance degradation that accumulates over months.

**Related Rules/Skills**: 4-28 (endpoint query governance)

---
