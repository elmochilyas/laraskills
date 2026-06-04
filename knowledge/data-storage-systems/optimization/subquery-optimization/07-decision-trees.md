# Decision Trees for 4-25 Subquery Optimization

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-25 |
| Title | Subquery Optimization |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: Correlated subquery → LATERAL join conversion
- D2: EXISTS vs IN subquery selection
- D3: Subquery placement (SELECT, FROM, WHERE)

## Architecture-Level Decision Trees

### D1: Correlated subquery → LATERAL join conversion

**Decision Context**: Eloquent addSelect with subquery generates correlated subquery that executes per outer row.

**Criteria**:
- Database support for LATERAL joins
- Number of outer rows
- Index on correlated column

**Tree**:
```
Which database?
├── PostgreSQL (supports LATERAL)
│   └── Is the correlated column indexed?
│       ├── Yes → Use LATERAL join
│       └── No → Add index, then use LATERAL
└── MySQL (no LATERAL)
    └── Index the correlated column + accept correlated subquery
```

**Rationale**: LATERAL makes the per-row execution explicit and optimized. Without LATERAL, correlated subqueries run once per outer row, which can be O(N * M).

**Default**: LATERAL join in PostgreSQL; indexed correlated subquery in MySQL.

**Risks**: LATERAL without proper index on inner query column still performs O(N * M).

**Related Rules/Skills**: 12-18 (lateral joins PostgreSQL)

---

### D2: EXISTS vs IN subquery selection

**Decision Context**: Choose between whereHas (EXISTS) and whereIn with subquery.

**Criteria**:
- Subquery result size
- Short-circuit potential
- NULL handling

**Tree**:
```
Is the subquery result large (> 1000 rows)?
├── Yes → Use whereHas (EXISTS)
│   EXISTS can short-circuit on first match
└── No → whereIn with subquery acceptable
    (for small subquery results)
```

**Rationale**: EXISTS short-circuits when it finds the first match, making it more efficient for large subquery results. IN materializes the full result set first.

**Default**: Use whereHas for existence checks; whereIn with subquery for small pre-computed lists.

**Risks**: NOT IN returns zero rows if subquery has NULL. Always use NOT EXISTS instead.

**Related Rules/Skills**: 2-7 (relationship counting)

---

### D3: Subquery placement (SELECT, FROM, WHERE)

**Decision Context**: Place subquery in the most efficient clause.

**Criteria**:
- Query structure
- Materialization cost
- Optimization opportunities

**Tree**:
```
Where is the subquery needed?
├── SELECT clause (computed column per row)
│   └── Use addSelect with subquery or LATERAL
├── FROM clause (derived table)
│   └── Ensure derived table is selective before outer filter
│       (push conditions down if possible)
└── WHERE clause
    └── EXISTS for large subqueries, IN for small
```

**Rationale**: SELECT subqueries execute per row (most expensive). FROM subqueries materialize first (can waste work if outer filters later). WHERE subqueries can be semi-join optimized.

**Default**: Prefer WHERE subqueries (EXISTS/IN) over SELECT or FROM subqueries when possible.

**Risks**: Derived table materialization blowup — a subquery returning 1M rows only to be filtered to 10 by outer query.

**Related Rules/Skills**: 12-12 (CTEs), 12-14 (CTE materialization)

---
