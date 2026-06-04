# Decision Trees for 4-25 Lazy Loading Detection

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-25 |
| Title | Lazy Loading Detection |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: Lazy loading prevention strategy (development vs production)
- D2: N+1 detection tool selection
- D3: Model $with attribute usage

## Architecture-Level Decision Trees

### D1: Lazy loading prevention strategy (development vs production)

**Decision Context**: Enable strict mode to catch N+1 queries.

**Criteria**:
- Environment (dev, staging, production)
- Performance monitoring capability
- Tolerance for exceptions

**Tree**:
```
Is this a development/staging environment?
├── Yes → Enable preventLazyLoading (throws exceptions)
└── Production
    └── Can you monitor query logs?
        ├── Yes → Disable prevention, use monitoring
        └── No → Enable prevention with soft failure (log only)
```

**Rationale**: preventLazyLoading in development catches N+1 at call site. In production, exceptions would break user-facing pages; monitoring is safer.

**Default**: `Model::preventLazyLoading(! app()->isProduction())` in AppServiceProvider.

**Risks**: Disabled prevention in production means N+1 goes undetected without monitoring.

**Related Rules/Skills**: 2-25 (N+1 detection), 4-26 (query log analysis)

---

### D2: N+1 detection tool selection

**Decision Context**: Choose tools for detecting lazy loading in different environments.

**Criteria**:
- Environment
- Overhead tolerance
- Team workflow

**Tree**:
```
Which environment?
├── Local development
│   └── Debugbar (browser toolbar, zero-config)
├── Staging/limited production
│   └── Telescope (stores to DB, N+1 warnings)
└── Production
    └── Query count middleware + alerting
        (log queries with > N per request)
```

**Rationale**: Debugbar provides instant visual feedback. Telescope stores history for analysis. Production needs lightweight monitoring.

**Default**: Debugbar in local, Telescope in staging, custom query middleware in production.

**Risks**: Telescope in production without pruning fills storage. Debugbar in production exposes data.

**Related Rules/Skills**: 4-27 (profiling tools)

---

### D3: Model $with attribute usage

**Decision Context**: Using `$with` on model class to always eager load relationships.

**Criteria**:
- Relationship necessity across all queries
- Performance impact
- Query count

**Tree**:
```
Is the relationship needed in EVERY query context?
├── Yes (always show author name)
│   └── Acceptable in $with (but verify)
└── No (needed only in some queries)
    └── Use ->with() per query instead
```

**Rationale**: `$with` eager loads on every query, even when the relationship isn't used. This wastes I/O and memory.

**Default**: Never use `$with` on model class. Prefer explicit `->with()` per query.

**Risks**: Removing `$with` may cause N+1 in existing code that relied on it.

**Related Rules/Skills**: 2-7 (relationship counting), 2-3 (eager loading)

---
