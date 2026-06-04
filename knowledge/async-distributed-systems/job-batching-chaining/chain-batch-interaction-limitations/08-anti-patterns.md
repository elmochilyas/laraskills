# Anti-Patterns: Chain-Batch Interaction Limitations

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Job Batching & Chaining |
| Knowledge Unit | K089 — Chain-Batch Interaction Limitations |
| Classification | Expert |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Using Batch-of-Chains When Flat Batch Would Work | Design | High |
| 2 | Chain-of-Batches Advancing on Partial Inner Batch Failure | Reliability | Critical |
| 3 | Assuming `allowFailures()` Prevents Chain Abort | Design | Critical |
| 4 | No Watchdog for Stuck Batches from Chain Abort | Operations | High |
| 5 | Not Testing Mid-Chain Failure in Batch Context | Quality | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Finally() Relied Upon in Nested Composition | chain-batch-interaction-limitations, batch-of-chains-pattern, batch-callbacks | Critical |
| Unchecked Inner Batch State in Chain-of-Batches | chain-batch-interaction-limitations, bus-chain-sequential-jobs | High |
| No Composition Failure Monitoring | chain-batch-interaction-limitations | High |

---

## Anti-Pattern 1: Using Batch-of-Chains When Flat Batch Would Work

### Category
Design — Unnecessary Complexity

### Description
Using `Bus::batch([[$a1, $a2], [$b1, $b2]])` (batch-of-chains) when a flat batch with ordering constraints in job code would suffice. This introduces the abandoned-jobs problem, `finally()` unreliability, and skewed batch state tracking without benefit.

### Why It Happens
Developers think in nested structures. The batch-of-chains syntax naturally represents the mental model of "groups of ordered work." They don't consider flattening as an option.

### Warning Signs
- Short sequences (2-3 jobs) inside each chain group
- Ordering could be handled by job logic (if/else, state checks)
- Team struggles with `finally()` bug and abandoned jobs
- Chains exist only to group related jobs within the batch
- No strict ordering requirement across chain jobs

### Why Harmful
Every batch-of-chains introduces the risk of abandoned jobs (chain jobs after a mid-chain failure are never dispatched) and permanently skewed batch state (`pending_jobs` never reaches 0). These risks are unnecessary when a flat batch would work.

### Real-World Consequences
A team uses batch-of-chains for processing orders — each order has 2 jobs: validate and process. Both jobs are independent in practice (validate doesn't affect process). After 6 months in production, a validation job fails due to a data issue. The chain aborts — the process job for that order is never dispatched. The batch never reaches `finished_at`. The team spends 2 hours debugging why this batch is "stuck" before discovering the abandoned job.

### Preferred Alternative
Use a flat batch with individual jobs for short sequences. Handle ordering in job code if needed.

### Refactoring Strategy
1. Identify batch-of-chains with short (2-3) chains
2. Flatten: `Bus::batch([$a1, $a2, $b1, $b2])` instead of `Bus::batch([[$a1, $a2], [$b1, $b2]])`
3. Move ordering logic into job code where needed (e.g., check prerequisites)
4. Use conditionals or explicit job stages for sequences
5. Verify callbacks work correctly after flattening

### Detection Checklist
- [ ] Chains within batch are short (2-3 jobs)
- [ ] Ordering could be handled in job code
- [ ] Flat batch would be simpler and more reliable
- [ ] Team encounters composition bugs

### Related Rules/Skills/Decision Trees
- **Rule 3**: prefer-flat-batches-for-short-sequences (`05-rules.md`)
- **Decision**: Batch-of-Chains vs Flat Batch with Ordering (`07-decision-trees.md`)

---

## Anti-Pattern 2: Chain-of-Batches Advancing on Partial Inner Batch Failure

### Category
Reliability — Silent Data Degradation

### Description
Using `Bus::chain([Bus::batch([$a, $b]), $nextJob])` where the inner batch has `allowFailures()`. The inner batch may have partial failures, but the outer chain only sees the batch job as "completed" — `$nextJob` runs regardless of how many inner jobs failed.

### Why It Happens
The outer chain treats the inner batch as a single job. A job that dispatches a batch and returns successfully is seen as "completed" by the chain. The chain has no mechanism to inspect the inner batch's failure count.

### Warning Signs
- `allowFailures()` on inner batch in a chain-of-batches
- `$nextJob` in chain receives incomplete/partial data
- No explicit check of inner batch `failedJobs` before advancing the chain
- Inner batch has failures but chain continues normally
- Downstream jobs process data that depends on inner batch completeness

### Why Harmful
The chain advances with incomplete data silently. If the inner batch processed 90 of 100 records and `$nextJob` generates a report based on that data, the report is based on 90% of the expected data. No one knows. The report is published as if it represents 100%.

### Real-World Consequences
A chain-of-batches processes data for a monthly financial report: Batch A (import transactions) → Job B (generate report). Batch A uses `allowFailures()` because some transaction imports may fail. On average, 5% of imports fail. The report job runs after the batch completes with 95% of transactions. The monthly financial report is generated with 5% missing data. The CFO approves decisions based on incomplete numbers.

### Preferred Alternative
Explicitly check inner batch state before advancing the chain. Fail the chain if failures exceed a threshold.

### Refactoring Strategy
1. Identify chain-of-batches where inner batch may have failures
2. In the job that dispatches the inner batch: return the batch ID
3. In the next chain job: load the batch and check `$batch->failedJobs`
4. If failures exceed threshold: `$this->fail('Inner batch had failures')`
5. If failures are acceptable: proceed but log the failure count

### Detection Checklist
- [ ] Inner batch uses `allowFailures()` in chain-of-batches
- [ ] Downstream jobs don't check inner batch failure count
- [ ] Chain advances with incomplete data
- [ ] No explicit batch state validation

### Related Rules/Skills/Decision Trees
- **Rule 2**: check-inner-batch-state-explicitly (`05-rules.md`)
- **Decision**: Chain-of-Batches vs Sequential Batches (`07-decision-trees.md`)

---

## Anti-Pattern 3: Assuming `allowFailures()` Prevents Chain Abort

### Category
Design — Incorrect Scope Understanding

### Description
Assuming that adding `allowFailures()` to a batch-of-chains prevents chains from aborting on mid-chain failure. `allowFailures()` is batch-scoped — it allows the batch to continue when jobs fail. Chain abort is chain-internal and independent of batch failure tolerance.

### Why It Happens
Developers think `allowFailures()` is a universal "keep going" flag. They don't realize that chains within the batch have their own failure semantics that the batch cannot override.

### Warning Signs
- `allowFailures()` added to batch-of-chains expecting chains to continue after failure
- Chain jobs after failure still don't run despite `allowFailures()`
- Team expresses confusion about "allowFailures not working"
- Code comments suggest allowFailures should prevent chain abort
- No separate handling for chain-level failure behavior

### Why Harmful
Developers believe they've handled failures with `allowFailures()`, but chains still abort. The abandoned-jobs problem persists. Teams make incorrect assumptions about system behavior, leading to gaps in error handling.

### Real-World Consequences
A team adds `allowFailures()` to a batch-of-chains after experiencing failures. They test: some jobs in the batch fail, but other chains continue — `allowFailures()` works for the batch level. But chain C still aborts on mid-chain failure. The team thinks `allowFailures()` isn't working and adds more debugging. Days later, they discover that chain abort is independent behavior. In the meantime, abandoned jobs accumulated in production.

### Preferred Alternative
Replace chains with individual flat jobs or use per-job error handling if chain continuation is desired.

### Refactoring Strategy
1. Identify batch-of-chains where chain continuation after failure is expected
2. If per-job continuation is needed: flatten chains into individual batch jobs
3. If chain semantics are strictly required: implement try/catch within each chain job
4. Remove `allowFailures()` as a workaround — it doesn't fix chain abort
5. Document the independent failure domains (batch-level vs chain-level)

### Detection Checklist
- [ ] Team expects `allowFailures()` to prevent chain abort
- [ ] Chains still abort despite `allowFailures()`
- [ ] No per-job error handling in chain jobs
- [ ] Confusion about failure scope

### Related Rules/Skills/Decision Trees
- **Rule 3**: prefer-flat-batches-for-short-sequences (`05-rules.md`) — avoids the problem
- **Decision**: Batch-of-Chains vs Flat Batch with Ordering (`07-decision-trees.md`)

---

## Anti-Pattern 4: No Watchdog for Stuck Batches from Chain Abort

### Category
Operations — Undetected Stuck Batches

### Description
Not implementing a watchdog for stuck batches when using batch-of-chains. Mid-chain failures leave batches stuck permanently — `pending_jobs` never reaches 0 because abandoned jobs (chain jobs after the failure) were counted but never dispatched. `finished_at` is never set.

### Why It Happens
Teams don't realize that batch-of-chains can produce stuck batches. The `finally()` bug is not obvious from the API. Standard batch monitoring (Horizon dashboard, queue metrics) doesn't show stuck batches — they appear to be "in progress" forever.

### Warning Signs
- Batch-of-chains in production without watchdog
- `job_batches` table has records with `finished_at = NULL` for hours
- No alerting on stuck batch count
- Team discovers stuck batches during manual DB inspection
- Cache locks from stuck batches persist indefinitely

### Why Harmful
Stuck batches accumulate silently. Each stuck batch represents work that partially completed — some jobs ran, others didn't. Downstream operations that depend on batch completion are blocked. Storage grows with orphaned batch records.

### Real-World Consequences
A production system runs 500 batch-of-chains per day. 5% (25) get stuck from mid-chain failures. After 30 days, 750 stuck batches exist in `job_batches`. The table has 750 orphaned records. A monthly maintenance script that queries `job_batches` for active batches scans 750 false positives. A developer investigating "why is the batch queue so slow" finds the 750 stuck records and spends hours investigating.

### Preferred Alternative
Implement a watchdog that periodically checks for and recovers stuck batches.

### Refactoring Strategy
1. Implement scheduled task: check `job_batches WHERE finished_at IS NULL AND created_at < NOW() - '2 hours'`
2. Log all stuck batch details (id, name, created_at, total_jobs, pending_jobs)
3. Auto-cancel or mark as complete with appropriate alerting
4. For critical batches: investigate root cause before auto-recovery
5. Add dashboard panel showing stuck batch count over time

### Detection Checklist
- [ ] No watchdog for stuck batches
- [ ] Batch-of-chains in production
- [ ] `job_batches` has records with `finished_at = NULL`
- [ ] Cache locks or status flags never clear

### Related Rules/Skills/Decision Trees
- **Rule 4**: watchdog-for-unfinished-batches (`05-rules.md`)
- **Skill**: Avoid Chain-Batch Composition Pitfalls (`06-skills.md`)

---

## Anti-Pattern 5: Not Testing Mid-Chain Failure in Batch Context

### Category
Quality — Coverage Gap

### Description
Only testing all-success and all-failure scenarios for batch-of-chains patterns without testing mid-chain failure (job 1 succeeds, job 2 fails in one chain, other chains continue). Mid-chain failure is the most complex failure mode and the one that triggers the `finally()` bug and abandoned-jobs problem.

### Why It Happens
Teams test the happy path (all succeed) and the simple failure path (first job fails). Mid-chain failure requires setting up a specific failure scenario (success for job N, failure for job N+1 in the same chain), which requires more test infrastructure.

### Warning Signs
- No test that simulates "job 1 succeeds, job 2 fails" within a chain in a batch
- Test coverage for batch-of-chains only covers all-success or all-failure
- Production incidents involving mid-chain failure are the first discovery
- Team says "we didn't know that could happen"
- No integration test with actual queue worker for batch-of-chains

### Why Harmful
Mid-chain failure behavior is the most surprising and dangerous failure mode. Without testing, teams discover the `finally()` bug, abandoned jobs, and stuck batches only after they cause production issues. Each incident is a surprise.

### Real-World Consequences
A team deploys a batch-of-chains feature after testing all-success and all-failure scenarios. In production, a chain experiences mid-chain failure (job 1 processed, job 2 failed). The `finally()` callback never fires. The batch never completes. The team only discovers this 3 days later when a customer complains about missing post-processing. A test for mid-chain failure would have caught this in CI.

### Preferred Alternative
Write integration tests for mid-chain failure in batch-of-chains. Test at least: job 1 fails, job in middle fails, last job fails.

### Refactoring Strategy
1. Write a test that dispatches a batch-of-chains where a middle job fails
2. Verify callbacks fire as expected (then() or catch() — not finally())
3. Verify batch finishes (finished_at is set) or watchdog would catch it
4. Verify no orphaned state (cache locks cleared, status flags updated)
5. Add to CI as a regression test for chain-batch composition

### Detection Checklist
- [ ] No mid-chain failure test for batch-of-chains
- [ ] Only all-success and all-failure tested
- [ ] Production incidents from mid-chain failure
- [ ] No CI integration test with queue worker

### Related Rules/Skills/Decision Trees
- **Skill**: Avoid Chain-Batch Composition Pitfalls (`06-skills.md`)
- **Related**: batch-of-chains-pattern KUs — testing guidance
