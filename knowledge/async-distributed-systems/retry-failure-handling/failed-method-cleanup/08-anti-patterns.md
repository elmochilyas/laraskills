# Anti-Patterns: `failed()` Method on Jobs

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Retry & Failure Handling |
| Knowledge Unit | K021 — failed() Method |
| Classification | Foundation |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Complex I/O in failed() That Can Throw | Reliability | High |
| 2 | Non-Idempotent failed() Implementation | Reliability | Medium |
| 3 | Using failed() for Cross-Cutting Concerns | Design | Medium |
| 4 | Not Calling parent::failed() in Subclasses | Reliability | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No failed() Method on Any Job Class | failed-method-cleanup, dead-letter-queue-pattern | High |
| try/catch in handle() Replacing failed() Entirely | failed-method-cleanup, failure-taxonomy | Medium |

---

## Anti-Pattern 1: Complex I/O in failed() That Can Throw

### Category
Reliability — Silent Failure

### Description
Performing complex I/O (API calls, database writes, file operations) in the `failed()` method without error handling. If `failed()` throws an exception, the framework silently catches and logs it — the cleanup is lost without any alert.

### Why It Happens
Developers treat `failed()` as a normal method where errors propagate naturally. They don't realize that `failed()` errors are silently absorbed — the job remains in `failed_jobs`, but the cleanup never completed.

### Warning Signs
- `failed()` makes HTTP calls, API requests, or external service calls
- `failed()` performs complex multi-step operations
- No try/catch wrapping inside `failed()`
- Cleanup is lost when external services are unavailable
- Logs show "error in failed()" messages but no one notices

### Why Harmful
The cleanup that `failed()` is supposed to perform silently fails. Resources (locks, temp files, API reservations) are never released. The job is in `failed_jobs` and appears to have been handled — but its side effects remain.

### Real-World Consequences
A `failed()` method calls an API to roll back a reservation: `Http::post('/api/rollback', [...])`. The API is temporarily down (500 error). The `failed()` method throws an exception, which is silently caught by the framework. The rollback never happens. The reservation remains active. The job is in `failed_jobs` — the team sees the failure and assumes cleanup ran. The reservation eventually times out after 24 hours, but in the meantime, the resource is blocked.

### Preferred Alternative
Keep `failed()` lightweight (log + simple flag set). Dispatch I/O to a queued notification job.

### Refactoring Strategy
1. Move HTTP calls and complex operations out of `failed()` into a dispatched job
2. Keep `failed()` for: logging, status changes, simple releases
3. If I/O must be in `failed()`: wrap in try/catch and log the failure
4. Monitor for exceptions thrown from `failed()` methods
5. Verify cleanup is not dependent on `failed()` completing successfully

### Detection Checklist
- [ ] `failed()` makes HTTP calls or complex I/O
- [ ] No try/catch inside `failed()`
- [ ] Cleanup silently fails when downstream services are unavailable
- [ ] Exceptions from `failed()` are invisible

### Related Rules/Skills/Decision Trees
- **Rule 1**: keep-failed-lightweight (`05-rules.md`)
- **Skill**: Implement failed() Method (`06-skills.md`)

---

## Anti-Pattern 2: Non-Idempotent failed() Implementation

### Category
Reliability — Double Cleanup Errors

### Description
Implementing `failed()` without idempotency guards. The `failed()` method may be called multiple times for the same job — due to worker crash after storage, retry from `failed_jobs`, or framework edge cases. Non-idempotent cleanup (deleting a file, decrementing a counter) throws on second execution.

### Why It Happens
Developers assume `failed()` runs exactly once per job. The framework doesn't guarantee this — a retried job that fails again calls `failed()` again.

### Warning Signs
- `failed()` deletes files without `file_exists` check
- `failed()` decrements counters without checking they were incremented
- `failed()` calls external API "undo" operations twice
- Errors from `failed()` on retried jobs
- "File not found" or "Record not found" errors in `failed()` logs

### Why Harmful
The second call to `failed()` throws an exception that is silently caught. The error adds log noise and may mask the original failure reason. The cleanup operation may partially fail (file deleted on first call, "file not found" on second).

### Real-World Consequences
A `failed()` method deletes a temporary file: `unlink('/tmp/'.$this->fileId)`. The job fails, `failed()` runs, file deleted. The operator retries the job. The job fails again (same condition). `failed()` runs again — `unlink()` throws "File not found." The exception is silently logged. The operator sees "failed again" but doesn't check the `failed()` logs. The original reason (permanent error) is masked by the `failed()` exception noise.

### Preferred Alternative
Make `failed()` idempotent with guards: `if (file_exists(...))`, `if (!$released)`, `if (!$refunded)`.

### Refactoring Strategy
1. Identify non-idempotent operations in all `failed()` methods
2. Add guards: `if (file_exists($path)) { unlink($path); }`
3. Use status flags: `$this->cleanupDone = true` and check before repeating
4. For DB operations: use conditional updates (e.g., `where('status', 'processing')`)
5. Test with double invocation of `failed()` to verify idempotency

### Detection Checklist
- [ ] `failed()` performs non-idempotent operations
- [ ] No guards before destructive operations
- [ ] Errors on second `failed()` invocation
- [ ] `failed()` exceptions add log noise

### Related Rules/Skills/Decision Trees
- **Rule 2**: make-failed-idempotent (`05-rules.md`)
- **Skill**: Implement failed() Method (`06-skills.md`)

---

## Anti-Pattern 3: Using failed() for Cross-Cutting Concerns

### Category
Design — Duplicated Code

### Description
Implementing global failure monitoring (logging, metrics, alerting) in each job's `failed()` method instead of using the `Queue::failing` event. This duplicates identical code across every job class — one job class forgets the monitoring, creating a blind spot.

### Why It Happens
Developers reach for `failed()` first because it's part of the job class. The `Queue::failing` event requires registering a separate listener, which feels like extra setup.

### Warning Signs
- Identical logging code in `failed()` across multiple job classes
- Metrics counter incremented in each `failed()` individually
- Adding a new job requires copying the same failure monitoring code
- One job class doesn't have the monitoring code (failure blind spot)
- `Queue::failing` listener is empty or not registered

### Why Harmful
Identical monitoring logic is duplicated across N job classes. When the logging format changes, all N must be updated. When a new job class is added, the developer must remember to include the monitoring code. One forgotten class creates a monitoring gap.

### Real-World Consequences
A team has 20 job classes. Each has the same 3 lines in `failed()`: a log statement, a metrics increment, and a Slack notification. A new developer creates job class #21 and copies the pattern from the simplest job — but that job was created before the metrics line was added. Job #21 has no metrics. The team notices that failure rates for job #21 are missing from the dashboard for 3 months.

### Preferred Alternative
Use `Queue::failing` event for cross-cutting concerns (logging, metrics, alerting). Use `failed()` only for job-specific cleanup.

### Refactoring Strategy
1. Register `Queue::failing` listener for global monitoring (logging, metrics, Slack)
2. Remove duplicated monitoring code from each `failed()` method
3. Keep job-specific cleanup in `failed()` (resource release, compensation)
4. Verify all job types appear in global failure monitoring
5. Add a test that ensures `Queue::failing` coverage includes all job classes

### Detection Checklist
- [ ] Identical monitoring code in `failed()` across jobs
- [ ] No `Queue::failing` listener registered
- [ ] New jobs require copying monitoring boilerplate
- [ ] Some jobs have monitoring gaps

### Related Rules/Skills/Decision Trees
- **Rule 3**: use-event-for-global-failed (`05-rules.md`)
- **Decision**: Global vs Per-Job Failure Handling (`07-decision-trees.md`)

---

## Anti-Pattern 4: Not Calling parent::failed() in Subclasses

### Category
Reliability — Missing Base Cleanup

### Description
Overriding `failed()` in a subclass job without calling `parent::failed($e)`. The base class may define essential cleanup logic (releasing locks, logging, dispatching DLQ) — skipping the parent call leaves that cleanup undone.

### Why It Happens
Developers override `failed()` to add specific logic for the subclass but forget to call the parent. The inheritance pattern is standard OOP, but it's easily overlooked when `failed()` is added after the initial implementation.

### Warning Signs
- Subclass job overrides `failed()` without calling `parent::failed()`
- Base class `failed()` has cleanup logic
- Base class cleanup doesn't run when subclass jobs fail
- Team is surprised that "base cleanup" was skipped for subclasses
- No coding standard requiring `parent::failed()` in overrides

### Why Harmful
Base class cleanup (releasing locks, deleting temp files, dispatching to DLQ) is silently skipped. Resources leak until manual intervention. If the base class logs failures, those logs are missing for subclass failures.

### Real-World Consequences
A base class `BaseExportJob` has `failed()` that releases a file lock: `Lock::release('export_'.$this->exportId)`. Subclass `CsvExportJob` overrides `failed()` to add specific cleanup but doesn't call `parent::failed()`. When `CsvExportJob` fails, the file lock is never released. The next export waits indefinitely for the lock. The team spends hours debugging "why is the export queue stuck" before discovering the unreleased lock.

### Preferred Alternative
Always call `parent::failed($e)` when overriding `failed()` in subclass jobs.

### Refactoring Strategy
1. Review all subclass job classes that override `failed()`
2. Add `parent::failed($e)` as the first line of the override
3. Consider using a final method pattern in the base class that calls a hook
4. Add a coding standard requiring parent call in overrides
5. Test that base cleanup runs when subclass fails

### Detection Checklist
- [ ] Subclass overrides `failed()` without `parent::failed()` call
- [ ] Base class cleanup doesn't run for subclass failures
- [ ] Resource leaks from missing parent calls
- [ ] No coding standard for parent::failed()

### Related Rules/Skills/Decision Trees
- **Rule 4**: call-parent-failed-in-subclasses (`05-rules.md`)
