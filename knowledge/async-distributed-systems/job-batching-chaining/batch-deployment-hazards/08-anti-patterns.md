# Anti-Patterns: Batch Deployment Hazard — Callback Serialization Across Deploys

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Job Batching & Chaining |
| Knowledge Unit | K015 — Batch Deployment Hazard |
| Classification | Expert |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Inline Business Logic in Batch Callbacks | Reliability | Critical |
| 2 | Capturing `$this` or Framework Objects in `use()` | Reliability | Critical |
| 3 | Deploying Without Draining In-Flight Batches | Operations | High |
| 4 | No Post-Deploy Monitoring for Callback Failures | Observability | High |
| 5 | No CI Serialization Testing for Callbacks | Quality | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Inline Logic in Callbacks (bypasses deployment resilience) | batch-deployment-hazards, batch-callbacks | Critical |
| No Callback Deserialization Alerting | batch-deployment-hazards, batch-callbacks | High |
| Complex Captures in Callback Closures | batch-deployment-hazards, batch-callbacks | High |

---

## Anti-Pattern 1: Inline Business Logic in Batch Callbacks

### Category
Reliability — Deployment Hazard

### Description
Putting business logic directly in batch callback closures (`then()`, `catch()`, `finally()`). These closures are serialized and stored in the `options` column of `job_batches`. When code changes between dispatch and execution (due to a deploy), the deserialized closure may reference changed classes, methods, or variables — causing deserialization failure and silent callback loss.

### Why It Happens
Inline logic is convenient and keeps the callback close to the batch definition. Most teams don't realize that batch callbacks persist across deploys in serialized form. Standard jobs are re-created each dispatch and don't have this problem.

### Warning Signs
- `then()`, `catch()`, or `finally()` callbacks contain >3 lines of logic
- Callbacks perform API calls, DB writes, or complex transformations
- Post-deploy, in-flight batches complete but post-processing doesn't run
- `failed_jobs` contains entries for `BatchCallbackJob` after deploys
- Team discovers missing post-processing days after a deploy

### Why Harmful
After every deploy, in-flight batches lose their post-processing. Cleanup, notifications, status updates, and next-step dispatching silently never run. The batch appears to succeed, but the side effects are lost. The longer the batch runs, the more likely a deploy occurs mid-flight.

### Real-World Consequences
A batch processes 10,000 records with a `then()` callback generating a summary report and sending it to stakeholders. A deploy goes out during batch execution (deploys a fix for another issue). The `then()` callback was serialized with the old code. The new code renames a service class used in the callback. Deserialization fails. The report is never generated. Stakeholders don't receive the summary. Nobody notices for 3 days.

### Preferred Alternative
Use thin callbacks that only dispatch a dedicated job class. The class name string is stable across deploys.

### Refactoring Strategy
1. Identify all batches with inline callback logic
2. Extract the logic into a new job class (e.g., `GenerateBatchSummary`)
3. Replace inline logic with `dispatch(new GenerateBatchSummary(...))`
4. Pass only primitive values (IDs, strings) to the job
5. Test that the callback deserializes correctly after a simulated deploy
6. Monitor `failed_jobs` for `BatchCallbackJob` failures post-deploy

### Detection Checklist
- [ ] Inline business logic in `then()`/`catch()`/`finally()`
- [ ] Callback performs I/O or complex transformations
- [ ] Post-deploy callbacks fail silently
- [ ] No dedicated job class for post-batch work

### Related Rules/Skills/Decision Trees
- **Rule 1**: thin-callbacks-dispatch-jobs (`05-rules.md`)
- **Skill**: Make Batch Callbacks Survive Deploys (`06-skills.md`)
- **Decision**: Pre-Deploy Batch Draining Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 2: Capturing `$this` or Framework Objects in `use()`

### Category
Reliability — Serialization Bloat and Failure

### Description
Capturing `$this`, `$request`, or other large framework objects in the `use()` clause of batch callback closures. These objects have large object graphs that bloat the serialized payload and change unpredictably between deploys.

### Why It Happens
It's the path of least resistance — `use ($this, $request)` captures everything needed without extracting individual values. Developers don't think about what gets serialized.

### Warning Signs
- `use ($this, $request, $service, $model)` in callback closures
- Serialized batch callbacks stored in `options` column are >10KB
- "Serialization of 'Closure' is not allowed" errors
- Post-deploy deserialization failures with `ClassNotFoundException`
- Callback captures Eloquent model instances (massive object graph)

### Why Harmful
The entire object graph is serialized — including injected services, configuration, and database connections. The payload bloats the `job_batches.options` column. After deploys, any class in the graph that changed (renamed, removed method, new dependency) causes deserialization failure. The callback is lost.

### Real-World Consequences
A `then()` callback captures `$this` (a Laravel command class) and `$request` (a Request object with uploaded files). The serialized callback is 85KB. After a deploy that removes a deprecated package, the command class dependencies change. The callback fails to deserialize. The batch completion notification never fires. The 85KB of garbage remains in the database.

### Preferred Alternative
Extract only primitive values (strings, ints, arrays, simple DTOs) and pass them to `use ()`.

### Refactoring Strategy
1. Identify callback closures with complex captures
2. Extract needed values as primitives before the batch definition
3. Replace `use ($this, $request)` with `use ($orderId, $userEmail)`
4. If a service is needed, dispatch a dedicated job instead
5. Verify serialized callback size is <1KB
6. Test serialization/deserialization in CI

### Detection Checklist
- [ ] `$this`, `$request`, Eloquent models in `use()` clause
- [ ] Callback serialized size >10KB
- [ ] Post-deploy `ClassNotFoundException` on callback deserialization
- [ ] No primitive-only capture pattern

### Related Rules/Skills/Decision Trees
- **Rule 2**: no-complex-captures-in-callbacks (`05-rules.md`)
- **Skill**: Make Batch Callbacks Survive Deploys (`06-skills.md`)

---

## Anti-Pattern 3: Deploying Without Draining In-Flight Batches

### Category
Operations — Deployment Hazard

### Description
Deploying new code while batches are still in-flight. Even with thin callbacks, the dispatched job class may have signature changes between versions — old payloads fail to deserialize or execute against new code.

### Why It Happens
Continuous deployment culture encourages deploying frequently without manual gates. Teams don't wait for batches because they take too long or the team doesn't realize batches are in flight.

### Warning Signs
- Deploys happen at any time regardless of active batches
- Jobs from pre-deploy batches fail after deploy with deserialization errors
- Constructor signature changes on job classes cause "Too few arguments" errors
- Post-deploy alert spike for jobs that worked before deploy
- Team manually re-dispatches failed jobs after every deploy

### Why Harmful
Old batch payloads reference old code. If the job constructor or `handle()` method changed, payloads fail at runtime. Jobs that were queued before the deploy but execute after it fail permanently. The work must be re-created and re-dispatched.

### Real-World Consequences
A team deploys a change that adds a `$priority` parameter to `ProcessOrder` job constructor (from 1 param to 2). During the deploy, 50 in-flight batch jobs with old serialized payloads (1 param) try to execute. 50 immediate "Too few arguments" errors hit `failed_jobs`. The team spends 30 minutes re-dispatched failed jobs and updating the payload format.

### Preferred Alternative
Drain in-flight batches before critical deploys. Wait for all batches with changed job classes to complete.

### Refactoring Strategy
1. Identify deploys that change job class signatures or callback code
2. Before deploy: check for in-flight batches: `DB::table('job_batches')->whereNull('finished_at')->exists()`
3. Wait for completion or implement versioned job classes
4. For long-running batches: implement backward-compatible job constructors (optional params)
5. Monitor `failed_jobs` spike immediately after deploy

### Detection Checklist
- [ ] Deploys without checking for active batches
- [ ] Post-deploy job failures with "Too few arguments"
- [ ] In-flight batches with changed job class signatures
- [ ] No drain-before-deploy workflow

### Related Rules/Skills/Decision Trees
- **Rule 3**: drain-batches-before-critical-deploys (`05-rules.md`)
- **Decision**: Pre-Deploy Batch Draining Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 4: No Post-Deploy Monitoring for Callback Failures

### Category
Observability — Silent Failure

### Description
Not monitoring `failed_jobs` for `BatchCallbackJob` failures after deploys. Batch callback deserialization failures are silent — the batch appears to complete, but the callback never runs. The only signal is a `failed_jobs` entry that goes unnoticed without monitoring.

### Why It Happens
Teams monitor overall `failed_jobs` but don't distinguish batch callback failures from regular job failures. The `BatchCallbackJob` class name is internal Laravel implementation detail that most developers don't know about.

### Warning Signs
- No alert for `BatchCallbackJob` failures
- Post-deploy, batches complete but post-processing is missing
- Teams discover missing callbacks days later during manual review
- `failed_jobs` table has entries with `BatchCallbackJob` class but no one checks
- No dashboard showing callback failure rate

### Why Harmful
Every post-deploy callback failure is a silent data loss event. Cleanup, notifications, status updates — all lost without anyone knowing. The team has no signal to correlate callback failures with deploys.

### Real-World Consequences
A deploy renames a service class used in a `then()` callback. The callback deserialization fails — `BatchCallbackJob` goes to `failed_jobs`. The team doesn't have monitoring for this. Days later, a stakeholder asks "Why didn't I get the batch completion report?" The team investigates and finds the `failed_jobs` entry from 4 days ago. The window of data loss has long passed.

### Preferred Alternative
Monitor `failed_jobs` for `BatchCallbackJob` entries after every deploy. Alert on any failure.

### Refactoring Strategy
1. Add monitoring query: `DB::table('failed_jobs')->where('payload', 'like', '%BatchCallbackJob%')`
2. Create alert for any batch callback failure
3. Add dashboard panel showing callback failure rate over time
4. After every deploy: run a check for batch callback failures within the last 30 minutes
5. Investigate and re-dispatch any failed batch callbacks manually or via replay job

### Detection Checklist
- [ ] No `BatchCallbackJob` monitoring in place
- [ ] No post-deploy callback failure check
- [ ] Silent data loss from missed callbacks
- [ ] Teams unaware of `BatchCallbackJob` class name

### Related Rules/Skills/Decision Trees
- **Rule 4**: monitor-callback-failures-post-deploy (`05-rules.md`)
- **Skill**: Make Batch Callbacks Survive Deploys (`06-skills.md`)

---

## Anti-Pattern 5: No CI Serialization Testing for Callbacks

### Category
Quality — Preventable Regression

### Description
Not testing that batch callbacks serialize and deserialize correctly in CI. The `laravel/serializable-closure` library can change encoding between versions, or callback closures may reference classes that won't exist at production time — but these failures are only discovered after deploy.

### Why It Happens
Testing serialization requires understanding how Laravel's `SerializableClosure` works. Most teams don't think about testing closure serialization because closures are typically ephemeral.

### Warning Signs
- No test that serializes and unserializes batch callbacks
- A Composer update of `laravel/serializable-closure` silently breaks all in-flight callbacks
- Callbacks that work in development (single process) fail in production (separate worker)
- Teams discover serialization issues only after production deploys
- No CI step that verifies callback deserialization against production-like code

### Why Harmful
A seemingly innocuous Composer update can simultaneously break all in-flight batch callbacks across all batches. Every batch that was dispatched before the update and hasn't completed yet loses its post-processing.

### Real-World Consequences
A `composer update` pulls a new minor version of `laravel/serializable-closure` that changes internal serialization format. All 200 in-flight batches with callbacks fail to deserialize simultaneously. Post-batch processing for all 200 batches is lost. The team has no CI test that would have caught this. Recovery requires manually inspecting each batch and re-dispatching callbacks.

### Preferred Alternative
Add a CI test that serializes and unserializes batch callbacks, verifying deserialization succeeds.

### Refactoring Strategy
1. Write a CI test: serialize a representative callback, unserialize it, invoke it
2. Test with both the current code and the previous deploy's code (if available)
3. Add a deployment gate that checks callback deserialization before allowing deploy
4. Pin the `laravel/serializable-closure` version and test upgrades in CI first
5. Document the serialization format dependency in team runbooks

### Detection Checklist
- [ ] No callback serialization/deserialization test
- [ ] No CI gate for callback compatibility
- [ ] `laravel/serializable-closure` version not pinned
- [ ] Teams unaware of serialization format dependency

### Related Rules/Skills/Decision Trees
- **Rule 5**: test-callback-serialization-in-ci (`05-rules.md`)
- **Skill**: Make Batch Callbacks Survive Deploys (`06-skills.md`)
