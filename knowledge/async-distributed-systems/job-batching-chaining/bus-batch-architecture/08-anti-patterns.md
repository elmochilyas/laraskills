# Anti-Patterns: Bus::batch Architecture

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Job Batching & Chaining |
| Knowledge Unit | K008 — Bus::batch Architecture |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Missing allowFailures for Independent Jobs | Reliability | Critical |
| 2 | Oversized Batches Exceeding 10,000 Jobs | Performance | High |
| 3 | Stale Batch State Without fresh() | Reliability | High |
| 4 | Large Objects Serialized in Callbacks | Performance | Medium |
| 5 | Never Pruning Old Batch Records | Operational | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Using Batch for Sequential Work Instead of Chain | bus-batch-architecture, bus-chain-sequential-jobs | High |
| Nested Batches Without allowFailures | bus-batch-architecture, batch-of-chains-pattern | Critical |
| Batches Used as Transaction Boundaries | bus-batch-architecture, batch-state-tracking-locking | High |

---

## Anti-Pattern 1: Missing allowFailures for Independent Jobs

### Category
Reliability — Cascading Failure

### Description
Dispatching a batch of independent jobs (e.g., processing different orders) without calling `allowFailures()`. A single job failure cancels the entire batch — all remaining jobs (including those that would have succeeded) never run.

### Why It Happens
The default behavior (without `allowFailures`) is all-or-nothing. Developers don't read the fine print and assume individual job failures don't affect other jobs in the batch.

### Warning Signs
- Batch with independent jobs cancels after one failure
- Remaining jobs never process despite the failure being unrelated to them
- Developers express surprise that one failure stops all other work
- Batch failures cascade — a single transient error causes massive reprocessing
- No `allowFailures()` call in batch dispatch code

### Why Harmful
One transient failure in a batch of 10,000 independent jobs cancels every job that hasn't started — massive wasted work. The entire batch must be retried, including jobs that already succeeded.

### Real-World Consequences
A data import batch processes 5000 independent user records. User #423 has invalid data. The batch cancels immediately — the remaining 4577 unprocessed records are never imported. The team must fix user #423's data and re-run the entire batch, wasting the processing time of the 422 records that already succeeded.

### Preferred Alternative
Always call `allowFailures()` when batch jobs are independent and partial success is acceptable.

### Refactoring Strategy
1. Add `->allowFailures()` to all batch dispatch chains
2. Use `catch()` callback for logging failed jobs
3. Use `then()` callback for notifying on overall completion (regardless of failures)
4. Track failed jobs via the `$batch->failedJobs` array
5. Only omit `allowFailures()` for truly atomic operations

### Detection Checklist
- [ ] No `allowFailures()` on batch with independent jobs
- [ ] Batch cancels after single failure
- [ ] Unprocessed jobs must be re-dispatched after failure
- [ ] Jobs are independent (don't share state)

### Related Rules/Skills/Decision Trees
- **Rule 2**: use-allowfailures-for-partial-success (`05-rules.md`)
- **Decision 1**: Batch vs Sequential Dispatch (`07-decision-trees.md`)

---

## Anti-Pattern 2: Oversized Batches Exceeding 10,000 Jobs

### Category
Performance — Row Lock Contention

### Description
Dispatching batches with more than 10,000 jobs. Each job completion acquires a row lock on the `job_batches` table — at high concurrency, this serializes on a single DB row, dramatically slowing batch completion.

### Why It Happens
Large datasets are naturally processed in bulk. Developers apply batching to the entire dataset without considering the lock contention overhead.

### Warning Signs
- Batch with 10,000+ jobs dispatches
- Batch completion slows significantly as more jobs finish
- job_batches table shows high lock wait times
- Database CPU spikes during batch processing
- Queue worker throughput drops as batch progresses
- "Deadlock" errors on job_batches table

### Why Harmful
Each job completion serializes on a single DB row. With 10,000 jobs, the last jobs wait for all previous 9,999 completions — effectively serializing the parallel workload. Throughput drops from thousands per second to hundreds per second.

### Real-World Consequences
A team dispatches a batch of 50,000 image processing jobs. The first 1000 jobs complete in 5 seconds (parallel). As more jobs complete, row lock contention increases. The last 1000 jobs take 30 minutes. Total batch time: 45 minutes instead of the expected 2 minutes. After splitting into 5 batches of 10,000, each batch completes in 2 minutes in parallel.

### Preferred Alternative
Keep batch sizes under 10,000. Split larger workloads into multiple coordinated batches.

### Refactoring Strategy
1. Chunk large job arrays: `collect($jobs)->chunk(5000)`
2. Dispatch each chunk as a separate batch
3. Use a coordinator batch or dependency tracking for cross-batch ordering
4. Monitor lock contention on job_batches table
5. Consider direct dispatch for very small batches (<5 jobs)

### Detection Checklist
- [ ] Batch size >10,000 jobs
- [ ] Batch completion slows progressively
- [ ] Row lock contention on job_batches table
- [ ] Database CPU spikes during batch processing

### Related Rules/Skills/Decision Trees
- **Rule 1**: keep-batch-sizes-manageable (`05-rules.md`)
- **Decision 2**: Batch Size Limit (`07-decision-trees.md`)

---

## Anti-Pattern 3: Stale Batch State Without fresh()

### Category
Reliability — Incorrect Decision Making

### Description
Reading batch state without calling `$batch->fresh()`. The `Batch` object is immutable after creation — it reflects the state at read time, not current state. Code that assumes the batch object stays current makes decisions based on stale counts.

### Why It Happens
Developers treat the `Batch` object returned by `dispatch()` as a live reference. They don't realize it's an immutable snapshot.

### Warning Signs
- `$batch = Bus::batch(...)->dispatch()` then later `$batch->pendingJobs` without `fresh()`
- Progress bars show incorrect (stale) percentages
- Conditional logic based on batch state fires incorrectly
- Decision to dispatch secondary work based on old batch counts
- Polling loop never calls `fresh()`, always sees same state

### Why Harmful
Code makes decisions based on stale pending/completed counts. A conditional that should fire when all jobs are complete may fire too early or never. A progress tracker shows incorrect percentages.

### Real-World Consequences
A polling loop checks `$batch->finished()` in a loop every second. Without `fresh()`, the batch object always shows the same state — the loop never detects completion and runs forever. The application server CPU goes to 100% from the infinite loop.

### Preferred Alternative
Always call `$batch->fresh()` to get the current batch state before reading properties.

### Refactoring Strategy
1. Replace `$batch->pendingJobs` with `$batch->fresh()->pendingJobs`
2. For polling loops, call `fresh()` at the start of each iteration
3. For callbacks (then/catch/finally), the passed Batch is already fresh — no need for fresh() within callbacks
4. Cache the fresh state for the duration needed
5. Document that Batch objects are immutable snapshots

### Detection Checklist
- [ ] Batch state read without `fresh()`
- [ ] Stale counts lead to incorrect decisions
- [ ] Polling loop never sees state changes
- [ ] Progress tracking shows wrong values

### Related Rules/Skills/Decision Trees
- **Rule 5**: always-fresh-batch-for-current-state (`05-rules.md`)
- **Decision 1**: Batch vs Sequential Dispatch (`07-decision-trees.md`)

---

## Anti-Pattern 4: Large Objects Serialized in Callbacks

### Category
Performance — Bloated Storage

### Description
Capturing large objects (entire request objects, models, large arrays) in batch callback closures (`then`, `catch`, `finally`). Callbacks are serialized closures stored in the `options` column — large captured variables bloat storage and risk deserialization failure.

### Why It Happens
Developers use the convenient inline closure syntax without considering that callbacks are serialized and stored in the database alongside the batch metadata.

### Warning Signs
- Callback captures entire models, request objects, or large arrays
- `options` column in `job_batches` table grows large
- "Serialization of ... failed" errors related to batch callbacks
- High memory usage when loading batch records
- Callback closures use `$this` or capture service instances

### Why Harmful
The `options` column grows with each large serialized payload. Deserialization time increases. Class-version mismatches between dispatch and callback execution cause deserialization failures — the callback never fires.

### Real-World Consequences
A `then()` callback captures the entire `$request` object (including uploaded file, session data, and headers). The serialized payload is 150KB, stored in the `options` column. When the batch completes after a deployment, the callback fails to deserialize because the `Request` class has changed. The completion notification never fires.

### Preferred Alternative
Dispatch a queued job from the callback instead of capturing large objects in the closure.

### Refactoring Strategy
1. Move callback logic to a queued job class
2. Pass only small scalar data to the callback: `then(fn() => BatchCompleted::dispatch($batchId))`
3. Handle batch-related work in the dispatched job
4. Remove large object captures from callbacks
5. Monitor `options` column size in job_batches table

### Detection Checklist
- [ ] Callback captures large objects (models, requests, arrays)
- [ ] `options` column grows large
- [ ] Serialization errors on batch completion
- [ ] Callback uses `$this` or service container

### Related Rules/Skills/Decision Trees
- **Rule 3**: avoid-large-objects-in-callbacks (`05-rules.md`)
- **Decision 1**: Batch vs Sequential Dispatch (`07-decision-trees.md`)

---

## Anti-Pattern 5: Never Pruning Old Batch Records

### Category
Operational — Unbounded Table Growth

### Description
Failing to schedule `queue:prune-batches` for regular cleanup of completed batch records. Unlike `failed_jobs`, batch records are not automatically cleaned up — the `job_batches` table grows indefinitely.

### Why It Happens
Batch functionality seems self-cleaning — developers don't realize that completed, cancelled, and finished batches persist forever in the database. The table is invisible until it becomes a problem.

### Warning Signs
- No `queue:prune-batches` command in the scheduler
- `job_batches` table has millions of rows
- Backups of the `job_batches` table take significant time/storage
- Queries on `job_batches` become slow
- Batch dispatch latency increases (new batch inserts contend with old reads)
- Disk space usage grows unexpectedly

### Why Harmful
The `job_batches` table grows unbounded. Database queries slow down as the table grows. Backups take longer and use more storage. Eventually, the table consumes significant disk space.

### Real-World Consequences
A high-volume e-commerce site processes 10,000 batches per day. After 6 months, the `job_batches` table has 1.8 million rows taking 2GB. Backups take 30 minutes longer. `SELECT` queries on the table take 500ms. After adding `queue:prune-batches --hours=48` to the daily scheduler, the table stays under 50,000 rows and queries take 5ms.

### Preferred Alternative
Schedule `queue:prune-batches` to run daily. Retain only as many batch records as needed for auditing.

### Refactoring Strategy
1. Add `$schedule->command('queue:prune-batches --hours=48')->daily()` to the scheduler
2. For auditing requirements, adjust `--hours` to retain longer (e.g., 72 or 168)
3. Run initial cleanup: `php artisan queue:prune-batches --hours=0` (removes all finished)
4. Monitor table size reduction
5. Add a monitoring alert if `job_batches` exceeds a threshold

### Detection Checklist
- [ ] No `queue:prune-batches` in scheduler
- [ ] job_batches table has >100K rows
- [ ] Table size slows queries
- [ ] Backup times increase

### Related Rules/Skills/Decision Trees
- **Rule 4**: prune-old-batches-regularly (`05-rules.md`)
- **Decision 2**: Batch Size Limit (`07-decision-trees.md`)
