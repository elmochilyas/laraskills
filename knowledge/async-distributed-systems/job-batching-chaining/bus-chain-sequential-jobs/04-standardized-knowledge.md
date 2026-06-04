# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Batching & Chaining
- **Knowledge Unit:** K013 — `Bus::chain` for Sequential Job Execution
- **Knowledge ID:** K013
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Job Chaining
  - Laravel Source — `Illuminate\Bus\PendingChain`

---

# Overview

`Bus::chain` provides ordered, sequential job execution with fail-fast semantics. Jobs run one after another: job 1 must succeed before job 2 starts. If any job exhausts its retries, the entire chain aborts — remaining jobs are never dispatched. This is fundamentally different from `Bus::batch` (parallel, failure-tolerant). Chains are the correct tool when each step depends on the previous one's side effects and partial execution would leave the system inconsistent.

---

# Core Concepts

- **Chain dispatch:** `Bus::chain([$job1, $job2, $job3])->dispatch()` — sequential execution.
- **Fail-fast:** If `$job1` fails (retries exhausted), `$job2` and `$job3` are never dispatched.
- **`catch()` callback:** The only lifecycle hook. Fires when any chain job fails after retries exhausted.
- **No `then()` or `finally()`:** Chains lack success/progress/finally callbacks.
- **Driverless progression:** Chain advancement is driven by each successful job dispatching the next via the `$chained` property — no central coordinator.

---

# When To Use

- Dependent operations where job B requires job A's side effects (create user → send welcome email)
- Ordered data pipelines (validate → transform → export)
- When partial execution is worse than no execution

---

# When NOT To Use

- Independent work — use `Bus::batch` for parallelism
- Progress tracking needed — chains have no progress callbacks
- Chain length > 10 jobs — consider a saga pattern or workflow engine instead

---

# Best Practices

- **Make each chain job idempotent.** If a worker crashes after job 1 succeeds but before dispatching job 2, the chain breaks permanently — job 1's effects persist but job 2 never runs. *Why: The chain has no recovery mechanism for worker crashes between jobs — idempotency allows safe manual retry.*
- **Set per-job `$timeout` explicitly.** Chain total duration = sum of all job durations. Worker `--timeout` must cover the entire chain. *Why: A chain is only as fast as its slowest job — individual job timeouts prevent a single slow job from exceeding the worker's limit.*
- **Use `catch()` for compensatory actions, not just logging.** A chain failure does NOT roll back previous jobs. *Why: Each job commits independently — if job 2 fails, job 1's database writes, API calls, and file operations are already done.*
- **Keep chain length under 5 jobs.** Long chains increase the probability of mid-chain failure and serialization payload size. *Why: Chain progression depends on `$chained` serialization — longer chains carry more serialized payload and have more failure points.*

---

# Performance Considerations

- Chain throughput = sum of individual job times. No parallelism.
- `$chained` property carries remaining jobs serialized — overhead proportional to chain length.
- `catch()` callback is serialized into the first job's payload and carried through the entire chain.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using chains for independent work | Familiarity with chain pattern | Sequential execution of parallelizable work — slow | Use `Bus::batch` |
| Assuming chain rollback on failure | Thinking chain is like a DB transaction | Previous jobs' side effects persist | Implement compensation in `catch()` |
| Not setting `$timeout` per job | Default 60s may be insufficient | Worker kills chain mid-execution | Set explicit per-job timeout |
| Worker crash breaks chain | Crash between job 1 success and job 2 dispatch | Job 1 done, job 2 never runs | Make jobs idempotent for manual recovery |

---

# Anti-Patterns

- **Long chains > 10 jobs:** Probability of mid-chain failure increases, serialization payload grows, debugging is harder.
- **Chains as saga replacements:** Chains lack compensation, rollback, or temporal orchestration. Use a proper saga pattern for distributed transactions.

---

# Examples

```php
Bus::chain([
    new ProcessPayment($order),
    new ShipOrder($order),
    new SendConfirmation($order),
])->catch(function (Throwable $e) {
    // Payment processed but shipping failed — compensate
    Mail::to('admin@example.com')->send(new ChainFailure($e));
})->dispatch();
```

---

# Related Topics

- **K008 Bus::batch Architecture (K008)** — Contrast parallel vs sequential
- **K014 Batch of Chains Pattern (K014)** — Composition of chains within batches
- **K089 Chain-Batch Interaction Limitations (K089)** — Chain behavior inside batches
