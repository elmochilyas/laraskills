# Anti-Patterns: Batch Callbacks

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Job Batching & Chaining |
| Knowledge Unit | K011 — Batch Callbacks |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Using `$this` Inside Callback Closures | Reliability | Critical |
| 2 | Complex Business Logic Inline in Callbacks | Performance | High |
| 3 | Relying on `finally()` in Batch-of-Chains | Reliability | Critical |
| 4 | Missing `allowFailures()` with `catch()` | Reliability | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No Post-Batch Failure Alerting | batch-callbacks, allow-failures-behavior | High |
| Callbacks Capturing Large Serialized Objects | batch-callbacks, batch-deployment-hazards | Medium |
| Progress Callbacks on High-Volume Batches | batch-callbacks, bus-batch-architecture | Medium |

---

## Anti-Pattern 1: Using `$this` Inside Callback Closures

### Category
Reliability — Serialization Failure

### Description
Using `$this` inside batch callback closures (e.g., `->then(function (Batch $batch) { $this->sendEmail(); })`). The `$this` reference serializes the entire object graph, causing serialization failures or unexpected behavior when the closure is unserialized in the worker context.

### Why It Happens
Developers write closures in batch methods the same way they write closures anywhere else in Laravel. `$this` is the most natural way to reference the current object.

### Warning Signs
- `$this` used inside `then()`, `catch()`, `finally()`, or `progress()` closures
- "Serialization of 'Closure' is not allowed" errors at batch dispatch time
- Callback receives different context than expected (wrong object state)
- Tests pass but production fails (different execution context)
- `use ($this)` in closure definition

### Why Harmful
The callback may fail at serialize time (preventing batch creation) or at deserialize time (silently failing post-batch processing). Even if serialization succeeds, the deserialized `$this` may have different state than expected.

### Real-World Consequences
A `->then()` callback uses `$this->logger->info('Batch complete')`. The `$this` serializes the entire controller or command class, including injected services. After deploy, a service referenced by `$this` changes its interface. The deserialization of the old `$this` fails, the callback never runs, and the team doesn't notice because the batch itself completed successfully.

### Preferred Alternative
Use `use ($specificVar)` with only primitive values or simple DTOs. Dispatch a job for complex work.

### Refactoring Strategy
1. Find all batch callback definitions using `$this`
2. Extract needed values as primitives before the callback definition
3. Replace `$this->method()` with `dispatch(new CompletionJob(...))` or `use ($primitiveValue)`
4. Test serialization/deserialization of callbacks in CI
5. Use `Laravel\SerializableClosure` to verify serialization in tests

### Detection Checklist
- [ ] `$this` inside callback closure body or `use()` clause
- [ ] Batch dispatch fails with serialization error
- [ ] Callback references object state that changes between contexts
- [ ] No serialization testing in CI

### Related Rules/Skills/Decision Trees
- **Rule 1**: no-dollar-this-in-callbacks (`05-rules.md`)
- **Skill**: Use Batch Callbacks for Post-Batch Processing (`06-skills.md`)
- **Decision**: Inline Callback vs Dispatch Job from Callback (`07-decision-trees.md`)

---

## Anti-Pattern 2: Complex Business Logic Inline in Callbacks

### Category
Performance — Blocked Batch Completion

### Description
Putting complex business logic (API calls, report generation, email sending) directly in batch callback closures. Callbacks run in a worker and block batch completion — slow callbacks delay the batch's `finished_at` time and cannot be retried on failure.

### Why It Happens
It's convenient to put logic inline. The callback closure is right next to the batch definition, making the flow easy to read. Developers don't think of callbacks as blocking operations.

### Warning Signs
- Callback body exceeds 5-10 lines
- Callback makes HTTP requests, database queries, or file operations
- Callback generates reports or sends emails
- Batch `finished_at` is significantly later than the last job's completion
- Callbacks fail without retry and go straight to `failed_jobs`

### Why Harmful
Slow callbacks delay the batch completion timestamp. Downstream workflows waiting for the batch to finish are delayed. If the callback fails, there's no retry mechanism — the work is lost. Monitoring shows batches as "running" long after jobs completed.

### Real-World Consequences
A `then()` callback generates a PDF report for 5,000 orders — it takes 45 seconds. During those 45 seconds, the batch is marked as "running". A downstream import workflow waits for this batch to finish before starting. The entire deployment pipeline is blocked for an extra 45 seconds per batch. The callback also makes an API call to a third-party service that occasionally times out — on those occasions, the callback exception is logged but never retried.

### Preferred Alternative
Keep callbacks thin — dispatch a dedicated job class for complex work. Jobs get retries, proper serialization, and clean testing.

### Refactoring Strategy
1. Identify callbacks with complex logic (API calls, loops, external I/O)
2. Extract the logic into a new job class
3. Replace inline logic with `dispatch(new PostBatchJob(...))`
4. Move error handling to the job class with retry configuration
5. Add monitoring for callback duration

### Detection Checklist
- [ ] Callback body exceeds 5 lines
- [ ] Callback performs I/O (API, DB, filesystem)
- [ ] Callback failure has no retry mechanism
- [ ] Batch `finished_at` lags behind job completion

### Related Rules/Skills/Decision Trees
- **Rule 2**: keep-callbacks-thin (`05-rules.md`)
- **Decision**: Inline Callback vs Dispatch Job from Callback (`07-decision-trees.md`)

---

## Anti-Pattern 3: Relying on `finally()` in Batch-of-Chains

### Category
Reliability — Callback Never Fires

### Description
Using `finally()` for post-batch processing in a batch-of-chains pattern. `finally()` requires `allJobsHaveRanExactlyOnce` — mid-chain failures leave jobs undispatched, preventing `finally()` from ever firing because undispatched jobs remain in the pending count.

### Why It Happens
Developers assume `finally()` always runs, like a `try/finally` block in regular PHP. The `finally()` name implies unconditional execution. The edge case with undispatched chain jobs is not obvious.

### Warning Signs
- `finally()` used with batch-of-chains: `Bus::batch([[$a1, $a2], [$b1, $b2]])`
- Post-batch cleanup (cache invalidation, status updates) in `finally()` never runs
- Batches with mid-chain failures don't complete `finished_at`
- Cache keys or locks remain set after batch "completes"
- `pending_jobs - failed_jobs` never reaches 0 for some batches

### Why Harmful
Cache keys, locks, and status flags remain set forever. The application believes the batch is still running when it actually terminated hours ago. Downstream operations waiting for the batch may never proceed.

### Real-World Consequences
A batch-of-chains processes order fulfillment. `finally()` clears a `lock:fulfillment` cache key to allow the next batch to start. mid-chain failure occurs on order 50 of 500 (job 1 succeeds, job 2 fails) — chain aborts, the remaining jobs in that chain are never dispatched. `finally()` never fires because `allJobsHaveRanExactlyOnce` is `false`. The cache lock remains set. All subsequent fulfillment batches wait indefinitely for the lock to clear. Production is halted until an engineer manually clears the cache key.

### Preferred Alternative
Use `then()` + `catch()` instead of `finally()` for batch-of-chains. Both are reliable — `then()` fires on all-success, `catch()` fires when failures exist.

### Refactoring Strategy
1. Replace `->finally(fn($b) => ...)` with `->then(fn($b) => successPath())->catch(fn($b, $e) => failurePath())`
2. Add watchdog for stuck batches: check `job_batches` where `finished_at IS NULL AND created_at < now() - threshold`
3. Consider replacing batch-of-chains with separate per-chain batches
4. Keep `finally()` only for flat batches (no chains inside)

### Detection Checklist
- [ ] `finally()` used with batch-of-chains pattern
- [ ] Stuck batches with `finished_at = NULL`
- [ ] Cache locks/status flags never clear
- [ ] Post-batch cleanup doesn't run when mid-chain failures occur

### Related Rules/Skills/Decision Trees
- **Rule 3**: prefer-then-catch-over-finally (`05-rules.md`)
- **Rule 4**: dont-rely-on-finally-for-chains (`05-rules.md`)
- **Decision**: then()+catch() vs finally() for Post-Batch Processing (`07-decision-trees.md`)

---

## Anti-Pattern 4: Missing `allowFailures()` with `catch()`

### Category
Reliability — Incomplete Failure Handling

### Description
Defining a `catch()` callback without also setting `allowFailures()` on the batch. Without `allowFailures()`, the first job failure cancels the entire batch — `catch()` fires, but all remaining jobs are cancelled and never execute.

### Why It Happens
Developers think `catch()` handles failures, so `allowFailures()` seems unnecessary. They don't realize that `catch()` fires regardless of `allowFailures()`, but without it, the batch is cancelled on first failure and remaining jobs never run.

### Warning Signs
- `catch()` callback defined but `allowFailures()` not called in the fluent chain
- First failure cancels the entire batch — remaining work is lost
- Developers express surprise that other jobs in the batch never ran
- `catch()` logic assumes some jobs completed, but all remaining are cancelled
- Batch with `catch()` only, no `allowFailures()`, shows high failure impact

### Why Harmful
A single job failure cancels all remaining jobs. If the batch contained 500 jobs and job #5 fails, jobs #6-500 never execute — even if they're unrelated to the failed job. The `catch()` callback makes the team think they've handled the failure, but 99% of the batch work was abandoned.

### Real-World Consequences
A batch of 1,000 email notification jobs is dispatched with a `catch()` callback that logs the error. Job #47 fails due to a malformed email address. `allowFailures()` is not set. The batch cancels. Jobs #48-1,000 never run. 953 customers never receive their notification. The `catch()` callback logs "1 job failed" — the team sees the log entry and believes the batch was handled correctly. Nobody notices the 953 missing notifications for hours.

### Preferred Alternative
Always combine `catch()` with `allowFailures()` when you want remaining jobs to continue after a failure. If any failure should stop the entire batch, use `catch()` without `allowFailures()` intentionally (not by omission).

### Refactoring Strategy
1. Identify batches with `catch()` but no `allowFailures()`
2. Determine if remaining jobs should continue after failure
3. If yes: add `->allowFailures()` before `->dispatch()`
4. If no: retain current behavior but document intent
5. Review the `catch()` callback to verify it handles partial completion correctly
6. Test with a batch that has mixed success/failure

### Detection Checklist
- [ ] `catch()` defined without `allowFailures()`
- [ ] Batch cancels on first failure — remaining jobs lost
- [ ] `catch()` callback unaware of cancelled remaining jobs
- [ ] Team expects remaining jobs to continue

### Related Rules/Skills/Decision Trees
- **Rule 3**: prefer-then-catch-over-finally (`05-rules.md`) — mentions allowFailures interaction
- **Decision**: then()+catch() vs finally() for Post-Batch Processing (`07-decision-trees.md`)
