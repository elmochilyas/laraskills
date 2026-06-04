# Anti-Patterns: Batch of Chains Pattern and `finally()` Edge Case

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Job Batching & Chaining |
| Knowledge Unit | K014 — Batch of Chains Pattern |
| Classification | Expert |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Relying on `finally()` in Batch-of-Chains | Reliability | Critical |
| 2 | No Watchdog for Stuck Batches | Operations | High |
| 3 | Long Chains Within a Batch | Reliability | Medium |
| 4 | Batch-of-Chains When Separate Batches Would Suffice | Design | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No Mid-Chain Failure Testing | batch-of-chains-pattern, chain-batch-interaction-limitations | High |
| Stuck Batches Accumulating in Production | batch-of-chains-pattern, bus-batch-architecture | Critical |

---

## Anti-Pattern 1: Relying on `finally()` in Batch-of-Chains

### Category
Reliability — Callback Never Fires

### Description
Using `finally()` for post-batch processing when the batch contains chains (`Bus::batch([[$a1, $a2], [$b1, $b2]])`). The `finally()` callback requires `allJobsHaveRanExactlyOnce`. When a chain job fails mid-chain, the remaining jobs in that chain are never dispatched — they remain in the pending count forever. `finally()` never fires.

### Why It Happens
The `finally()` method name implies it always runs, like a `try/finally` block. The internal condition — `allJobsHaveRanExactlyOnce` — is not documented in the API signature. Developers must read source code to discover it.

### Warning Signs
- `finally()` callback defined for a batch containing chains
- Post-batch cleanup (cache invalidation, status updates) is placed in `finally()`
- Cleanup never runs when mid-chain failures occur
- `finished_at` column remains `NULL` for batches with mid-chain failures
- `pending_jobs - failed_jobs` is a positive number (undispatched chain jobs)

### Why Harmful
Essential post-batch processing silently never runs. Cache keys stay locked, status flags remain set, downstream workflows wait indefinitely. The application appears stuck because the batch never completes. The `job_batches` table grows with orphaned records.

### Real-World Consequences
A batch-of-chains processes 200 payment workflows (each chain: validate → charge → receipt). One chain fails at the "charge" step (insufficient funds). The chain aborts — "receipt" is never dispatched. `finally()` checks `allJobsHaveRanExactlyOnce` — the receipt job never ran. `finally()` doesn't fire. The cache lock `batch:processing:payments` remains set. All subsequent payment batches are blocked. The `finished_at` timestamp is never set. The monitoring system doesn't alert because the batch isn't "failed" — it's just stuck.

### Preferred Alternative
Use `then()` + `catch()` for batch-of-chains. `then()` fires when all jobs completed successfully. `catch()` fires when some jobs failed but all that could run did run.

### Refactoring Strategy
1. Replace `->finally(fn($b) => ...)` with `->then(fn($b) => success())->catch(fn($b, $e) => failure())`
2. Verify `then()` and `catch()` fire correctly for mid-chain failure scenarios
3. Add a stuck batch watchdog as a safety net (see Anti-Pattern 2)
4. Consider migrating to separate per-chain batches
5. Document the `finally()` limitation in team runbooks

### Detection Checklist
- [ ] `finally()` used with batch-of-chains
- [ ] Stuck batches with `finished_at = NULL`
- [ ] Cache locks/status flags never clear
- [ ] `then()` + `catch()` not used as alternative

### Related Rules/Skills/Decision Trees
- **Rule 1**: use-then-catch-not-finally (`05-rules.md`)
- **Skill**: Use Batch-of-Chains Pattern Safely (`06-skills.md`)
- **Decision**: Batch-of-Chains vs Separate Batches (`07-decision-trees.md`)

---

## Anti-Pattern 2: No Watchdog for Stuck Batches

### Category
Operations — Undetected Stuck Batches

### Description
Not implementing a watchdog to detect and recover stuck batches — batches where `finished_at = NULL` but `created_at` exceeds the expected maximum runtime. Stuck batches from mid-chain failures or other issues accumulate silently in `job_batches`.

### Why It Happens
Teams don't anticipate stuck batches. The batch-of-chains `finally()` bug is not widely known. Without explicit monitoring, stuck batches are invisible — they don't trigger alerts because they're not "failed", they're just "running" forever.

### Warning Signs
- `job_batches` table has records with `finished_at = NULL` for hours/days
- No scheduled task querying for stuck batches
- Monitoring dashboard shows some batches as "running" indefinitely
- Cache locks from stuck batches persist until manual cleanup
- `job_batches` table grows unboundedly with orphaned records

### Why Harmful
Stuck batches silently consume storage in `job_batches`. More importantly, they block downstream operations that depend on batch completion. Cache locks prevent new work from starting. The problem compounds over time as more batches get stuck.

### Real-World Consequences
A batch-of-chains gets stuck due to mid-chain failure (job 2 of a 3-job chain fails, `finally()` never fires). The batch's status flag `batch_fulfillment_locked` in Redis is never cleared. A new batch arrives every 5 minutes — each one checks the lock and waits. Within an hour, 12 batches are queued, all waiting for the same stuck batch. An engineer notices increased queue depth in Horizon but doesn't see a clear cause. It takes 4 hours before someone manually queries `job_batches` and discovers the stuck record.

### Preferred Alternative
Implement a watchdog that periodically checks for stuck batches and cancels or completes them.

### Refactoring Strategy
1. Add a scheduled task (e.g., Laravel command in `schedule()`):
   ```php
   $schedule->call(function () {
       DB::table('job_batches')
           ->whereNull('finished_at')
           ->where('created_at', '<', now()->subHours(2))
           ->update(['cancelled_at' => now(), 'finished_at' => now()]);
   })->hourly();
   ```
2. Log all watchdog actions for audit trail
3. Set alert threshold: alert if >5 batches stuck simultaneously
4. For batches that need manual review: mark them but don't auto-complete
5. Add dashboard panel showing stuck batch count

### Detection Checklist
- [ ] No scheduled watchdog for stuck batches
- [ ] `job_batches` has records with `finished_at = NULL` for >2 hours
- [ ] No alerting on stuck batch count
- [ ] Manual cleanup required for stuck batches

### Related Rules/Skills/Decision Trees
- **Rule 2**: implement-stuck-batch-watchdog (`05-rules.md`)
- **Skill**: Use Batch-of-Chains Pattern Safely (`06-skills.md`)

---

## Anti-Pattern 3: Long Chains Within a Batch

### Category
Reliability — Increased Failure Probability

### Description
Using long chains (5+ jobs) within a batch-of-chains pattern. The probability of at least one chain experiencing a mid-chain failure increases with chain length, which is the root cause of the stuck batch problem.

### Why It Happens
Developers design chains to match the natural workflow steps without considering failure probability. If a workflow has 6 sequential steps, they create a 6-job chain inside the batch.

### Warning Signs
- Chains within a batch have 4+ jobs
- Mid-chain failures are not uncommon in production
- Some batches never complete due to abandoned chain jobs
- Team is frustrated by unreliable batch callbacks
- Chain jobs have non-trivial failure rates (API calls, external services)

### Why Harmful
If each job has a 1% failure rate, a 6-job chain has ~5.9% mid-chain failure probability per chain. With 100 chains, ~99.7% of batches experience at least one chain failure. The batch-of-chains pattern becomes practically unreliable.

### Real-World Consequences
A batch-of-chains processes 50 customer onboarding workflows. Each chain has 5 jobs: create account → validate KYC → create subscription → send welcome email → provision API key. Each job has 2% failure rate. Per-chain success probability: 0.98^5 = 90.4%. Probability of all 50 chains succeeding: 0.904^50 = 0.64%. Over 99% of batches will have at least one stuck chain. Support tickets about incomplete onboarding pour in.

### Preferred Alternative
Limit chain length to 2-3 jobs within a batch. For longer workflows, split into separate batches or use a state machine pattern.

### Refactoring Strategy
1. Review chain lengths — identify chains with 4+ jobs
2. Decompose long chains: split into 2-3 job units with independent batches
3. For genuinely sequential workflows >3 steps: use separate batches with coordination
4. Make individual jobs idempotent so they can be retried without side effects
5. Monitor chain failure rates per length — set alerts for chains with >5% failure rate

### Detection Checklist
- [ ] Chains within batch have 4+ jobs
- [ ] High proportion of batches with mid-chain failures
- [ ] >5 jobs per chain in any batch
- [ ] No monitoring of chain failure rate by length

### Related Rules/Skills/Decision Trees
- **Rule 4**: limit-chain-length-in-batches (`05-rules.md`)
- **Skill**: Use Batch-of-Chains Pattern Safely (`06-skills.md`)

---

## Anti-Pattern 4: Batch-of-Chains When Separate Batches Would Suffice

### Category
Design — Unnecessary Complexity

### Description
Using `Bus::batch([[$a1, $a2], [$b1, $b2]])` when separate per-chain batches (`Bus::batch([$a1, $a2])` + `Bus::batch([$b1, $b2])`) would work equally well. This introduces the `finally()` bug, stuck batch risk, and unnecessary complexity without benefit.

### Why It Happens
Batch-of-chains looks like the canonical way to run multiple chains in parallel. It's a single `Bus::batch()` call — cleaner and shorter than dispatching N separate batches. Developers don't evaluate whether the single-batch semantics are actually needed.

### Warning Signs
- Chains in the batch are independent (different business contexts)
- No cross-chain coordination needed (no shared post-processing)
- Team struggles with `finally()` edge case and considers workarounds
- Separate batches would have identical behavior
- The batch ID is not used for cross-chain coordination

### Why Harmful
Using batch-of-chains adds risk (stuck batches, `finally()` unreliability) without benefit when per-chain coordination isn't required. The complexity of understanding and debugging the composition pattern exceeds the convenience of a single `Bus::batch()` call.

### Real-World Consequences
A team uses batch-of-chains for processing customer import workflows. Each customer's chain is completely independent — separate post-processing per customer. Mid-chain failure on Customer A's chain blocks `finally()`. Customer B-Z's post-processing never runs because the batch never completes. With separate batches, Customer B-Z would have completed fine.

### Preferred Alternative
Use separate batches with individual callbacks per chain. Each batch tracks its own chain independently with no shared `finally()` issue.

### Refactoring Strategy
1. Evaluate whether batch-of-chains semantics are needed (shared callback, single batch ID)
2. If not: refactor to N separate `Bus::batch()` calls
3. Each batch gets its own `then()` and `catch()` callbacks
4. Consider a coordinator batch to track completion of all child batches (if needed)
5. Remove the original batch-of-chains code

### Detection Checklist
- [ ] Chains are independent (different business contexts)
- [ ] No shared post-processing across chains
- [ ] Team works around `finally()` limitations
- [ ] Separate batches would be equally effective

### Related Rules/Skills/Decision Trees
- **Rule 3**: prefer-separate-batches-over-chains (`05-rules.md`)
- **Decision**: Batch-of-Chains vs Separate Batches (`07-decision-trees.md`)
