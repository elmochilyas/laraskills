# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Engineering
Knowledge Unit: `PendingDispatch` Lifecycle
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
`PendingDispatch` is the fluent wrapper object returned by a job's `dispatch()` method. It holds the job instance and allows method chaining (`onQueue()`, `onConnection()`, `delay()`, `afterCommit()`) before the job is actually pushed to the queue. The critical behavior is that dispatch happens in the destructor of `PendingDispatch` — not in the `dispatch()` call itself. This has implications for conditional dispatch, scope lifetime, and the order of operations when chaining methods.

# Core Concepts
- **`PendingDispatch`**: A `Illuminate\Foundation\Bus\PendingDispatch` object returned by `dispatch()`.
- **Deferred dispatch**: The `PendingDispatch` destructor calls `$bus->dispatchToQueue($this->job)` when the object goes out of scope.
- **Fluent chain**: `dispatch()->onQueue('high')->onConnection('sqs')` — each method returns `$this` for chaining.
- **Immediate dispatch**: Calling `dispatchIf(true)` or `dispatchUnless(false)` bypasses `PendingDispatch` and dispatches directly.
- **`__destruct()` dispatch**: The job is pushed to the queue when PHP destroys the `PendingDispatch` object — at the end of the current statement expression or when the variable goes out of scope.

# Mental Models
- **I.O.U. slip**: `dispatch()` gives you a slip (PendingDispatch) saying "this job will be dispatched." You can write instructions on the slip (onQueue, delay) before cashing it in (destructor).
- **Builder pattern**: Like a query builder — construct the instruction set, then execute on evaluation (destruction).
- **Promise**: A deferred execution — the `PendingDispatch` promises to dispatch the job, but hasn't yet. It fulfills the promise when the promise object is garbage collected.

# Internal Mechanics
- `dispatch()` is defined in the `Dispatchable` trait. It calls `new PendingDispatch(new static(...))`.
- `PendingDispatch::__construct($job)` stores the job and sets default values from the job's public properties.
- Chained methods (`onQueue`, `onConnection`, `delay`, `allOnQueue`, `allOnConnection`, `afterCommit`) mutate the `PendingDispatch` instance.
- `PendingDispatch` also stores `$this->after_commit` based on job's `$after_commit` property.
- In `__destruct()`:
  1. If `$this->after_commit` is true and a DB transaction is active, the `afterCommit` callback is registered and the job is held until commit.
  2. Otherwise, `$bus->dispatchToQueue($this->job)` is called.
- If the `PendingDispatch` is assigned to a variable, its lifetime extends to the variable's scope. If not assigned, it's destroyed at the end of the parent statement.
- `Bus::dispatchToQueue($job)` is where the actual queue push happens via the `QueueManager`.

# Patterns
## Conditional Chaining
- **Purpose**: Apply dispatch configuration conditionally.
- **Benefit**: Readable dispatch chains without complex if/else blocks.
- **Tradeoff**: Conditionals must be evaluated before the destructor fires.

## Aliased Assignment for Delayed Dispatch
- **Purpose**: Keep job in `PendingDispatch` state for longer.
- **Benefit**: Allows middleware to be registered after dispatch call.
- **Tradeoff**: Must ensure the variable scope collapses when dispatch is desired.

## Direct Bus Dispatch
- **Purpose**: Bypass `PendingDispatch` entirely.
- **Benefit**: Full control over dispatch timing; useful in complex scenarios.
- **Tradeoff**: Loses the convenience of `dispatch()` syntax.

# Architectural Decisions
- **Use `dispatch()` for standard cases**: The fluent API and deferred dispatch handle 95% of scenarios correctly.
- **Use `Bus::dispatchToQueue()` when** you need to bypass the destructor-based dispatch and control exactly when the job gets queued.
- **Use `dispatchIf()` / `dispatchUnless()` for conditional dispatch**: These methods dispatch immediately (no `PendingDispatch`) — better than a conditional wrapping `dispatch()`.

# Tradeoffs
Destructor-based dispatch | Clean API, fluent chaining | Dispatch timing is non-obvious; tied to object lifetime
Immediate dispatch (dispatchSync) | Deterministic timing, no destructor dependency | Blocks request, not async
Bus::dispatch() bypass | Full control | Bypasses serialization layer in some paths

# Performance Considerations
- The `PendingDispatch` object is temporary and lightweight — microseconds of overhead.
- The destructor check for active transaction (`transaction_level > 0`) is cheap.
- If multiple `PendingDispatch` objects are created in a loop (batch dispatch), all destructors fire at the end of the loop scope or iteration — stack order matters.

# Production Considerations
- Do NOT rely on the destructor for destructor ordering. PHP destructors may fire in unexpected order if exceptions occur.
- If a `PendingDispatch` is assigned to a variable in a loop, the destructor fires when the variable is overwritten or at the end of the loop iteration.
- The `afterCommit` behavior interacts with nested transactions — only the top-level commit triggers dispatch.

# Common Mistakes
- **Assigning `dispatch()` to a variable and wondering why the job hasn't dispatched**: `$pending = MyJob::dispatch()` keeps the `PendingDispatch` alive until the variable goes out of scope. The job doesn't dispatch until the destructor.
- **Not catching exceptions in `dispatch()` chain**: If a chained method throws an exception (e.g., invalid connection name), the job never dispatches because the destructor never fires.
- **Assuming `dispatch()` dispatches immediately in tests**: In a test, `Queue::fake()` intercepts the actual push, but the `PendingDispatch` destructor still fires. The faked assertion happens against the stored queue.

# Failure Modes
- **Destructor never called**: If PHP's garbage collector is interrupted by a fatal error, some `PendingDispatch` destructors may not fire. Jobs within the destructor are lost.
- **Destructor order non-determinism**: With multiple `PendingDispatch` instances, destruction order depends on GC cycle order. Not predictable for batch dispatch use cases.
- **Forever pending**: If `afterCommit` is set but the transaction never commits (e.g., script timeout), the `PendingDispatch` object is destroyed without dispatching. The queued callback fires on commit only if the transaction was properly managed.

# Ecosystem Usage
- **Laravel Bus service**: `Bus::dispatch()` internally calls `new PendingDispatch`. All dispatch paths converge here.
- **Horizon**: Tagging middleware is registered by the `PendingDispatch` in some versions — the tags are not on the job class but applied during the dispatch chain.
- **Spatie webhook-server**: Uses `dispatch()` — the webhook job goes through the standard `PendingDispatch` lifecycle.

# Related Knowledge Units
- K003 Queue Manager and Connector Pattern (where `dispatchToQueue` resolves) | K064 `afterCommit` Transactional Safety (interaction with transaction lifecycle)

## Research Notes
- The Queue::route() method introduced in Laravel 11 allows mapping job classes to specific connection/queue combinations at dispatch time, evaluated lazily — this changes the mental model from dispatch-time resolution to routing-time resolution.
- Laravel 12 introduced the ailover connection driver for queue HA, but automatic failback is not supported — the primary connection must be manually restored after it recovers.
- The fter_commit option has different behavior across drivers: Redis queues honor it via transaction callbacks; SQS queues rely on the fter_commit config key at the connection level.
- Octane compatibility for queue dispatching is an ongoing concern — the QueueManager is resolved from the container and may hold stale references between requests in persistent application contexts.
- Serializing models for queued jobs uses ModelIdentifier under the hood — the trait SerializesModels handles this by converting model instances to identifiers before serialization and rehydrating them after unserialization.
- Community benchmarks show Redis queue throughput of 10,000+ jobs/second with Horizon, while SQS throughput is limited by API rate limits (3,000 messages/second per account per region initially).
