# Decision Trees: Prune Command

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Soft Deletes & Pruning |
| Knowledge Unit | Prune Command |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Scheduling strategy | Primary |
| 2 | Model discovery vs explicit --model | Architecture |
| 3 | Pretend mode and monitoring | Architecture |

---

## Decision 1: Scheduling Strategy

### Context
The `model:prune` command must be scheduled via `Kernel::schedule()`. Frequency, overlap prevention, output handling, and failure alerts determine whether the prune runs reliably.

### Criteria
- How often should pruning run (daily, hourly, weekly)?
- Do different models need different pruning frequencies?
- How long does a prune run typically take?
- Is prune output captured for audit?

### Decision Tree
```
How often should pruning run?
├── Daily → Schedule with ->daily() or ->dailyAt('02:00')
│   └── Standard for most prunable models
├── Hourly → Schedule with ->hourly()
│   └── High-volume ephemeral data (sessions, logs)
└── Weekly → Schedule with ->weekly()
    └── Low-volume, longer retention (90-day pruning)
```
```
Do different models need different frequencies?
├── YES → Multiple schedule entries with --model flags
│   └── Hourly: SessionLog, Notification
│   └── Daily: ArchivedPost, SoftDeletedUser
│   └── Weekly: AuditLog (retain 1 year)
└── NO → Single schedule entry for all prunable models
```
```
Could the prune run overlap with a previous run?
├── YES (takes longer than schedule interval) → withoutOverlapping()
│   └── MANDATORY — prevents concurrent prunes
│   └── Example: prune takes 2 hours but runs hourly
└── NO → withoutOverlapping() still recommended as safety net
```
```
Should prune output be captured?
├── YES → sendOutputTo(storage_path('logs/prune.log'))
│   └── Append to log file for audit trail
└── NO → Output goes to stdout (lost in scheduler)
```
```
Should failures trigger alerts?
├── YES → onFailure() handler
│   └── Log error, send notification (Slack, email, PagerDuty)
└── NO → Unmonitored failures

### Rationale
Scheduling strategy determines whether pruning is reliable, observable, and non-disruptive. `withoutOverlapping()` prevents the most common scheduling issue — concurrent prunes competing for the same table locks. Per-model frequencies optimize resource usage (ephemeral data pruned more often, business data pruned less). Output capture and failure alerts provide observability.

### Recommended Default
Schedule `model:prune` daily at off-peak hours with `->dailyAt('02:00')`, `->withoutOverlapping()`, `->sendOutputTo()` and `->onFailure()`. If models have different retention policies, create separate schedule entries with `--model` flags at appropriate frequencies.

### Risks
- Overlapping prunes: row contention, deadlocks, duplicate work
- No output capture: prune activity invisible, no audit trail
- No failure handling: prune fails silently for days/weeks
- Pruning during peak hours: contention with user traffic
- Too-frequent pruning: unnecessary resource usage

### Related Rules/Skills
- withoutOverlapping (05-rules.md)
- Per-Model Frequency (05-rules.md)
- Output Capture and Alerting (05-rules.md)

---

## Decision 2: Model Discovery vs Explicit --model

### Context
`model:prune` without `--model` discovers prunable models by scanning `app/Models` for trait usage. The `--model` flag specifies exact classes. Discovery is convenient but has overhead and risks.

### Criteria
- Are all prunable models in `app/Models`?
- Is discovery overhead (100-500ms per invocation) acceptable?
- Could a model accidentally become prunable (trait added but prunable() not intended)?
- Is the production cron pinned to specific models?

### Decision Tree
```
Are all prunable models in the default discovery path (app/Models)?
├── YES → Discovery mode works
│   └── Still consider --model for production
└── NO → Must use --model or configure custom discovery paths
    └── Configure prune.discovery in config/prune.php
```
```
Is the production cron stable (models don't change daily)?
├── YES → Use --model with explicit class list
│   └── Faster (no discovery overhead)
│   └── Safer (only specified models pruned)
└── NO (frequent model additions)
    └── Discovery mode: auto-picks up new prunable models
    └── Risk: new model with buggy prunable() auto-executes
```
```
Could a model accidentally become prunable?
├── YES → Prefer --model (discovery would auto-include it)
│   └── Example: developer adds Prunable trait to test model
└── NO → Discovery is safe
```
```
Is discovery overhead acceptable?
├── YES (<500ms overhead, running daily) → Discovery is fine
└── NO (running hourly, many models) → --model for performance
```

### Rationale
Discovery is convenient during development but risky in production — any model with `Prunable`/`MassPrunable` trait is automatically pruned. `--model` is explicit, faster, and safer. The production cron should typically use `--model` with a curated list of prunable classes.

### Recommended Default
Use discovery mode in development for convenience. Use `--model` with explicit class names in the production scheduler. Periodically review the `--model` list when new prunable models are added.

### Risks
- Discovery in production: new prunable model with untested prunable() auto-executes
- --model without all prunable classes: some models never pruned
- Custom discovery path not configured: models outside app/Models never discovered
- Discovery overhead on hourly schedule: unnecessary filesystem scanning

### Related Rules/Skills
- --model in Production (05-rules.md)
- Discovery in Development (05-rules.md)
- Review --model List Periodically (05-rules.md)

---

## Decision 3: Pretend Mode and Monitoring

### Context
`--pretend` simulates pruning without deleting records. It is the primary safety mechanism before enabling pruning in production. Monitoring ensures prune failures are detected and addressed promptly.

### Criteria
- Has `--pretend` been run before enabling pruning?
- Are prune results captured and monitored?
- Are prune failures alerted?
- Is there a rollback plan for incorrect pruning?

### Decision Tree
```
Has --pretend been run in production before enabling the schedule?
├── YES → Verify the output matches expectations
│   └── Check: correct models, correct record counts, no active records
│   └── If not matching → fix prunable() and re-run --pretend
└── NO → RUN --pretend BEFORE enabling pruning in production
    └── Production dry-run is mandatory safety step
```
```
Are prune results captured and reviewable?
├── YES → sendOutputTo() + log file review
│   └── Review daily: records pruned, errors, duration
└── NO → Prune is invisible — add output capture
```
```
Are prune failures alerted?
├── YES → onFailure() handler + notification
│   └── Critical: cascade failures may cause table bloat
└── NO → Add alerting — silent failures are unacceptable
```
```
Is there a rollback plan if prunable() deletes wrong records?
├── YES → Backup + restore procedure documented
│   └── Table-level backup before enabling production pruning
└── NO → Backup all prunable tables before first prune run
```
```
Is the prune duration monitored?
├── YES → Log start/end time; alert if duration exceeds threshold
│   └── Increasing duration may indicate missing index or growing dataset
└── NO → Add duration monitoring

### Rationale
`--pretend` is the critical safety gate — it confirms the `prunable()` query is correct before any real deletes happen. Combined with output capture and failure alerting, it provides confidence that pruning runs correctly and failures are caught quickly.

### Recommended Default
Always run `model:prune --pretend` in production before enabling the schedule. Review the output to verify correct models and record counts. Capture all prune output to a log file. Set up `onFailure()` alerting. Back up prunable tables before the first production run.

### Risks
- --pretend not run: wrong records deleted on first real run
- No output capture: prune activity invisible
- No failure alert: prune silently fails for days/weeks
- No backup: incorrect deletion is unrecoverable
- Duration trending up: performance degradation undetected until prune times out

### Related Rules/Skills
- --pretend Before First Run (05-rules.md)
- Output Capture and Alerting (05-rules.md)
- Backup Before Enablement (05-rules.md)
