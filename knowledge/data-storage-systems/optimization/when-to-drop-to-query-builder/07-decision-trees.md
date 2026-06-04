# Decision Trees for 4-23 When To Drop To Query Builder

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-23 |
| Title | When To Drop To Query Builder |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: Eloquent vs query builder vs raw SQL decision
- D2: Reporting and dashboard data strategy
- D3: Database-specific feature usage

## Architecture-Level Decision Trees

### D1: Eloquent vs query builder vs raw SQL decision

**Decision Context**: Choose the appropriate abstraction level for a query.

**Criteria**:
- Need for model methods
- Query complexity
- Performance requirements

**Tree**:
```
Do you need model features (mutators, events, relationships)?
├── Yes → Use Eloquent
└── No
    └── Is the query expressible in query builder?
        ├── Yes → Use query builder (DB::table)
        └── No → Use raw SQL (DB::select, DB::statement)
```

**Rationale**: Eloquent hydration adds overhead. Query builder returns stdClass (10x less memory). Raw SQL is for database-specific features.

**Default**: Query builder for data-only queries; Eloquent when model features are needed; raw SQL only when necessary.

**Risks**: Raw SQL is database-specific and may not be portable.

**Related Rules/Skills**: 2-10 (query builder methods)

---

### D2: Reporting and dashboard data strategy

**Decision Context**: Build aggregation and reporting queries efficiently.

**Criteria**:
- Aggregation complexity
- Data volume
- Real-time requirements

**Tree**:
```
Is this a simple aggregation (COUNT, SUM, AVG)?
├── Yes → Query builder with selectRaw
└── Complex aggregation (window functions, CTEs, subqueries)
    └── Is query builder sufficient?
        ├── Yes (PostgreSQL: DB::raw for window functions)
        └── No → Raw SQL with DB::select
```

**Rationale**: Dashboard queries never need model hydration. Query builder handles most aggregations. Window functions and CTEs require raw SQL fragments.

**Default**: Query builder + selectRaw for aggregations; raw SQL for window functions and CTEs.

**Risks**: Raw SQL fragments bypass Laravel's query parameter binding — use named bindings.

**Related Rules/Skills**: 4-15 (SQL-side vs collection-side aggregation)

---

### D3: Database-specific feature usage

**Decision Context**: Use database-specific features that Eloquent doesn't expose.

**Criteria**:
- Feature availability per database
- Portability requirements
- Migration strategy

**Tree**:
```
Is the feature supported across all target databases?
├── Yes (JSON operators, basic aggregates)
│   └── Use query builder
└── No (PostgreSQL-only: LATERAL, DISTINCT ON, partial indexes)
    └── Use raw SQL with DB::select or DB::statement
        Document database dependency
```

**Rationale**: Database-specific features should be used when the performance benefit justifies the lock-in. Raw SQL is the only option.

**Default**: Raw SQL for database-specific features, documented with the specific database requirement.

**Risks**: Database-specific queries break when switching databases. Isolate in database-specific files.

**Related Rules/Skills**: 12-18 (lateral joins PostgreSQL), 12-13 (recursive CTEs)

---
