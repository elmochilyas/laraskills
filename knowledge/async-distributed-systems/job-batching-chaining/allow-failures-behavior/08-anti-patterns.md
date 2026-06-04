# Anti-Patterns: allowFailures Behavior and Callback Semantics

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Job Batching & Chaining |
| Knowledge Unit | K012 — allowFailures Behavior and Callback Semantics |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | allowFailures Without catch Callback | Reliability | Critical |
| 2 | Assuming then() Fires on Partial Failure | Design | High |
| 3 | Assuming allowFailures Prevents Chain Abort | Design | Critical |
| 4 | Using then() for Post-Batch Processing Without Failure Check | Reliability | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No Post-Batch Failure Alerting | allow-failures-behavior, batch-callbacks | High |
| Batches Without allowFailures for Independent Jobs | allow-failures-behavior, bus-batch-architecture | Critical |
| catch() Callback Without Batch State Inspection | allow-failures-behavior, batch-callbacks | Medium |

---

## Anti-Pattern 1: allowFailures Without catch Callback

### Category
Reliability — Silent Partial Failure

### Description
Adding `allowFailures()` to a batch without a `catch()` callback. Failures are silently absorbed — the batch completes but no code detects or alerts on the failures.

### Why It Happens
Developers add `allowFailures()` as a defensive measure but don't pair it with the `catch()` callback. The batch completes normally, and without checking `failedJobs`, the partial failure is invisible.

### Warning Signs
- `allowFailures()` called without `catch()` in the fluent chain
- Batch completes with failures but no alert fires
- Failed jobs count > 0 but post-batch processing treats it as success
- Monitoring shows no indication of partial batch failures
- Developers express surprise that failures weren't detected

### Why Harmful
Partial failures go completely undetected. A batch with 50% failure rate looks identical to a fully successful batch. Downstream systems receive incomplete data with no indication of a problem.

### Real-World Consequences
A data import batch processes 10,000 records with `allowFailures()` but no `catch()`. 3,000 records fail due to validation errors. The `then()` callback fires (it doesn't — `then()` only fires if failed_jobs === 0). Actually, since some jobs failed, `then()` doesn't fire, but without `catch()`, nothing fires. The system reports the import as complete. The business doesn't discover the 3,000 missing records for 2 weeks.

### Preferred Alternative
Always pair `allowFailures()` with a `catch()` callback for alerting and logging.

### Refactoring Strategy
1. Add `->catch(fn(Batch $b, Throwable $e) => ...)` to all batches using `allowFailures()`
2. Log the failed jobs count and batch ID in the catch callback
3. Send alerts for batches with significant failure rates
4. Use `finally()` for state-aware cleanup

### Detection Checklist
- [ ] `allowFailures()` without `catch()`
- [ ] Batch completes but failures are invisible
- [ ] No alerting on partial batch failure
- [ ] Downstream systems receive incomplete data

### Related Rules/Skills/Decision Trees
- **Rule 1**: always-pair-allowfailures-with-catch (`05-rules.md`)
- **Decision 1**: allowFailures() vs Default Batch Failure Behavior (`07-decision-trees.md`)

---

## Anti-Pattern 2: Assuming then() Fires on Partial Failure

### Category
Design — Incorrect Callback Semantics

### Description
Assuming `then()` fires when a batch completes with some failures. In reality, `then()` only fires when `failed_jobs === 0` — it is mutually exclusive with `catch()`. If any job failed, `catch()` fires and `then()` does not.

### Why It Happens
Developers assume "batch completed" = "then callback fires". The `then()` name suggests a completion handler, not a success handler. The mutual exclusion behavior is not obvious from the API.

### Warning Signs
- `then()` callback runs post-processing that assumes all jobs succeeded
- No `catch()` callback is defined alongside `then()`
- Post-batch processing treats partial failures as full success
- "All jobs succeeded" notification fires even when some jobs failed
- Code lacks `failedJobs` check in `finally()`

### Why Harmful
Post-batch processing assumes full success when some jobs actually failed. A notification that "import complete" fires when 30% of records failed. The downstream process proceeds with incomplete data.

### Real-World Consequences
A batch processes invoice generation for 500 customers. 50 invoices fail due to missing addresses. The `then()` callback fires a notification: "All 500 invoices generated successfully." The finance team approves the batch for sending. 50 customers never receive invoices, and the team doesn't discover the discrepancy until the next monthly reconciliation.

### Preferred Alternative
Use `then()` only for all-success paths. Use `catch()` for failure paths. Use `finally()` with a `failedJobs` check for unified post-processing.

### Refactoring Strategy
1. Add `catch()` callback alongside `then()` for failure handling
2. Move failure-aware cleanup to `finally()` with `$batch->failedJobs` check
3. Remove code from `then()` that assumes full success is the only outcome
4. Add logging with failure count in both paths

### Detection Checklist
- [ ] `then()` callback assumes no failures
- [ ] No `catch()` callback defined
- [ ] Post-processing reports 100% success when failures exist
- [ ] `finally()` not used for failure-aware cleanup

### Related Rules/Skills/Decision Trees
- **Rule 4**: no-then-on-partial-failure (`05-rules.md`)
- **Decision 1**: allowFailures() vs Default Batch Failure Behavior (`07-decision-trees.md`)

---

## Anti-Pattern 3: Assuming allowFailures Prevents Chain Abort

### Category
Design — Incorrect Scope Understanding

### Description
Assuming that `allowFailures()` on a batch prevents chain abort within a batch-of-chains. `allowFailures()` is batch-scoped — chain abort is chain-internal and unaffected by batch failure tolerance. A chain inside a batch aborts on mid-chain failure regardless of `allowFailures()`.

### Why It Happens
Developers think `allowFailures()` applies globally to all jobs in the batch, including chains. They don't realize that chain abort is an internal chain mechanism that the batch cannot override.

### Warning Signs
- Batch-of-chains pattern with `allowFailures()` expecting chains to continue after failure
- Chain jobs after a failure never run despite `allowFailures()`
- Team expresses surprise that chains abort independently of batch settings
- No monitoring on chain-specific failures within batches
- Chain completion is assumed but mid-chain failures go undetected

### Why Harmful
Remaining chain jobs silently never run. A 4-job chain with `allowFailures()` on the parent batch — job 2 fails, jobs 3 and 4 never dispatch. The parent batch sees the failure (one failed job) but the remaining chain jobs are lost without explicit detection.

### Real-World Consequences
A batch-of-chains processes orders: each chain has Job A (validate), Job B (process payment), Job C (send confirmation). Job B fails on one order due to a network timeout. With `allowFailures()` on the batch, other orders continue processing. But for that specific order, Job C (send confirmation) never runs — even if Job B was actually idempotent and would succeed on retry. The customer doesn't receive a confirmation, and the team doesn't notice.

### Preferred Alternative
Replace chains with individual flat jobs when `allowFailures()` behavior is needed across all jobs. Or implement chain-level failure handling.

### Refactoring Strategy
1. Identify batch-of-chains where chain continuation is desired after failure
2. Replace chains with individual flat jobs that handle their own sequencing
3. For genuine chain dependency: keep the chain but monitor chain-specific failures
4. Add `catch()` on the batch to detect chain-related failures

### Detection Checklist
- [ ] Batch-of-chains with `allowFailures()`
- [ ] Chain jobs after failure never execute
- [ ] Developers assume allowFailures covers chains
- [ ] No chain-specific failure monitoring

### Related Rules/Skills/Decision Trees
- **Rule 2**: no-allowfailures-for-chain-abort (`05-rules.md`)
- **Decision 1**: allowFailures() vs Default Batch Failure Behavior (`07-decision-trees.md`)

---

## Anti-Pattern 4: Using then() for Post-Batch Processing Without Failure Check

### Category
Reliability — Incomplete Data Processing

### Description
Relying solely on `then()` for post-batch processing without using `finally()` to handle partial failure scenarios. When failures exist, `then()` doesn't fire — post-processing is skipped entirely, including essential cleanup that should run regardless.

### Why It Happens
`then()` is the most intuitive callback for "batch is done" logic. Developers don't realize that it only fires on complete success and that cleanup must go in `finally()`.

### Warning Signs
- Essential cleanup code (temp file deletion, status updates) in `then()` only
- Batch with failures leaves temp files, stale locks, or incomplete state
- No `finally()` callback defined alongside `then()`
- Cleanup doesn't run when some jobs fail
- System accumulates orphaned resources after batch failures

### Why Harmful
Essential cleanup is skipped when any job fails. Temp files accumulate, database locks remain, and status updates are never applied. The system degrades over time as orphaned resources accumulate from each batch failure.

### Real-World Consequences
A batch processes image uploads. `then()` deletes the temporary upload directory and updates the batch status to "completed". When some images fail validation, `then()` never fires — the temp directory is never deleted. After 100 batch runs with failures, the server runs out of disk space from orphaned temp files.

### Preferred Alternative
Put essential cleanup in `finally()`. Use `then()` for success-only notifications. Use `finally()` with `failedJobs` check for failure-aware post-processing.

### Refactoring Strategy
1. Move cleanup code from `then()` to `finally()` (always runs)
2. Keep success notifications in `then()` (only fires on full success)
3. Add failure notifications in `catch()`
4. Check `$batch->failedJobs` in `finally()` for partial failure decisions
5. Test with a batch that has failures to verify cleanup runs

### Detection Checklist
- [ ] Cleanup code in `then()` only
- [ ] No `finally()` callback
- [ ] Orphaned resources after batch failures
- [ ] Batch status not updated when failures occur

### Related Rules/Skills/Decision Trees
- **Rule 3**: check-failedjobs-in-finally (`05-rules.md`)
- **Decision 1**: allowFailures() vs Default Batch Failure Behavior (`07-decision-trees.md`)
