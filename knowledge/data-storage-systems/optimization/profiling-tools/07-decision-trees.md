# Decision Trees for 4-27 Profiling Tools

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-27 |
| Title | Profiling Tools |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: Telescope vs Debugbar vs Clockwork selection
- D2: Telescope production deployment strategy
- D3: Tool overhead management

## Architecture-Level Decision Trees

### D1: Telescope vs Debugbar vs Clockwork selection

**Decision Context**: Choose the profiling tool based on environment and use case.

**Criteria**:
- Environment
- Feature requirements
- Overhead tolerance

**Tree**:
```
Which environment?
├── Local development
│   ├── Need full request dump? → Telescope (local only)
│   └── Need quick browser overlay? → Debugbar
├── Staging
│   └── Telescope (store to DB, full insight)
└── Production
    ├── Need detailed per-request data for specific users?
    │   └── Telescope (gated, whitelist users)
    └── Need lightweight monitoring only?
        └── Clockwork or custom logging
```

**Rationale**: Debugbar is zero-config for local dev. Telescope provides depth but needs storage. Production needs careful gating.

**Default**: Debugbar in local, Telescope in staging, clockwork in production if needed.

**Risks**: Debugbar in production exposes config. Telescope without pruning fills storage.

**Related Rules/Skills**: 4-25 (lazy loading detection)

---

### D2: Telescope production deployment strategy

**Decision Context**: Deploy Telescope in production safely.

**Criteria**:
- Storage capacity
- User privacy
- Performance impact

**Tree**:
```
Is Telescope strictly necessary in production?
├── Yes
│   └── Configure:
│       1. Gate: only whitelisted users can view
│       2. Pruning: schedule telescope:prune daily
│       3. Watchers: disable unnecessary watchers
│       4. Storage: separate database or faster disk
└── No → Telescope in staging only
```

**Rationale**: Telescope stores every request, which fills storage quickly. Gating and pruning are mandatory for production.

**Default**: Telescope disabled in production unless specific debugging need arises.

**Risks**: Telescope's database can grow by hundreds of MB per day under moderate traffic.

**Related Rules/Skills**: 4-26 (query log analysis)

---

### D3: Tool overhead management

**Decision Context**: Manage profiling overhead in development and production.

**Criteria**:
- Request volume
- Tool overhead
- Developer experience

**Tree**:
```
Is this a high-traffic environment (> 1000 req/s)?
├── Yes → Avoid profiling tools in production
│   Use server-side monitoring (slow query log, APM) instead
└── No → Acceptable to run lightweight profiling
```

**Rationale**: Profiling tools add overhead per request. At scale, this overhead becomes significant.

**Default**: No profiling tools in high-traffic production. Use database logs and APM.

**Risks**: Without profiling in production, N+1 and slow queries may go undetected.

**Related Rules/Skills**: 4-30 (production optimization workflow)

---
