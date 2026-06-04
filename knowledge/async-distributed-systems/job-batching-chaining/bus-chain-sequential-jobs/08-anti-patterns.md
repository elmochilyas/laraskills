# Anti-Patterns: `Bus::chain` for Sequential Job Execution

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Job Batching & Chaining |
| Knowledge Unit | K013 — Bus::chain Sequential Jobs |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Using Chains for Independent Parallel Work | Design | High |
| 2 | Assuming Chain Rollback on Failure | Reliability | Critical |
| 3 | Not Setting Per-Job Timeout Explicitly | Reliability | High |
| 4 | Not Making Chain Jobs Idempotent | Reliability | High |
| 5 | Overly Long Chains (>5 Jobs) | Reliability | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| catch() Callback Only Logs Without Compensation | bus-chain-sequential-jobs, retry-workflow | High |
| No Per-Job Timeout Set on Chain Jobs | bus-chain-sequential-jobs, tries-max-exceptions-retry-until | Medium |
| Chains Used as Saga Replacements | bus-chain-sequential-jobs, chain-batch-interaction-limitations | Medium |

---

## Anti-Pattern 1: Using Chains for Independent Parallel Work

### Category
Design — Inefficient Execution

### Description
Using `Bus::chain` to execute jobs that don't depend on each other and could run in parallel. Chain execution is strictly sequential — each job waits for the previous to complete, even when they're completely independent.

### Why It Happens
`Bus::chain` has a simple API that's easy to reach for. Developers default to chains for dispatching multiple jobs without considering whether they need ordering.

### Warning Signs
- Chain jobs don't share state or have ordering dependencies
- Jobs like `ProcessOrder1`, `ProcessOrder2`, `ProcessOrder3` in the same chain
- Chain throughput equals sum of all job times (no parallelism)
- Team observes slow "processing" that would benefit from parallel execution
- Jobs are independent business operations on different entities

### Why Harmful
Parallelizable work runs N times slower than necessary. Worker capacity is underutilized — workers sit idle waiting for the previous job to finish. The queue backlog grows unnecessarily.

### Real-World Consequences
A team chains 5 independent data export jobs: `Bus::chain([$exportCustomers, $exportOrders, $exportProducts, $exportInventory, $exportSuppliers])->dispatch()`. Each export takes 2 minutes. Total: 10 minutes. With `Bus::batch`, all 5 would run concurrently — total: 2 minutes. The chain consumes a single worker for 10 minutes, blocking other work. The batch completes in 2 minutes using 5 workers briefly.

### Preferred Alternative
Use `Bus::batch` for independent work. Use `Bus::chain` only when sequential execution is required.

### Refactoring Strategy
1. Identify chains where jobs are independent (no state sharing, no ordering requirement)
2. Replace `Bus::chain([$a, $b, $c])` with `Bus::batch([$a, $b, $c])`
3. If some ordering is needed within groups, restructure into a batch of chains or separate batches
4. If total parallelism is desired, use `Bus::batch` without chains
5. Monitor throughput improvement after refactoring

### Detection Checklist
- [ ] Chain jobs are independent of each other
- [ ] No shared state or ordering dependency
- [ ] Sequential execution adds unnecessary delay
- [ ] Batch would be more appropriate

### Related Rules/Skills/Decision Trees
- **Rule 5**: no-chains-for-parallel-work (`05-rules.md`)
- **Decision**: Bus::chain vs Sequential Single Job (`07-decision-trees.md`)

---

## Anti-Pattern 2: Assuming Chain Rollback on Failure

### Category
Reliability — Data Inconsistency

### Description
Assuming that when a chain fails mid-execution, earlier jobs' side effects are rolled back. Chain execution is transactional in dispatch but not in side effects — each job commits independently. If job 2 fails, job 1's database writes, API calls, and file operations are already committed.

### Why It Happens
The word "chain" suggests a linked sequence where everything is connected. Developers familiar with database transactions transfer that mental model to chains. The `catch()` callback's name also suggests "catching" an error in a try/catch sense — but there's no automatic rollback.

### Warning Signs
- No compensatory logic in `catch()` callbacks (only logging)
- Chain failure leaves the system in an inconsistent state
- Job 1's effects persist after job 2 fails
- Team is surprised that chain didn't "undo" job 1
- Code comments mention "rollback" or "transactional" for chains

### Why Harmful
Data inconsistency goes undetected. Job 1 created a user record. Job 2 charges the payment method. Job 2 fails. The user exists but wasn't charged. No automated compensation fires. The user can log in but has no active subscription. Support tickets about "broken accounts" surge.

### Real-World Consequences
A chain processes: create account → charge credit card → send welcome email. The card charge fails (declined). The account was already created. The chain aborts and the `catch()` callback only logs: "Failed at step 2". The orphaned account sits in the database forever. During next month's billing reconciliation, the finance team finds 500 accounts with no payment history but active status.

### Preferred Alternative
Implement compensatory actions in the `catch()` callback. Manually reverse or flag incomplete transactions.

### Refactoring Strategy
1. Review `catch()` callbacks — verify they provide compensation, not just logging
2. For each chain step that could leave side effects, implement a compensation action
3. Trigger compensation from `catch()`: `CompensateFailedOrder::dispatch($orderId)`
4. For critical workflows, implement a saga pattern with explicit rollback steps
5. Document that chain rollback is not automatic and must be explicitly implemented

### Detection Checklist
- [ ] `catch()` callback only logs without compensation
- [ ] Earlier chain jobs' effects persist after failure
- [ ] No manual cleanup process for chain failures
- [ ] Team assumes automatic rollback

### Related Rules/Skills/Decision Trees
- **Rule 3**: use-catch-for-compensation (`05-rules.md`)
- **Decision**: Chain Failure Handling Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 3: Not Setting Per-Job Timeout Explicitly

### Category
Reliability — Worker Kills Chain Mid-Execution

### Description
Not setting explicit `$timeout` on individual chain jobs. Chain total duration = sum of all job durations. If the worker `--timeout` is shorter than the total chain duration, the worker kills the chain mid-execution — even though no individual job exceeded its default timeout.

### Why It Happens
Developers set the worker `--timeout` to a reasonable value (e.g., 300 seconds) and assume individual jobs will respect it. They don't consider that chain progress depends on the job holding the worker for the entire chain duration.

### Warning Signs
- Chain jobs don't define `$timeout` property
- Worker `--timeout` is close to the total expected chain duration
- Chain fails mid-execution with "Maximum execution time exceeded" errors
- Individual jobs complete within their default timeout but the chain overall exceeds the worker limit
- Team increases worker `--timeout` as a workaround

### Why Harmful
The worker kills the chain, aborting remaining jobs. The `catch()` callback fires, but the damage is done — earlier jobs' side effects persist. The failure is confusing because no individual job timed out. Diagnosis requires understanding chain accumulation.

### Real-World Consequences
A chain of 4 jobs: Job A (45s), Job B (60s), Job C (30s), Job D (45s). Worker `--timeout=180`. Jobs A and B complete normally. Job C takes 30s — total elapsed = 135s. Job D starts at 135s but the 180s timeout is reached 45s into Job D, which takes 45s total. The worker kills the chain 45s into Job D. Job D fails, chain aborts. The catch callback fires. Job A, B, C's effects persist. Investigation shows no individual job exceeded its timeout, but the cumulative time reached the worker limit.

### Preferred Alternative
Set explicit `$timeout` on each job in the chain. Ensure worker `--timeout` covers the worst-case total chain duration.

### Refactoring Strategy
1. Add `public $timeout = <value>` to each chain job class
2. Calculate worst-case total chain duration (sum of all per-job timeouts)
3. Set worker `--timeout` to at least the total chain duration + buffer
4. Consider breaking long chains into smaller chains with coordinator jobs
5. Monitor chain execution time vs worker timeout

### Detection Checklist
- [ ] No per-job `$timeout` on chain jobs
- [ ] Worker `--timeout` close to total chain duration
- [ ] "Maximum execution time exceeded" on chain jobs
- [ ] Cumulative time exceeds worker limit

### Related Rules/Skills/Decision Trees
- **Rule 2**: set-per-job-timeout-explicitly (`05-rules.md`)
- **Skill**: Chain Sequential Jobs with Bus::chain (`06-skills.md`)

---

## Anti-Pattern 4: Not Making Chain Jobs Idempotent

### Category
Reliability — Broken Chain After Worker Crash

### Description
Chain jobs are not designed to be idempotent. If a worker crashes after job 1 succeeds but before dispatching job 2, the chain breaks permanently — job 1's effects persist but job 2 never runs. No automated recovery mechanism exists.

### Why It Happens
Developers write jobs assuming they'll always run exactly once. The chain's sequential pattern creates an implicit assumption that the next job will always be dispatched after the current one succeeds. The worker crash between jobs is an invisible failure mode.

### Warning Signs
- Chain jobs perform non-idempotent operations (increment counters, append data, charge payments)
- Occasional orphaned records or incomplete workflows with no chain failure logged
- "Missing" chain steps that never executed
- Team manually re-dispatches chains after worker restarts
- No idempotency key or deduplication in chain job logic

### Why Harmful
A worker crash between jobs leaves the system permanently inconsistent. Job 1 created a record, but job 2 (send notification) never runs. The only recovery is manual intervention. In a high-throughput system with frequent worker restarts, these orphaned workflows accumulate silently.

### Real-World Consequences
A chain processes order fulfillment: charge card → reserve inventory → send confirmation. A worker crashes after charging the card but before dispatching the inventory reservation. The card is charged. Inventory is not reserved. The customer receives a confirmation (from the frontend, not the chain). Later, the inventory is overbooked because the reservation never ran. The customer's order can't be fulfilled. The charge has to be refunded manually.

### Preferred Alternative
Make each chain job idempotent so it can be safely retried. Use idempotency keys or conditional updates.

### Refactoring Strategy
1. Identify non-idempotent operations in chain jobs
2. Add idempotency: use `where('status', 'pending')->update(...)` instead of raw `update()`
3. For API calls: use idempotency keys (e.g., Stripe Idempotency-Key header)
4. For database writes: use upserts or conditional updates
5. Implement a recovery job that checks for incomplete chains periodically

### Detection Checklist
- [ ] Chain jobs perform non-idempotent operations
- [ ] Worker crashes leave orphaned side effects
- [ ] No idempotency key or deduplication
- [ ] Manual recovery is the only option for broken chains

### Related Rules/Skills/Decision Trees
- **Rule 1**: make-chain-jobs-idempotent (`05-rules.md`)
- **Skill**: Chain Sequential Jobs with Bus::chain (`06-skills.md`)

---

## Anti-Pattern 5: Overly Long Chains (>5 Jobs)

### Category
Reliability — Increased Failure Probability

### Description
Creating chains with 6+ jobs. Each additional job increases the probability of a chain-aborting failure and the serialization payload size. Long chains break frequently, requiring manual recovery.

### Why It Happens
Developers map the entire workflow step-by-step into a chain. "We have 6 steps, so we need a 6-job chain." They don't consider that each step is a failure point.

### Warning Signs
- Chain length of 6+ jobs
- Frequent chain failures requiring manual recovery
- `catch()` callbacks firing regularly
- Chain jobs large serialized payloads (carrying many remaining jobs)
- Team spends significant time recovering broken chains

### Why Harmful
If each job has 2% failure probability, a 6-job chain has 11.4% failure probability — more than 1 in 10 chains will fail. For a system processing 1,000 chains/day, 114+ fail. Recovery takes significant manual effort. Each failed chain leaves earlier jobs' side effects that need compensation.

### Real-World Consequences
A 7-job chain processes onboarding workflows. Each job has 1.5% failure rate. Chain failure probability: 1 - (0.985^7) = 10.1%. With 500 onboarding flows per day, 50 fail daily. Each failure requires manual review: did job 1 create the user but job 2 (set permissions) fail? Did job 3 (provision storage) run? Support spends 2 hours/day investigating and fixing broken chains.

### Preferred Alternative
Limit chain length to 2-5 jobs. For longer workflows, split into smaller chains with a coordinator or implement a saga pattern.

### Refactoring Strategy
1. Review existing chains — identify those with 6+ jobs
2. Split into 2-3 smaller chains with a coordinator job that starts the next chain
3. For long pipelines: implement a state machine saga with explicit steps and compensation
4. Add monitoring for chain length — alert on chains over 5 jobs
5. Test mid-chain failures at each position to verify compensation works

### Detection Checklist
- [ ] Chain length 6+ jobs
- [ ] High chain failure rate (>5%)
- [ ] Frequent manual recovery for broken chains
- [ ] Large serialized payloads from long chains

### Related Rules/Skills/Decision Trees
- **Rule 4**: limit-chain-length (`05-rules.md`)
- **Skill**: Chain Sequential Jobs with Bus::chain (`06-skills.md`)
