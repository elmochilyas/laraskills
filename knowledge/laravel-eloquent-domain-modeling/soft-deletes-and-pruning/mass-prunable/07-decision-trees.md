# Decision Trees: Mass Prunable

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Soft Deletes & Pruning |
| Knowledge Unit | Mass Prunable |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | MassPrunable vs Prunable selection | Primary |
| 2 | Bulk DELETE batching strategy | Architecture |
| 3 | SoftDeletes interaction with MassPrunable | Architecture |

---

## Decision 1: MassPrunable vs Prunable Selection

### Context
`MassPrunable` and `Prunable` both define a `prunable()` method but differ in execution: `MassPrunable` issues a single `DELETE` query (no events/callbacks), while `Prunable` iterates per-record with callbacks.

### Criteria
- Are per-record events (`pruning()`, `pruned()`) or model lifecycle events needed?
- What is the expected volume of pruned records per run?
- Is the data ephemeral (sessions, logs) or business-critical?
- Are side effects (cache clear, archive, notifications) required on deletion?

### Decision Tree
```
Are per-record lifecycle callbacks (pruning() / pruned()) needed?
├── YES → Use Prunable (not MassPrunable)
│   └── Side effects: archival, cache, conditional skipping
└── NO → Use MassPrunable
    └── Side effects handled externally (pre-archival job, post-prune hook)
```
```
What is the typical volume of records pruned per run?
├── <1000 → Either trait works; choose based on callback needs
├── 1000-10000 → MassPrunable preferred (significantly faster)
└── >10000 → MassPrunable required (Prunable would be too slow)
```
```
Does the model's deletion need to be audited per-record?
├── YES → Prunable (pruned() callback for per-record audit)
│   └── Or: external audit before/after MassPrunable run
└── NO → MassPrunable (batch deletion, no per-record audit)
```
```
Is the data ephemeral (logs, sessions, temp data)?
├── YES → MassPrunable (ephemeral data doesn't need per-record processing)
└── NO → Consider Prunable for business-critical data

### Rationale
`MassPrunable` sacrifices event fidelity for performance. The single `DELETE` query is dramatically faster for large datasets but provides no hooks for per-record processing. The choice depends entirely on whether per-record side effects are required. If yes, `Prunable`. If no, `MassPrunable`.

### Recommended Default
Use `MassPrunable` for all ephemeral, high-volume, or side-effect-free data (sessions, logs, notifications). Use `Prunable` for business data that needs per-record archival, audit, or conditional skipping. Never use both on the same model.

### Risks
- MassPrunable when side effects needed: missing archival, audit, cache clearing
- Prunable for 50k records: extremely slow, 50k individual queries
- Switching from Prunable to MassPrunable: callbacks stop firing silently
- No external audit: data removal is invisible

### Related Rules/Skills
- MassPrunable for High Volume (05-rules.md)
- Prunable for Callbacks (05-rules.md)
- External Audit for MassPrunable (05-rules.md)

---

## Decision 2: Bulk DELETE Batching Strategy

### Context
`MassPrunable` issues a single `DELETE` statement for all matching records. Without batching, a large delete can lock the table for minutes, cause replication lag, and overflow the transaction log.

### Criteria
- How many records match the `prunable()` query?
- Is the table under concurrent write load?
- Is replication lag a concern?
- Is the prune run during off-peak hours?

### Decision Tree
```
How many records match the prunable() query?
├── <1000 → Single DELETE is safe (no batching needed)
├── 1000-100000 → Batch with LIMIT
│   └── Use ->limit(1000) in prunable() and loop externally
│   └── Or implement batched custom command
└── >100000 → MUST batch aggressively
    └── Limit to 1000-5000 per batch
    └── Consider maintenance window for very large deletes
```
```
Is the table under concurrent write load during prune?
├── YES → Aggressive batching (smaller limits, longer intervals)
│   └── Row locks from DELETE may block concurrent writes
│   └── Run during off-peak hours
└── NO → Standard batching
```
```
Is replication lag a concern?
├── YES → Smaller batches (500-1000) to limit transaction size
│   └── Large single DELETE creates one big transaction on replicas
└── NO → Standard batch size (1000-5000)
```
```
Is the prune wrapped in a manual transaction?
├── YES → Allows rollback on failure for smaller datasets
│   └── Risk: very large transactions block undo segment
└── NO → Each DELETE is auto-committed (safe but no rollback)
```

### Rationale
A single massive `DELETE` is efficient but dangerous — table locks, replication lag, and transaction log overflow. Batching with `->limit()` converts one big lock into smaller, less impactful locks. The loop `do { $deleted = Model::prunable()->limit(1000)->delete(); } while ($deleted > 0)` is the standard batched pattern.

### Recommended Default
Always batch `MassPrunable` deletes with `->limit(1000)` when the dataset could exceed 10k records. Use smaller batches (500) under concurrent write load. Run during off-peak hours. Monitor replication lag if using read replicas.

### Risks
- No batching: table locked for minutes, replication lag
- Batch too large (>5000): transaction log pressure
- Batch too small (<100): too many DELETE statements, overhead
- No off-peak scheduling: contention with user queries
- No monitoring: missed slow/long-running deletes

### Related Rules/Skills
- Batch Large Deletes (05-rules.md)
- off-Peak Scheduling (05-rules.md)
- Replication Lag Monitoring (05-rules.md)

---

## Decision 3: SoftDeletes Interaction with MassPrunable

### Context
On soft-deletable models, `MassPrunable` issues a `DELETE` directly on the table (not a `forceDelete()`). The `prunable()` query must explicitly scope to `onlyTrashed()` or `whereNotNull('deleted_at')` to avoid deleting active records.

### Criteria
- Does the model use `SoftDeletes`?
- Does the `prunable()` query include a `deleted_at` condition?
- Should the prune target all trashed records past a date?
- Could the `prunable()` query match active records?

### Decision Tree
```
Does the model use SoftDeletes?
├── YES → prunable() MUST filter on deleted_at
│   └── static::onlyTrashed()->where('deleted_at', '<=', now()->subDays(90))
│   └── Without filter: DELETES ALL ACTIVE RECORDS
└── NO → prunable() filters on created_at or other time column
    └── static::where('created_at', '<=', now()->subDays(30))
```
```
Is onlyTrashed() used in the prunable() query?
├── YES → Safe — only soft-deleted records are targeted
└── NO (e.g., where('deleted_at', '<=', ...) without NULL check)
    └── RISK: NULL deleted_at values (active records) may match
    └── MUST add: ->whereNotNull('deleted_at') or use onlyTrashed()
```
```
Does the prunable() query include a time threshold?
├── YES → Proper — only old soft-deleted records are pruned
└── NO → RISK: prunes ALL soft-deleted records immediately
    └── Add: where('deleted_at', '<=', now()->subDays(retention_period))
```
```
Is --pretend used before first production run?
├── YES → Safe — preview which records will be deleted
└── NO → RISK: may delete active records without preview
```

### Rationale
`MassPrunable` on a soft-deletable model skips `forceDelete()` entirely — it issues a raw `DELETE`. This means the `prunable()` query is the only protection against deleting active records. A missing `onlyTrashed()` or `whereNotNull('deleted_at')` in the query deletes every row that matches the time condition, including active records.

### Recommended Default
For all soft-deletable models with `MassPrunable`: `static::onlyTrashed()->where('deleted_at', '<=', now()->subDays(90))`. Always run `--pretend` before the first production run to verify the query scope. Never omit the `deleted_at` null check.

### Risks
- Missing onlyTrashed(): deletes active records permanently
- No time threshold: deletes ALL soft-deleted records at once
- No --pretend: discovers wrong query scope after deletion
- where('deleted_at', '<=', ...) without NULL check: matches active records (NULL <= date varies by DB engine)

### Related Rules/Skills
- onlyTrashed in prunable() (05-rules.md)
- Time Threshold Required (05-rules.md)
- --pretend Before First Run (05-rules.md)
