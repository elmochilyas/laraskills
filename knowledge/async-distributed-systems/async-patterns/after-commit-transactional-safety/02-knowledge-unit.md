# Metadata
Domain: Async & Distributed Systems
Subdomain: Async Dispatch Patterns
Knowledge Unit: afterCommit Transactional Safety
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
The `afterCommit` dispatch option prevents a class of race conditions where a queued job executes before the database transaction that created its data has committed. When a job is dispatched inside a database transaction, the worker may read stale or missing data. `afterCommit` defers the actual queue push until after the outermost transaction commits, ensuring the worker always sees committed data.

# Core Concepts
- **Transaction-visibility race**: A job dispatched inside a `DB::transaction()` is pushed to the queue immediately. The worker can pick it up before the transaction commits, querying data not yet visible to other connections.
- **afterCommit registration**: `afterCommit` registers the dispatch as pending, only pushing to the queue backend after the transaction successfully commits.
- **Rollback behavior**: If the transaction rolls back, the dispatch is silently discarded — the job never enters the queue.
- **Global default**: The `queue.after_commit` config option sets the default for all dispatches on that connection. Individual dispatches can override it.
- **Outer-transaction scope**: In nested transactions (savepoints), `afterCommit` waits for the outermost transaction to commit.
- **afterCommit vs. afterResponse**: These are orthogonal — `afterCommit` controls transactional timing; `dispatchAfterResponse` controls HTTP-response timing. They can be combined.

# Mental Models
- **Stage door**: The actor (data) must be fully on stage before the announcement (job) goes out. afterCommit holds the announcement until the actor is confirmed on stage.
- **Airline gate closure**: You don't tell the gate to close until the last passenger has boarded (transaction commits). If boarding fails (rollback), you never send the close signal.
- **Double-checked handshake**: The request says "I'm ready to push" but waits for the "committed" signal from the database before actually pushing.

# Internal Mechanics
- When `afterCommit` is set, `PendingDispatch` registers a callback on the `DB` facade's `afterCommit` hook via `Bus::dispatchAfterCommit()`.
- The transaction manager in `Illuminate\Database\DatabaseTransactionsManager` maintains a stack of closure callbacks keyed by transaction level.
- On commit, the manager pops all callbacks registered at each transaction level and executes them.
- Each callback calls the underlying queue driver's `push()` method.
- On rollback, the callbacks are discarded without execution.
- If no transaction is active when `afterCommit` is set, the job is dispatched immediately — `afterCommit` has no effect outside a transaction.
- The config default `queue.after_commit` sets `$this->afterCommit` on new `PendingDispatch` instances via the `QueueManager`.

# Patterns
## Dispatch After Model Creation
- **Purpose**: Send a notification or start a workflow after a new user registers.
- **Benefits**: Worker always sees the new user record. No race condition on `User::find()` returning null.
- **Tradeoffs**: If the transaction takes long (multiple model saves), the dispatch is delayed accordingly.

## Cascade Delete Safety
- **Purpose**: Queue a cleanup job after deleting a parent record and its relations.
- **Benefits**: The entire cascade is committed before the worker attempts to access related data.
- **Tradeoffs**: Workers may see the parent as deleted but relations as still present if the cascade is within the same transaction.

## Multi-Model Transaction Workflow
- **Purpose**: Create an order, charge the customer, update inventory — then dispatch fulfillment jobs.
- **Benefits**: All transactional changes are visible to the worker atomically.
- **Tradeoffs**: Workers may be delayed until the entire workflow commits. Long transactions delay dispatch.

# Architectural Decisions
- Set `queue.after_commit` to `true` in config as the default for all queue connections. Override with `->afterCommit(false)` per-dispatch where immediate dispatch is required.
- Use `afterCommit: false` explicitly for non-transactional side effects like incrementing a cache counter or logging an event where transactional consistency is irrelevant.
- When `afterCommit` is the global default, you must explicitly opt-in to immediate dispatch. This is safer but may surprise developers who dispatch jobs outside transactions and expect them to push immediately.

# Tradeoffs
Global `after_commit: true` is the safest default | Adds cognitive overhead — developers must remember `afterCommit(false)` for immediate dispatch
Transactional safety guarantees | Dispatch is delayed for the duration of the transaction
Rollback discards jobs automatically | Jobs that should fire even on rollback (like audit logs) cannot use afterCommit
Works with all queue drivers | No effect outside transactions — can give false sense of safety

# Performance Considerations
- The callback registration is an in-memory operation — negligible overhead.
- The queue push happens on the commit thread, adding latency to the commit itself. For very large transactions with many `afterCommit` dispatches, this can extend transaction duration.
- Queue backpressure during commit: if the queue backend is slow to respond, the commit thread blocks until all `afterCommit` jobs are pushed.

# Production Considerations
- Never assume `afterCommit` implies the transaction is small. A long transaction delays all `afterCommit` dispatches equally.
- Monitor the gap between dispatch registration time (logged before commit) and actual queue push time (after commit). Large gaps indicate long transactions.
- Test rollback scenarios: verify jobs are not dispatched when a transaction rolls back. This is especially important for financial transactions where duplicate processing is costly.

# Common Mistakes
- **Assuming afterCommit works without transactions**: `afterCommit` outside a transaction dispatches immediately. The config default only sets the preference — it does not wrap code in a transaction.
- **Forgetting nested transaction semantics**: In MySQL with savepoints, a rollback to a savepoint does NOT trigger `afterCommit` callbacks — only full transaction commit does.
- **Combining afterCommit with Bus::chain()**: The entire chain is deferred until commit, not individual jobs. If one job in the chain should dispatch immediately, it must use `afterCommit(false)` explicitly.
- **Mixing afterCommit and dispatchAfterResponse**: Both defer dispatch — `afterCommit` waits for DB commit, `dispatchAfterResponse` waits for HTTP response. They are independent and composable.

# Failure Modes
- **Commit succeeds, push fails**: The transaction commits successfully, but the queue push fails (Redis down, SQS throttled). The job is lost. Mitigation: use a reliable queue backend or implement an outbox pattern with a dedicated job table.
- **Long transaction delays critical jobs**: A slow transaction holding an `afterCommit` dispatch for a password-reset email can cause user-facing delays. Mitigation: keep transactions small or use dedicated connections without `afterCommit` for time-sensitive dispatches.
- **Phantom reads if isolation level is READ_COMMITTED**: The worker sees committed data, but another concurrent transaction may have modified it. `afterCommit` guarantees visibility, not stability.

# Ecosystem Usage
- **Laravel Horizon**: Jobs dispatched with `afterCommit` appear in Horizon only after the transaction commits. The delay between registration and visibility can confuse debugging.
- **Laravel Pulse**: Pulse metrics show dispatch timestamps — `afterCommit` dispatches show the push time (post-commit), not the registration time.

# Related Knowledge Units
- K062 dispatchAfterResponse (HTTP-response timing) | K063 dispatchIf/dispatchUnless (conditional gating) | K073 Job Lifecycle State Machine (full dispatch-to-execution timeline)

# Research Notes
Setting `queue.after_commit` to `true` in config is one of the highest-leverage configuration changes for data consistency. It prevents a class of bugs that are extremely hard to reproduce due to their timing-dependent nature. The performance cost is negligible for the safety gain. Laravel 11 made `afterCommit` default for new applications.

## Research Notes
- The dispatchAfterResponse() method pushes the job to the queue after the HTTP response is sent to the client — this is useful for non-critical background tasks that can be lost if the process crashes after response delivery.
- The dispatchIf() and dispatchUnless() conditional dispatch methods evaluate a condition at dispatch time — if the condition changes before the job processes, the job still executes; conditions are not re-evaluated on the worker.
- The fterCommit method defers job dispatch until the current database transaction commits — this prevents workers from processing jobs that reference uncommitted data, avoiding the "phantom read" problem in queue workers.
- The Defer pattern (Laravel 12+) provides Defer::create() for deferred execution within the same request lifecycle — unlike queued jobs, deferred functions execute synchronously after the response is sent but within the same PHP process.
- dispatchAfterResponse does not use the queue system at all — it registers a shutdown function that executes after the response is sent, meaning it runs in the web server process, not in a dedicated queue worker.
- Community best practice for transactional safety recommends always using fterCommit() when dispatching jobs within database transactions, even for seemingly independent operations.
- The dispatchIf pattern combined with fterCommit creates a potential race condition — the dispatch condition is evaluated before the transaction commits, but the job is only dispatched after commit, leading to scenarios where the condition may no longer be valid.
- Understanding the distinction between deferred execution (same process, after response) and queued execution (worker process, potentially much later) is critical for choosing the right dispatch pattern.
