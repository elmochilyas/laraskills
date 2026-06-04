# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Async Dispatch Patterns
- **Knowledge Unit:** K065 — Defer Pattern (Laravel 12)
- **Knowledge ID:** K065
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Defer: Batch Deferred Work
  - Laravel Source — `Illuminate\Bus\DeferredBatch`
  - Laravel 12 release notes

---

# Overview

The defer pattern, introduced in Laravel 12 via `Bus::defer()`, provides a first-class mechanism for batching deferred work that executes after the HTTP response is sent but before the process terminates. Unlike `dispatchAfterResponse` which runs one job at a time, `Bus::defer()` collects multiple closures and jobs into a single batch that runs collectively during kernel termination. It replaces the manual pattern of collecting post-response work and executing it in terminating middleware.

---

# Core Concepts

- **Deferred batch:** `Bus::defer()` returns a `DeferredBatch` instance. Closures and jobs appended to it are collected in-memory and executed collectively during kernel termination.
- **Batch-wise execution:** All deferred callbacks run sequentially in a single PHP process after the response is sent, in the order they were added.
- **Merge behavior:** Multiple calls to `Bus::defer()` within the same request return the same `DeferredBatch` instance — all callbacks accumulate into one batch.
- **Cancellation:** A deferred batch can be cancelled before termination via `Bus::defer()->cancel()`, preventing any queued callbacks from executing.
- **Error isolation:** Each callback is wrapped in a try-catch. A failure in one callback does not prevent subsequent callbacks from running.
- **No queue dependency:** Deferred callbacks run in the same process, post-response. No queue worker, no serialization, no Redis/DB backend required.

---

# When To Use

- Collecting and flushing multiple post-response tasks in a defined sequence
- Log aggregation — accumulate log entries during request and flush in a single batch
- Metric collection — gather request metrics and push to monitoring after response
- Tiered post-response work where ordering matters (critical work first, non-critical later)
- Fast work (< 1 second total batch time) that is failure-tolerant
- Replacing manual terminating middleware callback arrays

---

# When NOT To Use

- Work that requires retry guarantees — deferred callbacks have no persistence
- Work that must survive process crashes — lost on process termination
- Work that takes > 1 second — blocks PHP-FPM child and reduces concurrent capacity
- Work that needs parallelism — all callbacks run sequentially in one thread
- Laravel Octane or Roadrunner — these runtimes do not trigger kernel termination reliably
- When only a single post-response task is needed — `dispatchAfterResponse` is simpler

---

# Best Practices

- **Keep each callback idempotent.** If the process crashes mid-batch, some callbacks may have completed and some may not. Idempotent callbacks allow safe retry on the next request.
- **Call `cancel()` in exception handlers.** If the primary request logic fails (e.g., validation error, authorization failure), the deferred batch should typically not execute.
- **Log at the start and end of the deferred batch.** Because the response is already sent, logging is the primary visibility mechanism. Without explicit logging, failures in the batch are silent.
- **Keep captured data minimal in closures.** Closures capture variables by reference or value. Large payloads prevent early garbage collection and increase memory pressure during batch execution.
- **Never exceed `max_execution_time`.** A deferred batch that exceeds this limit is killed mid-execution, completing only partial work. Set local timeouts inside the batch if needed.

---

# Architecture Guidelines

- `Bus::defer()` returns a singleton per request. All calls within a request share the same batch. This is by design — use it for accumulating work, not for isolating batches.
- The execution order is FIFO — callbacks run in the order they were added. Use this for dependency ordering (cache warm → metrics flush → analytics ping).
- Error isolation wraps each callback individually. If callback A fails, callbacks B, C, and D still run. This is a contract — do not rely on previous callback success in subsequent callbacks.
- Deferred callbacks bypass the queue system entirely. They do not appear in Horizon, Pulse, or any queue monitoring tools.

---

# Performance Considerations

- Deferred callbacks extend PHP-FPM process lifetime by the sum of all callback execution times. A batch of 10 callbacks at 100ms each adds 1 second of process time.
- Memory accumulates during batch building and is only freed after execution completes. Large payloads captured in closures prevent early garbage collection.
- CPU-bound callbacks in the deferred batch compete with request-handling processes. If the process pool is saturated, deferred batches increase backlog.
- The batch is cleared after execution to prevent double-execution on subsequent requests in persistent runtimes.

---

# Security Considerations

- Deferred callbacks run in the same process with the same privileges as the HTTP request. Any privilege escalation in the request handler carries into the deferred batch.
- Cancel the batch if the request fails authorization — `Bus::defer()->cancel()` prevents execution of callbacks that may assume authorized state.
- Sensitive data captured in closure bindings is retained in memory until the batch executes. For highly sensitive operations, use queue dispatch to isolate execution contexts.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming async parallelism | Belief that deferred callbacks run concurrently | All callbacks run sequentially in the same thread — no performance gain | Use queue dispatch with multiple workers for parallel work |
| Relying on destructor execution | Depending on `__destruct()` fallback for critical work | Destructor may not run in all PHP SAPIs or during fatal errors | Always rely on kernel termination, not destructor |
| Forgetting `cancel()` on failure | Request fails but deferred callbacks still execute | Callbacks may operate on invalid or partial state | Call `cancel()` in all exception/error handlers |
| Mixing defer with queue dispatch | Dispatching a queued job inside a deferred callback | Job is queued during termination, not during request handling — unexpected timing | Be aware of the deferred timing semantics |

---

# Anti-Patterns

- **Deferring slow work:** Running >1 second operations in the deferred batch. Blocks the PHP-FPM child and defeats the purpose of post-response execution.
- **Deferring critical business logic:** Relying on in-memory, non-persistent execution for operations like order fulfillment or payment processing. These belong in a real queue.
- **Using defer as a queue replacement:** Adopting `Bus::defer()` for all async work because "it's simpler." Loses retry, persistence, monitoring, and worker isolation.
- **Ignoring Octane incompatibility:** Deploying to Octane without testing — deferred work silently fails because kernel termination does not trigger as expected.

---

# Examples

```php
// Basic defer usage
Bus::defer(function () {
    Log::info('Request completed, flushing metrics');
    Metrics::flush();
});

Bus::defer(function () {
    Cache::warm('dashboard_data');
});

// Multiple callbacks accumulate in one batch
Bus::defer(fn () => incrementCounter('page_view'));
Bus::defer(fn () => pushToAnalytics($requestData));
// Both run in FIFO order after response

// Cancellation on failure
try {
    $order = Order::create($data);
    Bus::defer(fn () => Cache::warmOrderStats($order->id));
} catch (Exception $e) {
    Bus::defer()->cancel();
    throw $e;
}

// Tiered post-response work
Bus::defer(fn () => $cache->warm());       // critical — run first
Bus::defer(fn () => $analytics->flush());  // non-critical — run second
Bus::defer(fn () => $logger->rotate());    // best-effort — run last
```

---

# Related Topics

- **K062 dispatchAfterResponse (K062)** — Single job post-response vs grouped defer pattern
- **K064 afterCommit transactional safety (K064)** — Transaction timing vs response timing (orthogonal)
- **K073 Job Lifecycle State Machine (K073)** — Full lifecycle comparison across dispatch patterns

---

# AI Agent Notes

- `Bus::defer()` is Laravel 12+. When generating code for older Laravel versions, use `dispatchAfterResponse` for single jobs or custom terminating middleware for batches.
- Deferred callbacks are NOT queued jobs. They run in the same PHP process post-response. When generating code for work that needs reliability, use queue dispatch instead.
- In Octane context, `Bus::defer()` is not supported. Always generate queue dispatch code for Octane applications.
- When generating defer code, always include a `cancel()` call in exception handlers as a defensive pattern.

---

# Verification

- [ ] Callbacks execute after response — verify via logging timestamps (response send vs callback execution)
- [ ] Callbacks run in FIFO order — verify by introducing sequential side effects with observable ordering
- [ ] Error isolation works — introduce a failing callback and confirm subsequent callbacks still execute
- [ ] Cancellation works — call `cancel()` and verify no callbacks execute
- [ ] Merge behavior — verify multiple `Bus::defer()` calls accumulate into one batch
- [ ] No queue involvement — confirm no job appears in Horizon or queue backend
- [ ] Octane compatibility — verify deferred work does not run (or is converted) in Octane
