# Anti-Patterns: Batchable Trait and Cancellation

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Job Batching & Chaining |
| Knowledge Unit | K010 — Batchable Trait and Cancellation |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Not Returning After bail() | Reliability | High |
| 2 | Assuming Cancellation Stops Queued Jobs | Design | High |
| 3 | No Mid-Execution Cancellation Check for Long Jobs | Performance | Medium |
| 4 | Manual bail() Checks Instead of Middleware | Design | Medium |
| 5 | batch() Called Without Null Guard | Reliability | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No SkipIfBatchCancelled on Batched Jobs | batchable-trait-cancellation, bus-batch-architecture | High |
| Cancellation Used When allowFailures Would Suffice | batchable-trait-cancellation, allow-failures-behavior | Medium |
| Missing Progress Reporting in Batched Jobs | batchable-trait-cancellation, batch-state-tracking-locking | Low |

---

## Anti-Pattern 1: Not Returning After bail()

### Category
Reliability — Wasted Work on Cancelled Batch

### Description
Calling `$this->bail()` without returning from the method. `bail()` only sets a flag and deletes the job — the `handle()` method continues executing unless the developer explicitly returns, wasting processing time and resources.

### Why It Happens
Developers assume `bail()` stops execution like an exception or `exit()`. The method name suggests it terminates the job, but it only removes the job from the queue.

### Warning Signs
- `$this->bail()` called without `return` statement afterward
- Job's `handle()` method continues executing expensive operations after `bail()`
- Cancelled batches still show worker CPU usage
- Job logs show processing after `bail()` call
- `bail()` used without `if ($this->bail()) { return; }` pattern

### Why Harmful
The entire job runs despite cancellation — expensive API calls, database writes, and processing time are wasted. The user who cancelled the batch sees no immediate effect because the currently running job continues to completion.

### Real-World Consequences
A user cancels a batch of 500 media processing jobs. The currently running job calls `$this->bail()` but doesn't return. It continues processing a 200MB video file for 45 seconds, transcoding it and uploading the result. The API call to the CDN succeeds, and the transcoded video is stored — all for a batch the user explicitly cancelled.

### Preferred Alternative
Always use `if ($this->bail()) { return; }` or prefer `SkipIfBatchCancelled` middleware.

### Refactoring Strategy
1. Find all `$this->bail()` calls without `return`
2. Replace with `if ($this->bail()) { return; }`
3. Alternatively, replace with `SkipIfBatchCancelled` middleware
4. Test that cancelled batch jobs skip execution after bail
5. Monitor resource usage for cancelled batches

### Detection Checklist
- [ ] `bail()` called without `return`
- [ ] Job continues running despite `bail()`
- [ ] Wasted resources on cancelled batches
- [ ] `SkipIfBatchCancelled` middleware not used

### Related Rules/Skills/Decision Trees
- **Rule 2**: always-return-after-bail (`05-rules.md`)
- **Decision 1**: Batch Cancellation Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 2: Assuming Cancellation Stops Queued Jobs

### Category
Design — Cooperative Cancellation Misconception

### Description
Assuming that calling `$batch->cancel()` or cancelling via Horizon immediately stops all jobs in the batch. Cancellation only sets `cancelled_at` in the database — already-queued job payloads remain in Redis/SQS and continue to execute unless the job checks cancellation.

### Why It Happens
The term "cancel" suggests an immediate, forceful termination. Developers don't realize cancellation is cooperative — jobs must opt-in by checking the cancellation flag.

### Warning Signs
- `$batch->cancel()` called and developer expects zero jobs to run after
- Already-queued jobs execute after batch cancellation
- Side effects (API calls, DB writes) continue after cancellation request
- No `SkipIfBatchCancelled` middleware on batched jobs
- Team expresses surprise that cancellation is not immediate

### Why Harmful
Jobs that were queued before cancellation still execute, consuming worker time and producing side effects the user intended to stop. In a batch of 10,000 jobs where cancellation was requested after processing 5,000, up to 5,000 more jobs may still run.

### Real-World Consequences
A data deletion batch is cancelled after 1,000 of 10,000 records are processed. The developer assumes cancellation stops all remaining jobs. 3,000 more jobs execute before the queue is drained, permanently deleting data that should have been preserved. The cooperative cancellation model means the damage was unavoidable without proper middleware.

### Preferred Alternative
Apply `SkipIfBatchCancelled` middleware to all batched jobs. For strong cancellation guarantees, check cancellation at the start of every job.

### Refactoring Strategy
1. Add `SkipIfBatchCancelled` to the `middleware()` method of all batched jobs
2. For long-running jobs, add periodic `cancelled()` checks mid-execution
3. Document that cancellation is cooperative and requires job-level checks
4. Test cancellation behavior with actual queue processing

### Detection Checklist
- [ ] Batched jobs lack `SkipIfBatchCancelled` middleware
- [ ] Jobs execute after cancellation
- [ ] Side effects continue after cancellation request
- [ ] Team expects immediate cancellation

### Related Rules/Skills/Decision Trees
- **Rule 4**: no-auto-stop-on-cancellation (`05-rules.md`)
- **Decision 2**: Batch Job State Checking (`07-decision-trees.md`)

---

## Anti-Pattern 3: No Mid-Execution Cancellation Check for Long Jobs

### Category
Performance — Wasted Long-Running Work

### Description
Long-running batched jobs (processing thousands of items) don't check cancellation mid-execution. Once started, the job runs to completion even if the batch was cancelled, wasting minutes of processing time and resources.

### Why It Happens
Developers add cancellation checks at the start of `handle()` but don't consider that cancellation can happen while the job is running. Long jobs that process items in a loop never check the batch state between iterations.

### Warning Signs
- Job processes >100 items in a loop without cancellation checks
- Job takes >30 seconds and never checks `cancelled()` during execution
- Cancelled batches still show long-running jobs completing fully
- Worker CPU usage continues for minutes after cancellation request
- User cancels batch but waits for current job to finish (which takes a long time)

### Why Harmful
A user cancels a batch expecting it to stop. The current job continues processing for minutes, consuming CPU, memory, and external API rate limits. The user's intent is not respected, and resources are wasted.

### Real-World Consequences
A batch of data export jobs is cancelled by an admin. The currently running job is exporting 50,000 records, processing them 100 at a time in a loop — without cancellation checks. The job continues for 8 more minutes, exporting 40,000 more records to an S3 bucket. The admin must manually clean up the partial export file.

### Preferred Alternative
Add periodic `cancelled()` checks in long-running loops. Check every N iterations (e.g., every 100 items).

### Refactoring Strategy
1. Identify long-running jobs with processing loops
2. Add periodic cancellation check: `if ($i % 100 === 0 && $this->batch()?->cancelled()) { return; }`
3. Choose check frequency based on iteration cost (check every N iterations or every T seconds)
4. Test with actual cancellation to verify early termination
5. Monitor duration of cancelled batch jobs

### Detection Checklist
- [ ] Job processes items in a loop without cancellation checks
- [ ] Job continues running after batch cancellation
- [ ] Job execution time >30 seconds
- [ ] No periodic `cancelled()` call in loop

### Related Rules/Skills/Decision Trees
- **Rule 3**: check-cancellation-mid-execution (`05-rules.md`)
- **Decision 2**: Batch Job State Checking (`07-decision-trees.md`)

---

## Anti-Pattern 4: Manual bail() Checks Instead of Middleware

### Category
Design — Duplicated Code

### Description
Adding manual `$this->bail()` checks at the start of every `handle()` method instead of using `SkipIfBatchCancelled` middleware. This duplicates boilerplate and increases the chance of missing the check on some jobs.

### Why It Happens
Developers are unfamiliar with the `SkipIfBatchCancelled` middleware pattern. The `bail()` method appears on the `Batchable` trait and is the first thing found when reading documentation.

### Warning Signs
- `if ($this->bail()) { return; }` duplicated across multiple job classes
- Some batched jobs have the check, others don't
- Code review checklist includes verifying bail() exists on every batched job
- New batched jobs are created without the bail() check
- `middleware()` method is not defined on batched job classes

### Why Harmful
Inevitably, some batched jobs miss the manual check — cancelled batches continue processing for those jobs. The boilerplate adds noise to every `handle()` method. Centralizing in middleware ensures consistent behavior.

### Real-World Consequences
A team has 20 batched job classes, all with manual `bail()` checks. A new developer creates a 21st batched job and forgets the check. When this batch is cancelled, the job still runs, making an expensive API call that charges the company $50. The manual check pattern also means each code review must verify the check exists.

### Preferred Alternative
Use `SkipIfBatchCancelled` middleware in the `middleware()` method of each batched job class.

### Refactoring Strategy
1. Add `public function middleware(): array { return [new SkipIfBatchCancelled]; }` to each batched job
2. Remove manual `if ($this->bail()) { return; }` from `handle()` methods
3. For long-running jobs, keep mid-execution checks (middleware only checks at start)
4. Create a base class or trait for shared middleware
5. Verify all batched jobs have the middleware

### Detection Checklist
- [ ] Manual `bail()` check at start of `handle()` instead of middleware
- [ ] Some batched jobs lack the check
- [ ] No `middleware()` method on batched job classes
- [ ] Boilerplate duplicated across job classes

### Related Rules/Skills/Decision Trees
- **Rule 1**: use-skipifbatchcancelled-middleware (`05-rules.md`)
- **Decision 1**: Batch Cancellation Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 5: batch() Called Without Null Guard

### Category
Reliability — Null Method Call Error

### Description
Calling `$this->batch()` without null-guarding the return value. If the batch has been pruned from the `job_batches` table before the job executes, `batch()` returns `null` — calling `cancelled()` or other methods on null crashes.

### Why It Happens
Developers assume the batch always exists when the job runs. In practice, the `queue:prune-batches` command or manual cleanup may delete the batch record before a long-queued job executes.

### Warning Signs
- `$this->batch()->cancelled()` or similar chain without null check
- "Call to a member function on null" errors referencing `batch()`
- Errors occur after `queue:prune-batches` runs
- Jobs that were delayed or queued for a long time fail with null batch
- Intermittent failures that correlate with batch pruning schedule

### Why Harmful
A null batch causes an immediate crash — the job fails and enters `failed_jobs`. The error message is confusing ("Call to a member function on null") and doesn't indicate the root cause.

### Real-World Consequences
A job processes a payment that was queued for 48 hours (due to a delay). Meanwhile, the daily `queue:prune-batches --hours=24` command cleaned up the batch record. When the job executes, `$this->batch()->cancelled()` throws a null error. The payment job fails and is retried 3 times (same error), eventually landing in `failed_jobs`. The customer's payment is never processed.

### Preferred Alternative
Use null-safe (`?->`) or conditional check for `$this->batch()`.

### Refactoring Strategy
1. Replace `$this->batch()->cancelled()` with `$this->batch()?->cancelled()`
2. For PHP < 8.0: use `$batch = $this->batch(); if ($batch) { $batch->cancelled(); }`
3. Handle the null case gracefully (e.g., assume not cancelled if batch is gone)
4. Adjust pruning schedule to retain batches longer than maximum job delay
5. Add logging when batch is null for auditing

### Detection Checklist
- [ ] `$this->batch()->` without null check
- [ ] "Call to a member function on null" errors
- [ ] Errors correlate with batch pruning schedule
- [ ] Delayed/long-queued jobs fail with null batch

### Related Rules/Skills/Decision Trees
- **Rule 3**: check-cancellation-mid-execution (`05-rules.md`) — null-safe guard implied
- **Decision 2**: Batch Job State Checking (`07-decision-trees.md`)
