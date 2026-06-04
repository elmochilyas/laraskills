# Decision Trees: Prunable Trait

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Soft Deletes & Pruning |
| Knowledge Unit | Prunable Trait |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Prunable vs MassPrunable selection | Primary |
| 2 | prunable() query design | Architecture |
| 3 | Pruning callback strategy | Architecture |

---

## Decision 1: Prunable vs MassPrunable Selection

### Context
Both `Prunable` and `MassPrunable` provide automated pruning via the `model:prune` command. `Prunable` iterates per-record with lifecycle callbacks. `MassPrunable` issues a single `DELETE` — faster but no callbacks.

### Criteria
- Are per-record lifecycle events or callbacks needed (`pruning()`, `pruned()`)?
- How many records are typically pruned in one run?
- Is archival or side-effect processing needed per record?
- Is raw speed more important than event fidelity?

### Decision Tree
```
Are per-record callbacks (pruning() / pruned()) needed?
├── YES → Prunable trait
│   └── Use pruning() to skip individual records
│   └── Use pruned() for archiving, logging, cache clearing
└── NO → MassPrunable trait
    └── Single DELETE query, no callbacks, faster
```
```
How many records are typically pruned per run?
├── <1000 → Prunable (acceptable performance, events fire)
├── 1000-10000 → Either
│   ├── Callbacks needed → Prunable with chunking
│   └── No callbacks → MassPrunable (faster)
└── >10000 → MassPrunable (single query vs 10k individual deletes)
    └── If callbacks are needed: batch with ->limit() and queue jobs
```
```
Does the model have SoftDeletes AND Prunable needs?
├── YES → Both work; Prunable calls forceDelete, MassPrunable issues DELETE directly
└── NO → Trait selection unaffected by SoftDeletes presence
```
```
Could Prunable and MassPrunable both be needed for the same model?
├── YES → WRONG — cannot use both (trait method collision on prune())
└── NO → Single trait selection per model

### Rationale
`Prunable` and `MassPrunable` share the same `prunable()` method signature and are drop-in replacements — change the trait import to switch. The sole differentiator is whether per-record callbacks are needed. If yes, `Prunable`. If no, `MassPrunable` for performance. Never use both on the same model.

### Recommended Default
Use `Prunable` for models that need per-record archiving, conditional skipping, or logging during prune. Use `MassPrunable` for high-volume ephemeral data (sessions, logs, notifications) where side effects are handled at a higher level.

### Risks
- Prunable for 100k records: 100k individual deletes, very slow
- MassPrunable when callbacks needed: missing side effects
- Both traits on same model: method collision on prune()
- Switching traits without testing: different behavior (callbacks stop firing)

### Related Rules/Skills
- Prunable for Callbacks (05-rules.md)
- MassPrunable for High Volume (05-rules.md)
- Single Trait Per Model (05-rules.md)

---

## Decision 2: prunable() Query Design

### Context
The `prunable()` method returns a `Builder` defining which records to prune. It runs on every prune invocation. A poorly designed query (no index, wrong conditions) can delete wrong records or cause performance issues.

### Criteria
- Is the query indexed on the filtered columns?
- Does the query correctly scope to only deletable records?
- Does the query include a time-based condition?
- Is the query selective enough to avoid full table scans?

### Decision Tree
```
Does prunable() filter on an indexed column?
├── YES → Safe — index will be used
│   └── Typical index: deleted_at, created_at, or (status, created_at)
└── NO → MUST add index before deploying prune schedule
    └── Unindexed query = full table scan on every prune run
```
```
Does the query correctly scope to eligible records only?
├── YES — clear, tested conditions
│   └── Example: onlyTrashed()->where('deleted_at', '<=', now()->subDays(90))
└── NO → RISK: may delete active records
    └── If using SoftDeletes: MUST include onlyTrashed() or whereNotNull('deleted_at')
    └── If not using SoftDeletes: MUST include time-based condition
```
```
Is the query selective enough?
├── YES → Returns only records that need pruning
└── NO → Returns too many records (e.g., no time limit)
    └── Add time-based condition: ->where('deleted_at', '<=', now()->subX())
```
```
Does the query use cursor() efficiently?
├── YES → Uses cursor() automatically via Prunable's prune()
└── NO → Avoid: ->get() inside prunable() would load all records into memory
```
```
Is the query tested with realistic data volumes?
├── YES → Verified in CI/staging
└── NO → Risk: fast in dev (100 rows), slow in prod (1M rows)

### Rationale
The `prunable()` query is the sole gatekeeper for which records get deleted. An incorrect condition can delete active records. An unindexed query causes full table scans on every schedule run. A non-selective query (no time limit) can attempt to prune all records at once.

### Recommended Default
For soft-deletable models: `static::onlyTrashed()->where('deleted_at', '<=', now()->subDays(90))`. For non-soft-deletable: `static::where('created_at', '<=', now()->subDays(30))`. Index `deleted_at` or `created_at`. Test with realistic data volume before production deployment.

### Risks
- Missing onlyTrashed() on soft-deletable model: may delete active records
- No time condition: attempts to prune all matching records at once
- No index: full table scan on every prune schedule
- Wrong column (deleted_at vs created_at): wrong records targeted

### Related Rules/Skills
- Index prunable() Columns (05-rules.md)
- Test prunable() in CI (05-rules.md)
- Selective prunable() Conditions (05-rules.md)
- --pretend Before First Run (05-rules.md)

---

## Decision 3: Pruning Callback Strategy

### Context
`pruning()` is called before each record deletion (return `false` to skip). `pruned()` is called after successful deletion. These callbacks enable conditional skipping, archival, logging, and cache invalidation.

### Criteria
- Should some matching records be skipped based on runtime conditions?
- Should deleted records be archived before removal?
- Should cache be cleared after deletion?
- Should deletions be logged?

### Decision Tree
```
Should some matching records be conditionally skipped?
├── YES → Implement pruning() callback
│   └── Return false to skip the record
│   └── Example: skip pinned posts even if past threshold
└── NO → No pruning() callback needed
```
```
Should records be archived before deletion?
├── YES → Implement pruned() callback
│   └── Copy to archive table, cold storage, or external service
│   └── Keep pruned() lightweight — it blocks the prune loop
└── NO → No archival needed
```
```
Should cache, search index, or external state be updated?
├── YES → pruned() callback for side effects
│   └── Clear cache, remove from search index, invalidate CDN
└── NO → No side effects beyond deletion
```
```
Is the callback doing I/O (API calls, file storage)?
├── YES → Risk: slows down the entire prune significantly
│   └── Consider queuing the side effect instead of blocking
│   └── Or use pruned() to dispatch a queued job
└── NO → Lightweight, in-process callback
```
```
Could the pruning() callback throw an exception?
├── YES → Wrap in try/catch; exception stops the entire prune
│   └── Log and skip the record instead of throwing
└── NO → Safe callback

### Rationale
`pruning()` is the safety net for records that match the `prunable()` query but shouldn't be deleted. `pruned()` is the hook for side effects. Both callbacks block the prune loop — heavy I/O in callbacks makes pruning hours-long. Exception safety is critical: an uncaught exception in `pruning()` or `pruned()` stops the entire prune operation.

### Recommended Default
Implement `pruning()` only when specific records need conditional exclusion. Implement `pruned()` for archival, logging, or cache clearing. Keep both callbacks lightweight and exception-safe. For heavy I/O, dispatch a queued job from `pruned()` instead of blocking.

### Risks
- Heavy pruned() callback: prune runs for hours
- Exception in callback: entire prune stops
- pruning() without clear condition: returns null (continue) when false was intended
- No logging in pruned(): prune activity is invisible
- Cache not cleared after prune: stale data served

### Related Rules/Skills
- pruning() for Conditional Skip (05-rules.md)
- pruned() for Side Effects (05-rules.md)
- Lightweight Callbacks (05-rules.md)
- Exception Safety (05-rules.md)
