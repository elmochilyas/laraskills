# Anti-Patterns: Ignoring Missing Models

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Retry & Failure Handling |
| Knowledge Unit | K087 — Ignoring Missing Models |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Not Using ShouldDeleteMissing for Expected Deletions | Performance | High |
| 2 | No Logging When ShouldDeleteMissing Activates | Observability | High |
| 3 | No Null Guards in handle() Despite ShouldDeleteMissing | Reliability | Medium |
| 4 | Using ShouldDeleteMissing When Missing Model Is Always a Bug | Reliability | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Jobs Exhausting Retries on Deleted Models (No Safety Valve) | ignoring-missing-models, failure-taxonomy | High |
| no Safe Missing-Model Pattern Across the Codebase (inconsistent use) | ignoring-missing-models | Medium |

---

## Anti-Pattern 1: Not Using ShouldDeleteMissing for Expected Deletions

### Category
Performance — Wasted Retries

### Description
Failing to apply `ShouldDeleteMissing` (or `deleteWhenMissingModels`) to jobs where model deletion is expected before the job can execute. Each missing-model job retries 3-10 times, failing with "call to a member function on null" on every attempt, before finally landing in `failed_jobs`.

### Why It Happens
Developers don't think about the time gap between dispatch and execution. A model can be deleted by a user or system process during that gap. The `SerializesModels` trait re-fetches by ID — if the model is gone, the property is `null`.

### Warning Signs
- Jobs with `SerializesModels` models frequently fail with "call to a member function on null"
- `failed_jobs` has many entries for the same job type with the same null error
- Model deletion is a normal business operation (users delete posts, admins delete orders)
- Operator manually retries missing-model jobs (they always fail the same way)
- Team spends time investigating "why did this job fail" only to find "model was deleted"

### Why Harmful
Each missing-model job burns `$tries - 1` retry attempts before permanent failure. Each retry wastes worker time, backoff delay, queue capacity, and log space. At scale, this significantly reduces effective worker capacity.

### Real-World Consequences
A `ProcessPost` job processes 10,000 posts. Users delete 500 posts between dispatch and processing. Each deleted post job has `$tries = 5` and `$backoff = [10, 30, 60, 120]`. Each job burns 4 retries (220 seconds of waiting) before failing. 500 jobs x 220 seconds = 110,000 seconds = 30.5 hours of wasted worker time. `failed_jobs` has 500 entries with "call to a member function on null."

### Preferred Alternative
Apply `ShouldDeleteMissing` trait to all jobs where model deletion is expected before processing.

### Refactoring Strategy
1. Identify job classes using `SerializesModels` where model deletion is a normal business process
2. Add `use ShouldDeleteMissing;` to each job class
3. Or add `public $deleteWhenMissingModels = true;`
4. Verify the trait activates by testing model deletion before job processing
5. Monitor `failed_jobs` for missing-model errors to catch remaining unprotected jobs

### Detection Checklist
- [ ] Jobs with model parameters where deletion is expected
- [ ] Frequent "call to a member function on null" failures
- [ ] No `ShouldDeleteMissing` trait applied
- [ ] Retries wasted on permanently failing missing-model jobs

### Related Rules/Skills/Decision Trees
- **Rule 1**: use-shoulddeletemissing-for-expected-deletions (`05-rules.md`)
- **Skill**: Use ShouldDeleteMissing (`06-skills.md`)
- **Decision**: Ignoring Missing Models vs Explicit Null Check (`07-decision-trees.md`)

---

## Anti-Pattern 2: No Logging When ShouldDeleteMissing Activates

### Category
Observability — Silent Deletion

### Description
Using `ShouldDeleteMissing` without logging when it activates. The trait silently deletes the job — no trace is left. A spike in missing-model jobs (indicating a race condition or pattern) goes completely undetected.

### Why It Happens
The trait "just works" — it deletes the job and moves on. Developers don't add logging because they're focused on the success path and don't think about monitoring the trait's activation.

### Warning Signs
- `ShouldDeleteMissing` applied but no logging in `failed()` or middleware
- Team doesn't know how often the trait activates
- Missing-model rate could spike without anyone noticing
- No dashboard panel for "jobs deleted due to missing model"
- Team discovers missing-model pattern only during incident investigation

### Why Harmful
A missing-model spike may indicate a race condition (jobs dispatched before model data is fully written) or a systemic deletion pattern. Without logging, the condition is invisible — 1,000 jobs can be silently deleted every day without the team knowing.

### Real-World Consequences
A code change dispatches jobs before model data is committed: `Post::create([...]); ProcessPost::dispatch($post);` — the job may process before or after the DB commit. In some edge cases, the model is deleted by another process before the job runs. `ShouldDeleteMissing` silently deletes 200 jobs/day. The team is unaware. The data processing backlog grows. Weeks later, the team investigates "why are posts not being processed" and discovers the race condition.

### Preferred Alternative
Log whenever `ShouldDeleteMissing` triggers. Track the missing-model rate as a metric.

### Refactoring Strategy
1. Add logging in `failed()`: `Log::warning('Job deleted — model missing', ['job' => static::class])`
2. Add a counter metric: `missing_model_jobs_total{job="..."}`
3. Create dashboard showing missing-model rate per job class
4. Alert if missing-model rate exceeds expected baseline
5. Investigate spikes — they may indicate race conditions or data integrity issues

### Detection Checklist
- [ ] `ShouldDeleteMissing` applied without logging
- [ ] Team doesn't know missing-model rate
- [ ] No dashboard or alert for missing models
- [ ] Silent deletion at scale

### Related Rules/Skills/Decision Trees
- **Rule 2**: log-when-shoulddeletemissing-activates (`05-rules.md`)
- **Skill**: Use ShouldDeleteMissing (`06-skills.md`)

---

## Anti-Pattern 3: No Null Guards in handle() Despite ShouldDeleteMissing

### Category
Reliability — Uncovered Re-Fetches

### Description
Relying solely on `ShouldDeleteMissing` for protection without adding null guards in `handle()`. The trait only checks at deserialization time — if the job re-fetches the model in `handle()` (e.g., `Model::findOrFail($id)`), and it's deleted between deserialization and execution, the trait doesn't help.

### Why It Happens
Developers think `ShouldDeleteMissing` covers all cases. They don't realize it only protects the initial model deserialization from `SerializesModels`.

### Warning Signs
- `ShouldDeleteMissing` applied but `handle()` uses `findOrFail()` to re-fetch models
- `handle()` crashes with `ModelNotFoundException` after deserialization succeeds
- Intermittent failures where the model exists at deserialization but is deleted by `handle()` time
- Jobs fail despite `ShouldDeleteMissing` being applied
- Team doesn't know the gap between deserialization and execution

### Why Harmful
A narrow window between deserialization (when `ShouldDeleteMissing` checks) and `handle()` execution (when the model is re-fetched) allows a race condition. The model exists at deserialization but is deleted 10ms later. The trait doesn't fire. `handle()` re-fetches with `findOrFail()` — `ModelNotFoundException` is thrown. The job fails and retries, burning retry attempts.

### Real-World Consequences
A job has `ShouldDeleteMissing` trait and a `Post` model passed in the constructor. In `handle()`, it re-fetches: `$post = Post::findOrFail($this->postId)`. The model exists at deserialization (trait doesn't fire). A user deletes the post between deserialization and the `findOrFail()` call (a 50ms window). `handle()` crashes with `ModelNotFoundException`. The job retries 3 times — each time, the model is still deleted. 3 wasted retries. The job lands in `failed_jobs`.

### Preferred Alternative
Add null guards in `handle()` even when using `ShouldDeleteMissing`. Use `find()` instead of `findOrFail()` for models that may have been deleted.

### Refactoring Strategy
1. Review `handle()` methods for `findOrFail()` calls on models that could be deleted
2. Replace `findOrFail()` with `find()` + null check
3. If model is null: `return;` (skip) or `$this->fail('Model deleted')` (alert)
4. Keep `ShouldDeleteMissing` for the deserialization-level check
5. Document the gap between deserialization and handle() execution

### Detection Checklist
- [ ] `handle()` uses `findOrFail()` for models that could be deleted
- [ ] Intermittent `ModelNotFoundException` despite `ShouldDeleteMissing`
- [ ] Race condition between deserialization and handle() execution
- [ ] No null guard in handle() for re-fetched models

### Related Rules/Skills/Decision Trees
- **Rule 3**: add-null-guards-with-shoulddeletemissing (`05-rules.md`)
- **Skill**: Use ShouldDeleteMissing (`06-skills.md`)

---

## Anti-Pattern 4: Using ShouldDeleteMissing When Missing Model Is Always a Bug

### Category
Reliability — Silenced Alerts

### Description
Applying `ShouldDeleteMissing` to jobs where a missing model is always a bug (e.g., critical data pipeline where the model should never be deleted before processing). The trait silently swallows the error — the team never knows there's a data integrity issue.

### Why It Happens
Teams apply `ShouldDeleteMissing` broadly as a "best practice" without considering whether missing models are expected or always indicate a bug.

### Warning Signs
- `ShouldDeleteMissing` applied to jobs processing critical system data (not user-generated)
- Missing model is never a normal business case
- Data processing silently stops when models are missing
- Team discovers missing models only during audit or data reconciliation
- No alerting on missing-model events

### Why Harmful
A bug in model deletion (deleting records that shouldn't be deleted) causes jobs to silently disappear. Critical data processing never completes. The missing models are discovered weeks later during data reconciliation, but by then the damage is done.

### Real-World Consequences
A `ProcessInvoice` job has `ShouldDeleteMissing`. An admin accidentally runs a bulk delete query that deletes 500 invoices that were pending processing. The jobs for these invoices silently delete themselves — `ShouldDeleteMissing` fires for each one. No alert, no trace. Two weeks later, the finance team runs a monthly report and finds 500 invoices that were created but never processed.

### Preferred Alternative
Use `ShouldDeleteMissing` only when missing models are expected (user-generated content). For system-critical data, let the job fail and alert.

### Refactoring Strategy
1. Classify jobs by model source: user-generated (expected deletion) vs system-critical (unexpected deletion)
2. Remove `ShouldDeleteMissing` from system-critical jobs
3. Add alerting on `ModelNotFoundException` for unprotected jobs
4. For system-critical jobs: implement a recovery flow rather than silent skip
5. Document the classification criteria in team knowledge base

### Detection Checklist
- [ ] `ShouldDeleteMissing` on system-critical jobs
- [ ] Missing model is always a bug in context
- [ ] Silent data loss from trait activation
- [ ] No alerting on missing models

### Related Rules/Skills/Decision Trees
- **Decision**: Ignoring Missing Models vs Explicit Null Check (`07-decision-trees.md`)
