# Anti-Patterns: Batch State Tracking with Row-Level Locking

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Job Batching & Chaining |
| Knowledge Unit | K009 — Batch State Tracking with Locking |
| Classification | Expert |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Large Batches Under High Concurrency | Performance | Critical |
| 2 | Using SQLite or MyISAM for Batch Operations | Performance | Critical |
| 3 | Not Monitoring Lock Contention | Observability | High |
| 4 | Assuming Parallel Batch Completion Updates | Design | High |
| 5 | Using Stale Batch State via Cached Objects | Reliability | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Single Massive Batch Instead of Chunked Batches | batch-state-tracking-locking, bus-batch-architecture | Critical |
| No Lock Wait Timeout Configuration | batch-state-tracking-locking | Medium |

---

## Anti-Pattern 1: Large Batches Under High Concurrency

### Category
Performance — Lock Contention

### Description
Dispatching a single large batch (>1,000 jobs) with high worker concurrency. Each job completion acquires an exclusive row-level lock on the `job_batches` row. With many workers completing jobs simultaneously, they serialize on the lock — throughput collapses as workers spend more time waiting for the lock than processing jobs.

### Why It Happens
Developers think "more workers = faster batch completion". They don't realize that batch state updates are serialized on a single database row regardless of worker count. Adding workers beyond a certain point makes completion slower due to lock contention.

### Warning Signs
- Batch completion time grows linearly with job count regardless of worker count
- Adding workers doesn't speed up batch completion
- `Innodb_row_lock_current_waits` spikes during batch operations
- Workers show high "idle" or "waiting for lock" time
- Job processing is fast but batch completion is slow

### Why Harmful
Workers waste CPU and connection pool slots waiting for the batch row lock. The batch completion time is dominated by lock acquisition, not job processing. 10,000 jobs x 5ms lock wait = 50 seconds of serialized waiting regardless of how many workers you add.

### Real-World Consequences
A batch of 15,000 email-sending jobs is dispatched with 50 workers. Each job takes 200ms to process (API call). Job processing time: 15,000 x 200ms = 3,000 seconds of work. With 50 workers, parallel processing time = 60 seconds. But each job completion acquires a 3ms lock. 15,000 x 3ms = 45 seconds of serialized lock time — nearly doubling the batch completion time. The batch dashboard shows it took 105 seconds instead of the expected 60 seconds.

### Preferred Alternative
Chunk large workloads into smaller batches (under 1,000 jobs each). Each batch has its own database row, so workers update different rows in parallel.

### Refactoring Strategy
1. Identify batches with >1,000 jobs and high worker concurrency
2. Chunk jobs: `collect($jobs)->chunk(1000)->each(fn($chunk) => Bus::batch($chunk)->dispatch())`
3. Monitor lock waits before and after chunking
4. For long-running jobs (>10s each): apply threshold differently — lock contention is negligible
5. Consider Redis-based progress tracking for non-critical progress display

### Detection Checklist
- [ ] Batch size >1,000 jobs with high concurrency
- [ ] Batch completion time > sum of job processing time / worker count
- [ ] `Innodb_row_lock_current_waits` > 0 during batch operations
- [ ] Workers show lock wait time

### Related Rules/Skills/Decision Trees
- **Rule 1**: keep-batch-sizes-under-1k (`05-rules.md`)
- **Skill**: Monitor and Mitigate Batch Row-Level Lock Contention (`06-skills.md`)
- **Decision**: Row Lock Contention Mitigation (`07-decision-trees.md`)

---

## Anti-Pattern 2: Using SQLite or MyISAM for Batch Operations

### Category
Performance — Table-Level Locking

### Description
Using SQLite (table-level locking) or MyISAM (table-level locking) as the database for Laravel batches. Every batch update acquires a table-level lock — completely independent batches cannot update simultaneously, and even one batch's updates serialize all others.

### Why It Happens
Development environments default to SQLite. Teams deploy to production without checking the database engine. MyISAM is still used in legacy MySQL installations.

### Warning Signs
- SQLite database used in production
- MyISAM engine on `job_batches` table
- Batch operations are extremely slow regardless of size
- All batch updates appear to serialize (no parallel batch completion)
- Team blames "slow database" but lock type is the root cause

### Why Harmful
With table-level locking, Batch A and Batch B cannot update simultaneously — even though they're completely independent. Every update to any batch row locks the entire table. This makes all batch operations sequential at the database level.

### Real-World Consequences
A production system uses SQLite (deployed as a single-file DB). Two independent batches are dispatched: Batch A (500 jobs) and Batch B (300 jobs). Each job completion from Batch A locks the entire `job_batches` table — Batch B's completions queue up behind Batch A's locks. Batch A's 500 completions and Batch B's 300 completions = 800 sequential lock operations. Batch B takes as long as if it were competing with Batch A for a single resource, even though they're completely unrelated.

### Preferred Alternative
Use MySQL with InnoDB or PostgreSQL — both support row-level locking for concurrent batch updates.

### Refactoring Strategy
1. Check database engine: `SHOW TABLE STATUS WHERE Name = 'job_batches'`
2. If MyISAM: `ALTER TABLE job_batches ENGINE = InnoDB;`
3. If SQLite: migrate to MySQL or PostgreSQL
4. For development: keep SQLite but be aware of limitations
5. Test batch throughput after migration to confirm improvement

### Detection Checklist
- [ ] SQLite or MyISAM detected
- [ ] Batch operations serialize at table level
- [ ] Independent batches interfere with each other
- [ ] Team unaware of database engine impact

### Related Rules/Skills/Decision Trees
- **Rule 2**: use-innodb-or-postgresql (`05-rules.md`)
- **Skill**: Monitor and Mitigate Batch Row-Level Lock Contention (`06-skills.md`)

---

## Anti-Pattern 3: Not Monitoring Lock Contention

### Category
Observability — Invisible Bottleneck

### Description
Not monitoring database row lock waits during batch operations. The batch lock bottleneck is invisible in job logs — workers don't log "waiting for lock". Without DB-level metrics, teams don't know that lock contention is the root cause of slow batch completions.

### Why It Happens
Teams monitor job processing time, queue depth, and worker utilization. They don't think to monitor `Innodb_row_lock_current_waits` because the bottleneck is at the database level, not the queue level.

### Warning Signs
- Batch completion is slower than expected but no obvious cause
- Job processing time is fast but batch completion is slow
- No monitoring of `Innodb_row_lock_current_waits`
- Team attributes slow batches to "queue issues" when it's a database lock issue
- Adding workers makes batch completion slower (more lock contention)

### Why Harmful
Teams waste time investigating the wrong root cause (queue config, worker count, network). They may add more workers (which makes lock contention worse) or tune queue settings (which have no effect). The true bottleneck remains unaddressed.

### Real-World Consequences
A team notices batch completion times are 3x expected. They add 20 more workers (now 50 total). Batch completion gets even slower due to increased lock contention. They investigate Horizon config, Redis throughput, and network latency — all normal. After a week of investigation, someone checks `Innodb_row_lock_current_waits` and finds it at 50+. The fix (chunking batches) takes 30 minutes.

### Preferred Alternative
Monitor `Innodb_row_lock_current_waits` during batch-heavy operations. Alert on sustained high values.

### Refactoring Strategy
1. Add monitoring query: `SELECT * FROM information_schema.INNODB_METRICS WHERE NAME = 'lock_row_lock_current_waits'`
2. Create a dashboard panel for lock wait metrics
3. Alert when lock waits exceed threshold (e.g., >10 concurrent waits for >1 minute)
4. When lock contention is detected, investigate batch sizes and concurrency
5. Consider chunking large batches or reducing worker concurrency per batch

### Detection Checklist
- [ ] No lock wait monitoring in place
- [ ] Batch completion slower than expected
- [ ] Teams attribute slow batches to wrong root cause
- [ ] Adding workers makes completion slower

### Related Rules/Skills/Decision Trees
- **Rule 3**: monitor-lock-waits-during-batches (`05-rules.md`)
- **Skill**: Monitor and Mitigate Batch Row-Level Lock Contention (`06-skills.md`)

---

## Anti-Pattern 4: Assuming Parallel Batch Completion Updates

### Category
Design — Incorrect Concurrency Model

### Description
Assuming that because workers process batch jobs in parallel, the batch completion (state updates, `pending_jobs` decrement) also happens in parallel. In reality, all batch state updates serialize on the single batch row lock — workers wait their turn.

### Why It Happens
The term "parallel job processing" creates an expectation that everything related to the batch is parallel. Developers don't consider the synchronization mechanism — they see workers running concurrently and assume all overhead is concurrent.

### Warning Signs
- Team believes "more workers = linearly faster batch completion"
- Batch completion time is longer than expected for parallel work
- Confusion about why batch completion doesn't scale with workers
- Code comments suggesting batch state updates are parallel
- Performance reviews assume O(n/p) completion time

### Why Harmful
Incorrect mental model leads to incorrect capacity planning. Teams over-provision workers expecting linear scaling. They design systems around assumed parallelism that doesn't exist, leading to missed SLAs and wasted infrastructure.

### Real-World Consequences
A team designs a batch system expecting 10x speedup with 10 workers. They allocate 10 workers per batch. Actual throughput: 10 workers provide only 2x speedup over 1 worker because 8 of the 10 workers spend most of their time waiting for the batch row lock. The team is paying for 10 workers but getting equivalent of 2. The batch SLA is missed.

### Preferred Alternative
Understand and account for the serialized batch state update. Chunk batches to distribute lock contention across multiple rows.

### Refactoring Strategy
1. Measure actual batch completion time vs theoretical parallel time
2. Calculate lock contention overhead: (actual time - parallel processing time) / actual time
3. If overhead >20%, chunk batches to reduce per-batch lock contention
4. Document in team knowledge base that batch state updates are serialized
5. Set realistic scaling expectations — 3-4 workers is typically optimal per batch

### Detection Checklist
- [ ] Team assumes parallel batch completion
- [ ] Performance doesn't scale linearly with workers
- [ ] Lock contention detected
- [ ] Batch sizing not optimized for lock behavior

### Related Rules/Skills/Decision Trees
- **Rule 1**: keep-batch-sizes-under-1k (`05-rules.md`)
- **Decision**: Row Lock Contention Mitigation (`07-decision-trees.md`)

---

## Anti-Pattern 5: Using Stale Batch State via Cached Objects

### Category
Reliability — Stale Data Decisions

### Description
Using a cached `Batch` object (retrieved earlier in the job's lifecycle) for state decisions instead of calling `$batch->fresh()`. The `Batch` object is immutable — it captures state at read time. Between read and use, other workers have updated the batch, making the cached state stale.

### Why It Happens
Developers don't realize `Batch` objects are immutable snapshots. They store a `$batch` reference and expect it to auto-update as jobs complete. The `fresh()` method exists but is not mentioned in the basic API documentation.

### Warning Signs
- Job uses `$this->batch()` multiple times expecting fresh data each time
- Batch state checks show outdated pending/failed counts
- Decisions based on `cancelled()` return stale results
- `$batch->pendingJobs` shows wrong count in callbacks
- Progress reporting shows incorrect percentages

### Why Harmful
A job may decide to skip processing because `$this->batch()->cancelled()` returns `false` (stale) when the batch was actually cancelled after the batch object was constructed. Or a progress callback may report "50% complete" when the actual completion is 80%.

### Real-World Consequences
A job checks `$this->batch()->cancelled()` at the start of `handle()`. The batch was cancelled 2 seconds ago, but the batch object in this job was created 3 seconds ago — before cancellation. `cancelled()` returns `false`. The job proceeds to process an expensive API call. The API call succeeds, but the batch is cancelled — the result is never used.

### Preferred Alternative
Call `$batch->fresh()` before making state-dependent decisions, especially for cancellation checks and progress reporting.

### Refactoring Strategy
1. Identify all batch state reads in job `handle()` methods
2. For cancellation checks: use `SkipIfBatchCancelled` middleware (automatically fresh)
3. For progress reporting: call `$this->batch()->fresh()` at the point of use
4. For `cancelled()` checks: consider adding null-safe guard for pruned batches
5. Document that `Batch` object is immutable and `fresh()` re-reads from DB

### Detection Checklist
- [ ] Batch state checks without calling `fresh()` first
- [ ] Stale cancellation checks
- [ ] Incorrect progress reporting
- [ ] No `SkipIfBatchCancelled` middleware

### Related Rules/Skills/Decision Trees
- **Decision**: Fresh vs Cached Batch State Reads (`07-decision-trees.md`)
