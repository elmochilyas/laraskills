# Decision Trees for 4-8 Where Date Sargability Breakage

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-8 |
| Title | Where Date Sargability Breakage |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: whereDate → range query refactoring
- D2: whereMonth/whereYear/whereDay replacement
- D3: Scope and JOIN context handling

## Architecture-Level Decision Trees

### D1: whereDate → range query refactoring

**Decision Context**: `whereDate('created_at', today())` generates `DATE(created_at) = ?`, bypassing index.

**Criteria**:
- Table size
- Query frequency
- Index existence on date column

**Tree**:
```
Is the date column indexed?
├── Yes
│   └── Is table large (> 100k rows)?
│       ├── Yes → Replace with range query
│       │   where('created_at', '>=', $start)
│       │   ->where('created_at', '<', $end)
│       └── No → Acceptable (performance impact minimal)
└── No → No immediate fix needed (no index anyway)
```

**Rationale**: Function-wrapped columns prevent index access. Range queries on indexed date columns use B-Tree range scans, which are efficient for any table size.

**Default**: Always use half-open range `[$start, $end)` for date filtering on indexed columns.

**Risks**: Off-by-one errors with timestamps — use `startOfNextDay()` not `endOfDay()` for microsecond precision.

**Related Rules/Skills**: 3-28 (sargability rule), 4-7 (sargable vs non-sargable)

---

### D2: whereMonth/whereYear/whereDay replacement

**Decision Context**: `whereMonth('col', 1)` generates `MONTH(col) = 1`, causing full table scan.

**Criteria**:
- Data retention period
- Query precision requirements
- Performance budget

**Tree**:
```
Can the query be expressed as a date range?
├── Yes (e.g., "posts from January 2025")
│   └── Use range: whereBetween('created_at', [$start, $end])
└── No (e.g., "all posts from any January")
    └── Is this a reporting query?
        ├── Yes → Accept full scan (run during low traffic)
        └── No → Add generated column for month + index it
```

**Rationale**: Month/year queries often have alternatives via date ranges. Only accept full scan for non-critical reporting.

**Default**: Replace with date range when possible; use generated column + index when range isn't feasible.

**Risks**: Generated columns add storage and write overhead.

**Related Rules/Skills**: 13-14 (generated columns MySQL), 12-39 (generated columns PostgreSQL)

---

### D3: Scope and JOIN context handling

**Decision Context**: A local scope or JOIN condition uses whereDate, silently breaking index.

**Criteria**:
- Scope reuse frequency
- JOIN complexity
- Performance monitoring

**Tree**:
```
Is whereDate inside a reused scope?
├── Yes → Refactor scope to use range query
└── No
    └── Is whereDate inside a JOIN condition?
        ├── Yes → Double index bypass — refactor both sides
        └── No → Single occurrence, refactor inline
```

**Rationale**: Scopes hide the sargability breakage. One scope change fixes every call site. JOIN conditions compound performance impact.

**Default**: Never use whereDate/whereMonth in reusable scopes or JOIN conditions.

**Risks**: Scopes are called from multiple contexts; verify each call site after refactoring.

**Related Rules/Skills**: 2-14 (unions), N+1 detection with date filtering

---
