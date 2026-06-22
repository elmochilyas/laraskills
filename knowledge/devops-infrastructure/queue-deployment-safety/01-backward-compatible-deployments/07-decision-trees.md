# Decision Trees for Backward-Compatible Deployments

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | DevOps & Infrastructure |
| Subdomain | Queue Deployment Safety |
| Knowledge Unit | Backward-Compatible Deployments with Queued Jobs |
| Related KUs | Queue Restart & Horizon Verification, Queue Deployment Safety, Database Migration Strategies |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-BCD-001 | Is this change safe to deploy immediately or does it need a transition period? | P0 |
| DT-BCD-002 | Should this job serialize a model, an ID, or a DTO? | P0 |
| DT-BCD-003 | How many deployment phases does this schema change require? | P1 |
| DT-BCD-004 | Is the queue ready for the cleanup (Phase 3) deploy? | P0 |

---

## DT-BCD-001: Is This Change Safe to Deploy Immediately or Does It Need a Transition Period?

### Decision Context
Some changes to job classes and database schemas are safe to deploy immediately — they don't break old serialized job payloads. Others require a phased transition to avoid deserialization failures. The decision tree classifies each change.

### Decision Criteria
- Does the change rename a class that may have instances in the queue?
- Does the change add or remove a constructor parameter?
- Does the change drop or rename a database column that jobs reference?
- Does the change add a nullable column or an optional parameter with a default?

### Decision Tree

```
Does the change rename a class with queued instances?
├── YES → UNSAFE. Needs transition alias: class OldName extends NewName {}
├── NO → Does the change remove or rename a constructor parameter?
    ├── YES → UNSAFE. Needs phased transition: add new param as optional, deprecate old.
    ├── NO → Does the change drop or rename a database column that jobs reference?
        ├── YES → UNSAFE. Needs two-deploy phasing: add nullable in N, drop in N+1.
        ├── NO → Does the change add a nullable column?
            ├── YES → SAFE. Old code ignores the new column.
            ├── NO → Does the change add an optional constructor parameter with a default?
                ├── YES → SAFE. Old payloads without the param get the default.
                └── NO → Does the change modify handle() logic only?
                    ├── YES → SAFE. Serialization only stores properties, not method logic.
                    └── NO → Review the specific change against the safe/unsafe table.
```

### Rationale
Serialization stores the class name and constructor properties. Changes that affect the class name, constructor signature, or referenced database columns break old serialized payloads. Changes that add (without removing) are safe because old payloads simply ignore the additions.

### Recommended Default
**When in doubt, treat the change as unsafe and plan a transition period.** The cost of a transition alias or a phased deploy is minimal; the cost of a broken deployment is significant.

### Risks Of Wrong Choice
- **Treating unsafe as safe**: Deserialization failures. Jobs permanently lost. Billing webhooks unrecoverable.
- **Treating safe as unsafe**: Unnecessary complexity. One extra deploy cycle. Negligible cost.

### Related Rules
- Never Rename a Job Class Without a Transition Alias

---

## DT-BCD-002: Should This Job Serialize a Model, an ID, or a DTO?

### Decision Context
Serializing full Eloquent models in job constructors creates fragility — any model schema change breaks existing queued jobs. Serializing IDs and re-fetching in `handle()` eliminates this risk. DTOs provide a middle ground for when specific attributes are needed without re-fetching.

### Decision Criteria
- Does the job need the model's state at dispatch time (snapshot semantics)?
- Is the model's schema likely to change in the future?
- Does the job need only a few attributes from the model?
- Is the model potentially deleted between dispatch and processing?

### Decision Tree

```
Does the job need the model's state as it was at dispatch time (snapshot)?
├── YES → Serialize a DTO with the specific attributes needed: $order->only(['id', 'status', 'total'])
│   └── Do not serialize the full Eloquent model — only the specific attributes.
├── NO → Does the job need only the model's ID to re-fetch?
    ├── YES → Serialize the ID: public readonly string $orderId
    │   └── Re-fetch in handle(): $order = Order::find($this->orderId)
    └── NO → Does the job need no model data at all (pure computation)?
        └── Serialize only the computation inputs as primitives.
```

### Rationale
Serializing IDs is the safest approach: the job re-fetches fresh data from the database, so schema changes don't break it. DTOs are used when snapshot semantics are needed (the job must see the state as it was at dispatch time). Full Eloquent models, even with `SerializesModels`, risk deserialization failures if the model's schema changes.

### Recommended Default
**Default to serializing IDs. Use DTOs only when snapshot semantics are explicitly needed. Never serialize full Eloquent models.**

### Risks Of Wrong Choice
- **Serializing full models**: Every schema change becomes a deployment risk. Column drops break queued jobs.
- **Serializing IDs when snapshot is needed**: The job sees the current state, not the state at dispatch. If the model was updated between dispatch and processing, the job processes the wrong state.

### Related Rules
- Serialize Identifiers, Not Full Eloquent Models, in Job Constructors

---

## DT-BCD-003: How Many Deployment Phases Does This Schema Change Require?

### Decision Context
Some schema changes can be deployed in a single phase (adding nullable columns). Others require two phases (column removals). Complex changes may require three phases (type changes, table splits). The decision tree determines the number of phases.

### Decision Criteria
- Is the change adding or removing a column?
- Is the change renaming a column?
- Is the change modifying a column type?
- Do queued jobs reference the column being changed?

### Decision Tree

```
Is the change adding a new column or new table?
├── YES → SINGLE PHASE. Safe to deploy immediately.
├── NO → Is the change dropping a column that jobs reference?
    ├── YES → TWO PHASES: Deploy N (add nullable + populate), Deploy N+1 (drop old).
    ├── NO → Is the change renaming a column?
        ├── YES → TWO PHASES: Deploy N (add new + dual-write), Deploy N+1 (drop old + rename).
        ├── NO → Is the change modifying a column type?
            ├── YES → TWO-THREE PHASES: Add new column, backfill, switch code, drop old.
            └── NO → Adding index/constraint. Usually single phase (non-blocking variants exist).
```

### Rationale
Column additions are safe because old code ignores new columns. Column removals are unsafe because old serialized jobs reference the old column. Renames and type changes combine both risks. Phasing ensures old jobs can always process against the current schema.

### Recommended Default
**Additions: single phase. Removals, renames, type changes: two phases minimum.** For type changes on large tables, use three phases (add new, backfill in batches, switch code, drop old).

### Risks Of Wrong Choice
- **Single phase for a column drop**: Old jobs crash on deserialization. Billing webhooks lost.
- **Two phases when one suffices**: One extra deploy cycle. Negligible cost.

### Related Rules
- Add Columns in Deploy N, Remove Columns in Deploy N+1

---

## DT-BCD-004: Is the Queue Ready for the Cleanup (Phase 3) Deploy?

### Decision Context
Before running the cleanup deploy (Phase 3) that removes transition aliases, old columns, or old code paths, the relevant queues must be empty. Time-based assumptions ("it's been 2 hours") are unreliable — a backlogged queue may still have old-format jobs pending.

### Decision Criteria
- Has the queue depth been explicitly verified as zero?
- Are there any long-running jobs that could still be processing old-format payloads?
- Has enough time passed since Phase 1 for all jobs to complete?
- Are there scheduled jobs that may dispatch old-format payloads?

### Decision Tree

```
Has the queue depth been explicitly verified as zero?
├── NO → DO NOT PROCEED with cleanup deploy. Verify first.
├── YES → Are there any long-running jobs that could still be processing?
    ├── YES → Wait for those jobs to complete. Re-verify queue depth.
    ├── NO → Are there scheduled jobs (cron) that may dispatch old-format payloads?
        ├── YES → Verify the scheduled jobs have been updated to dispatch new-format payloads.
        │   └── Wait for at least one full cron cycle after the update.
        └── NO → SAFE TO PROCEED with cleanup deploy.
```

### Rationale
The cleanup deploy removes the backward-compatibility scaffolding. If any old-format jobs remain, they fail because the scaffolding is gone. Explicit verification is the only reliable approach — time-based assumptions miss edge cases like backlogged queues and scheduled jobs.

### Recommended Default
**Always explicitly verify queue depth before cleanup deploy. Never rely on time-based assumptions.**

### Risks Of Wrong Choice
- **Cleanup deploy with non-empty queue**: Old-format jobs fail. Transition scaffolding is gone. Manual replay required.
- **Waiting too long to clean up**: Transition scaffolding accumulates as technical debt. Multiple pending cleanups make the codebase harder to understand.

### Related Rules
- Verify Queue Depth Is Zero Before Cleanup Deploy
