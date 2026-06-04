# Decision Trees for 4-28 Endpoint Query Governance

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-28 |
| Title | Endpoint Query Governance |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: Governance tier assignment per endpoint
- D2: App-layer vs DB-layer governance
- D3: Octane-safe governance counter management

## Architecture-Level Decision Trees

### D1: Governance tier assignment per endpoint

**Decision Context**: Assign query count and duration budgets to different endpoint categories.

**Criteria**:
- Endpoint type (API, web, admin, reporting)
- User expectations
- Data volume

**Tree**:
```
What type of endpoint?
├── Public API → Strict: max 10 queries, max 200ms total
├── Web frontend → Moderate: max 30 queries, max 500ms total
├── Admin dashboard → Relaxed: max 100 queries, max 5s total
└── Reporting → Generous: max 500 queries, max 30s total (opt-in)
```

**Rationale**: Different endpoints have fundamentally different data needs. API endpoints must be strict; reporting endpoints need generous budgets.

**Default**: Follow the tier budgets above, adjusted based on monitoring.

**Risks**: Too-strict limits cause false positives. Too-generous limits allow runaway queries.

**Related Rules/Skills**: 4-30 (production optimization workflow)

---

### D2: App-layer vs DB-layer governance

**Decision Context**: Enforce query governance at application or database layer.

**Criteria**:
- Defense in depth requirement
- Database support for query timeouts
- Infrastructure complexity

**Tree**:
```
Is defense in depth required?
├── Yes → Both app-layer middleware + DB-layer timeouts
│   - App: Laravel middleware with per-endpoint budgets
│   - DB: MAX_EXECUTION_TIME (MySQL) or statement_timeout (Pg)
└── No → App-layer middleware only
```

**Rationale**: App-layer governance is flexible but can be bypassed. DB-layer timeouts are a last-resort safety net.

**Default**: App-layer middleware for enforcement + DB-layer timeout for safety net.

**Risks**: DB-layer timeouts kill queries silently. Application must handle `QueryException`.

**Related Rules/Skills**: 9-10 (lock wait timeout configuration)

---

### D3: Octane-safe governance counter management

**Decision Context**: In Octane, DB::listen callbacks persist across requests, causing cross-request counter leakage.

**Criteria**:
- Octane usage
- Request lifecycle management
- Counter reset approach

**Tree**:
```
Is the app running Octane?
├── Yes
│   └── Reset governance counters at request start (middleware)
│       public function handle(Request $r, Closure $next) {
│           $this->queryCount = 0;
│           $this->totalDuration = 0;
│           return $next($r);
│       }
└── No → Standard governance (counters reset per-request naturally)
```

**Rationale**: Octane reuses the container across requests. Persistent state in listeners accumulates across requests without explicit reset.

**Default**: Always reset governance counters in middleware for Octane applications.

**Risks**: Background tick functions and queue heartbeats inflate query counts. Filter framework-internal queries.

**Related Rules/Skills**: Octane deployment considerations

---
