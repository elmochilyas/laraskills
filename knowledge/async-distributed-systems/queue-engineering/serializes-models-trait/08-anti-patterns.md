# Anti-Patterns: SerializesModels Trait and Model Restoration

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering |
| Knowledge Unit | K005 — SerializesModels Trait and Model Restoration |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | No Null Guard for Restored Models | Reliability | Critical |
| 2 | Passing Models with Loaded Relations | Performance | High |
| 3 | Large Collections via SerializesModels | Performance | High |
| 4 | Expecting Pivot Data to Persist | Reliability | High |
| 5 | Modifying Restored Models Expecting Retry Persistence | Design | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Relying on dispatch-time Model State Instead of Fresh Data | serializes-models-trait, job-serialization-payload-envelope | Medium |
| No Distinction Between Model Properties and Scalar IDs | serializes-models-trait, should-queue-contract | Medium |
| SerializesModels on Jobs That Don't Need It | serializes-models-trait, job-serialization-payload-envelope | Low |

---

## Anti-Pattern 1: No Null Guard for Restored Models

### Category
Reliability — Call to Member Function on Null

### Description
Using a model property restored by `SerializesModels` without checking for null. If the model is deleted between dispatch and processing, `find()` returns null — any method call on the property crashes with "Call to a member function on null".

### Why It Happens
Developers assume the model will always exist when the job processes. In practice, models are deleted, archived, or expire between the time the job is dispatched and when it runs.

### Warning Signs
- `$this->model->someMethod()` in `handle()` without null check
- "Call to a member function on null" errors in failed_jobs
- Jobs fail intermittently with no consistent pattern
- Failed jobs reference model IDs that were deleted
- Only production systems with active data deletion see failures

### Why Harmful
The job fails with a confusing error. The retry mechanism retries the same operation (model still doesn't exist), exhausting all retries. The job ends up in `failed_jobs` with no indication that the root cause was a deleted model.

### Real-World Consequences
A `SendOrderConfirmation` job dispatches with `public Order $order`. Before the worker picks it up, an admin manually deletes the order. The job finds null, crashes with "Call to a member function on null", retries 3 times (same result), and ends up in `failed_jobs`. The customer never receives their confirmation, and the team has no idea the model was deleted.

### Preferred Alternative
Always guard against null models in `handle()`. Check `if ($this->model)` before using it.

### Refactoring Strategy
1. Add null checks before all model property usage in `handle()`
2. Log a warning when a model is null (with context)
3. Return early when the model doesn't exist
4. Consider whether the job should still do work (e.g., log it happened)
5. Add integration tests that dispatch jobs with deleted models

### Detection Checklist
- [ ] Model property used without null check in `handle()`
- [ ] "Call to a member function on null" in failed_jobs
- [ ] No graceful handling of missing models
- [ ] Retries exhaust without progress

### Related Rules/Skills/Decision Trees
- **Rule 1**: guard-against-null-models (`05-rules.md`)
- **Decision 1**: SerializesModels vs Manual ID Passing (`07-decision-trees.md`)

---

## Anti-Pattern 2: Passing Models with Loaded Relations

### Category
Performance — Cascading N+1 Deserialization

### Description
Passing Eloquent models with loaded relations (eager-loaded via `with()`) through `SerializesModels`. Each loaded relation triggers a cascading `find()` query on deserialization — a model with 3 relations makes 4 `find()` queries before `handle()` even starts.

### Why It Happens
Developers eager-load relations in the controller/command for display purposes, then pass the model (with loaded relations) to a job without considering the serialization cost.

### Warning Signs
- Model passed to job constructor after `->with(['relation1', 'relation2'])`
- Queue worker logs show multiple `find()` queries before `handle()` runs
- Deserialization time is significantly longer than `handle()` time
- Database query count spikes during queue processing
- Job execution time is dominated by deserialization overhead

### Why Harmful
Each loaded relation creates a separate `find()` query on deserialization. At scale, this adds significant database load. The job hasn't started processing yet but already made N+1 queries to the database.

### Real-World Consequences
A `GenerateInvoicePdf` job receives an `Order` model with 5 loaded relations (items, user, address, payments, shipments). On deserialization, 6 `find()` queries execute before `handle()` starts. At 1000 jobs/hour, 6,000 unnecessary queries hit the database per hour. After refactoring to pass only the order ID, deserialization makes zero queries.

### Preferred Alternative
Pass model IDs instead of models with loaded relations. Re-fetch only what's needed in `handle()`.

### Refactoring Strategy
1. Change constructor to accept `int $modelId` instead of the model
2. Remove eager loads from the dispatch call site
3. In `handle()`, fetch only the relations needed
4. Remove `SerializesModels` if models are no longer passed
5. Monitor database query count reduction

### Detection Checklist
- [ ] Models with `->with()` eager loads passed to job
- [ ] Multiple `find()` queries before `handle()` in worker logs
- [ ] Deserialization time dominates job execution
- [ ] Database query count high during queue processing

### Related Rules/Skills/Decision Trees
- **Rule 2**: avoid-models-with-loaded-relations (`05-rules.md`)
- **Decision 1**: SerializesModels vs Manual ID Passing (`07-decision-trees.md`)

---

## Anti-Pattern 3: Large Collections via SerializesModels

### Category
Performance — Massive N+1 Deserialization

### Description
Passing large collections of Eloquent models (>100 items) via `SerializesModels`. Each collection item triggers a separate `find()` query on deserialization — 1000 items = 1000 queries before `handle()` starts.

### Why It Happens
Developers pass the result of `User::all()` or similar large queries directly to jobs without considering the serialization cost of each item.

### Warning Signs
- Collection of models passed to job constructor
- Collection size >100 items
- Queue worker makes hundreds of `find()` queries per job
- Deserialization takes seconds (N+1 queries) before any logic runs
- "Too many SQL connections" errors during queue bursts
- Memory usage spikes during deserialization (all models hydrated)

### Why Harmful
Each `find()` is a separate database query. A 1000-item collection means 1000 queries before the job's business logic runs. This can cause connection pool exhaustion and significant latency.

### Real-World Consequences
An `ExportUsersReport` job receives a collection of 5000 users via `SerializesModels`. On deserialization, 5000 `find()` queries execute sequentially, taking 15 seconds. The database connection pool is exhausted, causing timeouts for other application queries. After refactoring to pass an array of user IDs and batch-fetching in `handle()`, deserialization is instant.

### Preferred Alternative
Pass collections as arrays of IDs (for collections >100 items). Batch-fetch in `handle()` using `whereIn()`.

### Refactoring Strategy
1. Extract IDs from the collection at dispatch: `$userIds = $users->pluck('id')->toArray()`
2. Pass the ID array to the job constructor
3. In `handle()`, batch-fetch: `$users = User::whereIn('id', $this->userIds)->get()`
4. Remove `SerializesModels` if no longer needed
5. Monitor deserialization time improvement

### Detection Checklist
- [ ] Collection >100 items passed via SerializesModels
- [ ] Worker logs show many `find()` queries per job
- [ ] Deserialization time visible in job profiling
- [ ] Database query count spikes with queue processing

### Related Rules/Skills/Decision Trees
- **Rule 3**: pass-ids-for-large-collections (`05-rules.md`)
- **Decision 2**: Collection Handling Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 4: Expecting Pivot Data to Persist

### Category
Reliability — Silent Data Loss

### Description
Expecting pivot attributes (from `BelongsToMany` relationships) to persist through `SerializesModels` serialization. Pivot data is NOT automatically restored during deserialization — pivot attributes silently resolve to `null`.

### Why It Happens
The pivot data is stored as a property on the intermediate model (Pivot model). `SerializesModels` serializes the related model but does not serialize the pivot data attached to it. Developers assume all model properties are preserved.

### Warning Signs
- `$role->pivot->expires_at` or similar pivot attribute access in job `handle()`
- Pivot values that are set at dispatch time are missing at processing time
- Jobs silently skip operations that depend on pivot data
- Intermittent bugs that depend on pivot data presence
- "Trying to get property of non-object" on `pivot` access

### Why Harmful
Pivot attributes resolve to `null` silently — the job continues with missing data, potentially making incorrect decisions or skipping operations that depend on pivot values.

### Real-World Consequences
A job assigns a user a role with an expiration date stored in the pivot: `$user->roles()->attach($roleId, ['expires_at' => now()->addMonth()])`. The job receives the user with the role relationship loaded. On deserialization, `$user->roles->first()->pivot->expires_at` is null. The job skips the expiration setup, and the user's role never expires — a security violation.

### Preferred Alternative
Pass pivot data explicitly as a separate constructor parameter.

### Refactoring Strategy
1. Identify all pivot data used in `handle()`
2. Extract pivot data at dispatch: `['expires_at' => $user->roles->first()->pivot->expires_at]`
3. Pass as separate constructor parameter
4. Remove pivot data access from `handle()`
5. Test that pivot values survive serialization

### Detection Checklist
- [ ] `->pivot->` accessed in job `handle()`
- [ ] Pivot values missing at processing time
- [ ] Pivot-dependent logic executes incorrectly
- [ ] No explicit pivot data passing in constructor

### Related Rules/Skills/Decision Trees
- **Rule 5**: dont-rely-on-pivot-attributes (`05-rules.md`)
- **Decision 1**: SerializesModels vs Manual ID Passing (`07-decision-trees.md`)

---

## Anti-Pattern 5: Modifying Restored Models Expecting Retry Persistence

### Category
Design — Lost Changes on Retry

### Description
Modifying a model restored by `SerializesModels` and expecting the change to persist across job retries. The payload is immutable — the serialized `ModelIdentifier` is fixed at dispatch. Retries re-fetch the original data, losing any in-memory changes.

### Why It Happens
Developers treat the restored model as a regular Eloquent model, modifying its properties and calling `save()`. They don't realize that on retry, the model is re-fetched from the database — not from the original payload.

### Warning Signs
- Model restored via `SerializesModels` is modified and `save()` is called
- On retry, the changes made in the first attempt are not visible
- Confusing behavior where jobs appear to "reset" on retry
- Model state at retry is different from state after first attempt
- Developer expects `$this->model->status = 'processing'` to persist across retries

### Why Harmful
The job may re-process the same work on retry because the in-memory changes were lost. A payment job sets `$this->order->status = 'processing'` and `save()`s — but on retry after a timeout, the status is still `pending`. The job charges the customer again.

### Real-World Consequences
A `ProcessOrderPayment` job sets `$this->order->status = 'processing'` and saves. The job times out and retries. On retry, the model is re-fetched fresh from the database — `status` is `pending` again. The job assumes payment hasn't been attempted and charges the customer twice.

### Preferred Alternative
Always re-fetch models explicitly in `handle()` using `Model::find()`. Use a separate tracking mechanism (database column, cache) to record progress.

### Refactoring Strategy
1. Replace `SerializesModels` model properties with manually passed IDs
2. In `handle()`, fetch the model: `$order = Order::find($this->orderId)`
3. Use a status column or cache flag to track processing progress
4. On retry, check the tracking flag before reprocessing
5. Store idempotency keys for sensitive operations

### Detection Checklist
- [ ] Restored model modified and saved in `handle()`
- [ ] Retries show different model state than after first attempt
- [ ] Double processing incidents
- [ ] No idempotency mechanism

### Related Rules/Skills/Decision Trees
- **Rule 4**: dont-modify-restored-models-for-retries (`05-rules.md`)
- **Decision 1**: SerializesModels vs Manual ID Passing (`07-decision-trees.md`)
