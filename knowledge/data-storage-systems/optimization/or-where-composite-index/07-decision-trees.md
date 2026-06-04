# Decision Trees for 4-11 Or Where Composite Index

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-11 |
| Title | Or Where Composite Index |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: OR conditions → grouped OR vs UNION
- D2: Unintentional OR scope fix
- D3: High-selectivity OR optimization

## Architecture-Level Decision Trees

### D1: OR conditions → grouped OR vs UNION

**Decision Context**: `orWhere` on different index parts causes full table scan.

**Criteria**:
- Selectivity of each OR branch
- Index coverage
- Result set size

**Tree**:
```
Are both sides of OR highly selective?
├── Yes (each branch returns < 5% of rows)
│   └── Use UNION
│       (SELECT * FROM t WHERE user_id = X)
│       UNION
│       (SELECT * FROM t WHERE status = 'urgent')
└── No (one or both branches non-selective)
    └── Use grouped OR with closure
        where(fn($q) => $q->where('a', X)->orWhere('b', Y))
```

**Rationale**: UNION with highly selective branches uses separate indexes per branch. Grouped OR clarifies scope for the optimizer but may still full-scan if neither branch is selective.

**Default**: Closure-based grouped OR for most cases; UNION for high-selectivity branches.

**Risks**: UNION deduplicates results which adds overhead. Use UNION ALL if duplicates are acceptable or impossible.

**Related Rules/Skills**: 2-14 (unions)

---

### D2: Unintentional OR scope fix

**Decision Context**: `where('a', 1)->orWhere('b', 2)` applies OR to entire WHERE clause, not just the intended group.

**Criteria**:
- Query complexity
- Number of conditions
- Boolean logic expectation

**Tree**:
```
Is the OR intended as a subset of conditions?
├── Yes (e.g., WHERE status = 'active' AND (type = 'admin' OR role = 'moderator'))
│   └── Use closure grouping
│       where('status', 'active')
│       ->where(fn($q) => $q->where('type', 'admin')->orWhere('role', 'moderator'))
└── No (OR at top level is intentional)
    └── Proceed with caution — verify EXPLAIN
```

**Rationale**: Unintentional OR scope produces wrong WHERE logic: `(where a) OR (b)` instead of `where a AND (b OR c)`. This is both a logic bug and a performance bug.

**Default**: Always group OR conditions with closures. Never chain `orWhere` directly after `where` without grouping.

**Risks**: Already-correct queries may be re-scoped incorrectly during refactoring.

**Related Rules/Skills**: Common mistake in 4-11

---

### D3: High-selectivity OR optimization

**Decision Context**: Each OR branch matches few rows but combined they cover many rows.

**Criteria**:
- Individual branch selectivity
- Combined result size
- Available indexes per column

**Tree**:
```
Can each OR branch use a different index?
├── Yes (separate indexes on each column)
│   └── Use UNION for independent index use
└── No (some columns lack indexes)
    └── Add missing index or rewrite query
```

**Rationale**: When OR branches are on different columns with separate indexes, MySQL's index merge may be used but is less efficient than UNION. PostgreSQL may use bitmap index scans.

**Default**: Separate indexes per OR column + UNION for maximum performance.

**Risks**: Index merge in MySQL has limited capacity and may fall back to full scan.

**Related Rules/Skills**: 3-10 (index types)

---
