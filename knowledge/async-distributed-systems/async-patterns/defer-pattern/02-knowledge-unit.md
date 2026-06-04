# Metadata
Domain: Async & Distributed Systems
Subdomain: Async Dispatch Patterns
Knowledge Unit: Defer Pattern (Laravel 12)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
The defer pattern, introduced in Laravel 12 via `Bus::defer()`, provides a first-class mechanism for batching deferred work that executes after the HTTP response is sent but before the process terminates. Unlike `dispatchAfterResponse` which runs one job at a time, `Bus::defer()` collects multiple closures and jobs into a single batch that runs collectively during kernel termination. It replaces the manual pattern of collecting post-response work and executing it in terminating middleware.

# Core Concepts
- **Deferred batch**: `Bus::defer()` returns a `DeferredBatch` instance. Closures and jobs appended to it are collected in-memory and executed collectively during kernel termination.
- **Batch-wise execution**: All deferred callbacks run sequentially in a single PHP process after the response is sent, in the order they were added.
- **Merge behavior**: Multiple calls to `Bus::defer()` within the same request return the same `DeferredBatch` instance — all callbacks accumulate into one batch.
- **Cancellation**: A deferred batch can be cancelled before termination via `Bus::defer()->cancel()`, preventing any queued callbacks from executing.
- **Error isolation**: Each callback is wrapped in a try-catch. A failure in one callback does not prevent subsequent callbacks from running.
- **No queue dependency**: Deferred callbacks run in the same process, post-response. No queue worker, no serialization, no Redis/DB backend required.

# Mental Models
- **Post-show cleanup crew**: The main event (response) finishes, the audience leaves, and the cleanup crew (deferred batch) enters the venue to reset everything for the next show.
- **Airline turnaround**: Passengers deplane (response sent), then the ground crew (deferred callbacks) cleans, refuels, and restocks in a specific sequence before the next boarding.
- **Kitchen closing shift**: The restaurant closes (response sent), then the closing crew runs through a checklist — wash dishes, lock registers, set alarm — in order. If one task fails, the rest still run.

# Internal Mechanics
- `Bus::defer()` returns a singleton `DeferredBatch` stored on the `Bus` facade instance.
- The `DeferredBatch` implements `__destruct()` as a safety net, but the primary execution trigger is the kernel's `terminating` middleware.
- During kernel termination, `DeferredBatch::execute()` is called, which iterates all registered callbacks.
- Each callback is invoked in a try-catch within a `foreach` loop. `$results` are collected but not exposed — the batch does not return execution results to the caller.
- The deferred batch is cleared after execution to prevent double-execution on subsequent requests in persistent runtimes (Octane, Swoole).
- `cancel()` sets an internal `$cancelled` flag. The `execute()` method checks this flag and returns immediately if set.

# Patterns
## Post-Response Log Aggregation
- **Purpose**: Collect multiple log entries during the request and flush them in a single batch after response.
- **Benefits**: Reduces log IO during request handling. Improved response latency.
- **Tradeoffs**: Log entries are lost if the process crashes before termination.

## Metric Collection and Flush
- **Purpose**: Accumulate metrics (request count, duration, DB query count) and push to monitoring after response.
- **Benefits**: Metric submission does not add to response time.
- **Tradeoffs**: Process crash before termination loses the current request's metrics.

## Tiered Post-Response Work
- **Purpose**: Execute critical post-response work first (cache warm), then non-critical work (analytics ping).
- **Benefits**: Ordering guarantees within the deferred batch.
- **Tradeoffs**: All callbacks share the same PHP process — one slow callback delays all subsequent ones.

# Architectural Decisions
- Use `Bus::defer()` when you need to collect and execute multiple post-response tasks in a defined sequence, especially when they depend on order.
- Prefer `dispatchAfterResponse` for a single post-response job where grouping is unnecessary.
- Prefer real queue dispatch when work is slow (> 1 second), must be retried, or should not block process termination.
- Use defer for "flush and forget" patterns where work is fast (milliseconds) and failure-tolerant.

# Tradeoffs
Multiple callbacks collected into one batch per request | All callbacks share the same process — no parallelism
Failure in one callback does not block others | Ordering is sequential — a slow callback blocks the rest
No queue infrastructure needed | No retry, no persistence, no worker isolation
Cancellation at any point before termination | Cancel flag is in-memory — cannot persist across crash

# Performance Considerations
- Deferred callbacks extend PHP-FPM process lifetime by the sum of all callback execution times. A batch of 10 callbacks at 100ms each adds 1 second of process time.
- Memory accumulates during batch building and is only freed after execution completes. Large payloads captured in closures prevent early garbage collection.
- CPU-bound callbacks in the deferred batch compete with request-handling processes. If the process pool is saturated, deferred batches increase backlog.

# Production Considerations
- `Bus::defer()` is not compatible with Octane or Roadrunner — these runtimes manage lifecycle differently and may not trigger kernel termination reliably.
- Monitor PHP-FPM `max_execution_time` — a deferred batch that exceeds this limit is killed mid-execution, completing only partial work.
- Because deferred callbacks run after response, error logs may be attributed to the next request or lost entirely. Add explicit logging at the beginning and end of the deferred batch.
- Use `cancel()` liberally in exception handlers — if the primary request logic fails, the deferred batch should typically not execute.

# Common Mistakes
- **Assuming async parallelism**: All deferred callbacks run sequentially in the same thread. No concurrent execution.
- **Forgetting error isolation**: While each callback is caught individually, uncaught exceptions in the `execute()` loop itself can halt the batch. Wrap the entire defer block if needed.
- **Relying on destructor execution**: The `__destruct()` fallback is not guaranteed to run in all PHP SAPIs or during fatal errors. Do not depend on it for critical work.
- **Mixing with queues**: Deferred callbacks are not queued jobs. If a callback dispatches a queued job inside, that job is queued during termination, not during request handling.

# Failure Modes
- **Process termination during batch execution**: The process is killed (OOM, `max_execution_time`, or manual restart) mid-batch. Partial work is done. Mitigation: make each callback idempotent.
- **Memory exhaustion during batch**: Callbacks accumulate state during request handling. At termination time, the memory footprint triggers OOM kill. Mitigation: keep captured data minimal.
- **Double execution in persistent runtimes**: In Octane, the deferred batch state may persist across requests. Mitigation: Laravel clears the batch after execution, but custom code that does not go through `Bus::defer()` may not.

# Ecosystem Usage
- **Laravel Octane**: Deferred callbacks are not supported. Octane does not run kernel-terminating middleware per-request in the same way. Use real queue dispatch in Octane.
- **Laravel Horizon**: No interaction — deferred work bypasses Horizon entirely.

# Related Knowledge Units
- K062 dispatchAfterResponse (single post-response job) | K064 afterCommit transactional safety (transaction timing vs response timing) | K073 Job Lifecycle State Machine (full lifecycle comparison)

# Research Notes
`Bus::defer()` is the most significant addition to Laravel's async dispatch API since `dispatchAfterResponse`. It formalizes a pattern that teams previously implemented with custom terminating middleware and manual callback arrays. The key advantage over `dispatchAfterResponse` is batch grouping, ordered execution, and cancellation — making it suitable for multi-step post-response workflows. The key limitation is the same: no persistence, no retry, no worker isolation.

## Research Notes
- The dispatchAfterResponse() method pushes the job to the queue after the HTTP response is sent to the client — this is useful for non-critical background tasks that can be lost if the process crashes after response delivery.
- The dispatchIf() and dispatchUnless() conditional dispatch methods evaluate a condition at dispatch time — if the condition changes before the job processes, the job still executes; conditions are not re-evaluated on the worker.
- The fterCommit method defers job dispatch until the current database transaction commits — this prevents workers from processing jobs that reference uncommitted data, avoiding the "phantom read" problem in queue workers.
- The Defer pattern (Laravel 12+) provides Defer::create() for deferred execution within the same request lifecycle — unlike queued jobs, deferred functions execute synchronously after the response is sent but within the same PHP process.
- dispatchAfterResponse does not use the queue system at all — it registers a shutdown function that executes after the response is sent, meaning it runs in the web server process, not in a dedicated queue worker.
- Community best practice for transactional safety recommends always using fterCommit() when dispatching jobs within database transactions, even for seemingly independent operations.
- The dispatchIf pattern combined with fterCommit creates a potential race condition — the dispatch condition is evaluated before the transaction commits, but the job is only dispatched after commit, leading to scenarios where the condition may no longer be valid.
- Understanding the distinction between deferred execution (same process, after response) and queued execution (worker process, potentially much later) is critical for choosing the right dispatch pattern.
