# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Async Dispatch Patterns
- **Knowledge Unit:** K064 — afterCommit Transactional Safety
- **Knowledge ID:** K064
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queue: Dispatching Jobs (afterCommit)
  - Laravel Source — `Illuminate\Bus\PendingDispatch`, `Illuminate\Database\DatabaseTransactionsManager`
  - Laravel 11 release notes (default afterCommit)

---

# Overview

The `afterCommit` dispatch option prevents a class of race conditions where a queued job executes before the database transaction that created its data has committed. When a job is dispatched inside a database transaction, the worker may read stale or missing data. `afterCommit` defers the actual queue push until after the outermost transaction commits, ensuring the worker always sees committed data.

---

# Core Concepts

- **Transaction-visibility race:** A job dispatched inside a `DB::transaction()` is pushed to the queue immediately. The worker can pick it up before the transaction commits, querying data not yet visible to other connections.
- **afterCommit registration:** `afterCommit` registers the dispatch as pending, only pushing to the queue backend after the transaction successfully commits.
- **Rollback behavior:** If the transaction rolls back, the dispatch is silently discarded — the job never enters the queue.
- **Global default:** The `queue.after_commit` config option sets the default for all dispatches on that connection. Individual dispatches can override it.
- **Outer-transaction scope:** In nested transactions (savepoints), `afterCommit` waits for the outermost transaction to commit.
- **afterCommit vs afterResponse:** These are orthogonal — `afterCommit` controls transactional timing; `dispatchAfterResponse` controls HTTP-response timing. They can be combined.

---

# When To Use

- Any job dispatched inside a database transaction that reads data written by that transaction
- Model creation workflows where the worker needs to find the newly created record
- Cascade delete safety — defer cleanup jobs until all related records are removed
- Multi-model transaction workflows (order → charge → inventory → fulfillment)
- As the global default (`queue.after_commit = true`) for all queue connections

---

# When NOT To Use

- Non-transactional side effects like incrementing a cache counter or logging — transactional consistency is irrelevant
- Audit logs that must record events even if the triggering transaction rolls back
- Jobs that must execute immediately regardless of transaction state — use `afterCommit(false)` explicitly
- When the transaction is exceptionally long and the dispatch delay is unacceptable — refactor the transaction instead

---

# Best Practices

- **Set `queue.after_commit` to `true` as the global default.** Laravel 11 made this the default for new applications. For existing applications, enabling it globally is the highest-leverage configuration change for data consistency. The performance cost is negligible compared to the safety gain.
- **Use `afterCommit(false)` explicitly for immediate dispatch.** When the global default is `true`, every dispatch is deferred by default. Explicit opt-out communicates intent in code review.
- **Never assume `afterCommit` implies the transaction is small.** A long transaction delays all `afterCommit` dispatches equally. Monitor the gap between dispatch registration and actual queue push.
- **Test rollback scenarios.** Verify jobs are not dispatched when a transaction rolls back. This is especially important for financial operations where duplicate processing is costly.
- **Combine `afterCommit` with `dispatchAfterResponse` for complete safety.** `afterCommit` handles transactional timing; `dispatchAfterResponse` handles HTTP-response timing. They are independent and composable.

---

# Architecture Guidelines

- `afterCommit` is only meaningful when a database transaction is active. Outside a transaction, dispatch happens immediately regardless of the setting.
- In nested transactions (MySQL savepoints), only the outermost commit triggers the deferred dispatch. A rollback to a savepoint does not trigger `afterCommit` callbacks.
- When `Bus::chain()` is used with `afterCommit`, the entire chain is deferred until commit, not individual jobs. Any job in the chain that must dispatch immediately must use `afterCommit(false)`.
- The config default `queue.after_commit` sets `$this->afterCommit` on new `PendingDispatch` instances via the `QueueManager`. This applies to all jobs, mail, notifications, and broadcast events that use the queue.

---

# Performance Considerations

- The callback registration is an in-memory operation — negligible overhead.
- The queue push happens on the commit thread, adding latency to the commit itself. For very large transactions with many `afterCommit` dispatches, this can extend transaction duration.
- Queue backpressure during commit: if the queue backend is slow to respond, the commit thread blocks until all `afterCommit` jobs are pushed.
- Monitor the gap between dispatch registration time (logged before commit) and actual queue push time (after commit). Large gaps indicate long transactions.

---

# Security Considerations

- `afterCommit` does not provide isolation guarantees beyond committed-read visibility. If another concurrent transaction modifies the same data after commit, the worker may read state that is already stale.
- Rollback discards jobs silently. If the rollback is due to a security constraint violation (e.g., validation failure), the associated jobs are correctly discarded. If the rollback is due to a transient infrastructure error, the jobs are still discarded — use a reliable queue backend or outbox pattern for critical jobs.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming afterCommit works without transactions | `afterCommit` outside a transaction dispatches immediately | False sense of safety — no transactional guarantee | Ensure dispatch is inside `DB::transaction()` |
| Forgetting nested transaction semantics | Belief that savepoint rollback triggers afterCommit | Jobs dispatched during savepoint are NOT discarded on savepoint rollback | Only outermost transaction commit triggers afterCommit |
| Mixing afterCommit with Bus::chain | Expecting individual jobs in chain to have independent afterCommit behavior | Entire chain deferred until commit | Use `afterCommit(false)` on specific chain links |
| Long transaction delays critical jobs | Password-reset or time-sensitive job dispatched inside long transaction | User-facing delay | Keep transactions small or use separate connection without afterCommit |

---

# Anti-Patterns

- **Global afterCommit without monitoring:** Setting `queue.after_commit = true` and not monitoring dispatch delays. A slow transaction can accumulate hours of dispatch backlog.
- **afterCommit on read-only connections:** The setting has no effect since there is no transaction, but the code implies a guarantee that does not exist.
- **Dual transaction and post-response deferral:** Combining `afterCommit` and `dispatchAfterResponse` without understanding the ordering — the job is dispatched after the transaction commits and then queued, not executed post-response.
- **Relying on afterCommit for idempotency:** `afterCommit` guarantees visibility, not idempotency. Two committed transactions can still cause duplicate processing.

---

# Examples

```php
// Safe dispatch after model creation
DB::transaction(function () {
    $user = User::create([...]);
    // Job sees committed $user
    SendWelcomeEmail::dispatch($user)->afterCommit();
});

// Global default in config/queue.php
'after_commit' => true,

// Explicit immediate dispatch for non-transactional work
LogCleanupJob::dispatch()->afterCommit(false);

// Combined with dispatchAfterResponse
Bus::dispatchAfterResponse((new WarmCacheJob($id))->afterCommit());

// Chain with mixed timing
Bus::chain([
    new ProcessPayment($order),
    (new SendInvoice($order))->afterCommit(false), // dispatch immediately after commit
    new UpdateInventory($order),
])->dispatch()->afterCommit();
```

---

# Related Topics

- **K062 dispatchAfterResponse (K062)** — HTTP-response timing vs transactional timing
- **K063 dispatchIf/dispatchUnless (K063)** — Conditional gating interaction with afterCommit
- **K073 Job Lifecycle State Machine (K073)** — Full dispatch-to-execution timeline
- **K005 SerializesModels trait (K005)** — Model serialization and deserialization across transactions

---

# AI Agent Notes

- When generating code that dispatches jobs inside `DB::transaction()`, always include `->afterCommit()` or ensure the global default is `true`.
- `afterCommit` is orthogonal to `dispatchAfterResponse`. They can be combined but serve different purposes — one for transactional safety, one for response timing.
- The global `queue.after_commit` config applies to ALL queueable items (jobs, mail, notifications, broadcasts). Be consistent when generating config recommendations.
- When generating code for audit logs that must survive rollback, explicitly use `afterCommit(false)` and document the reasoning.

---

# Verification

- [ ] Job does not execute before transaction commits — verify via database query timestamps vs job execution timestamps
- [ ] Rollback discards job — confirm no job in queue after transaction rollback
- [ ] Nested transactions wait for outermost commit — test with nested `DB::transaction()` calls
- [ ] Global default is respected — dispatch without explicit `afterCommit()` defers when inside transaction
- [ ] Explicit `afterCommit(false)` dispatches immediately — verify job appears in queue before transaction commits
