# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** K088 — Job Faking and Testing
- **Knowledge ID:** K088
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Testing: Queue Faking
  - Laravel Source — `Illuminate\Support\Testing\Fakes\QueueFake`

---

# Overview

`Queue::fake()` intercepts all queue push operations, storing jobs in an in-memory array for assertion without executing them. The faking mechanism binds a `FakeQueue` over the real `QueueManager`, capturing dispatched jobs with their connection, queue, delay, and payload metadata. Testing patterns include asserting a job was pushed (with specific queue/connection), asserting it was not dispatched, and asserting specific properties on the job instance. `Bus::fake()` extends this to batches and chains.

---

# Core Concepts

- **`Queue::fake()`:** Swaps `QueueManager` with `QueueFake` — captures all dispatched jobs.
- **`Bus::fake()`:** Captures batch/chain dispatches via `BusFake`.
- **Assertions:** `assertPushed()`, `assertNotPushed()`, `assertPushedOn()`, `assertCount()`.
- **Job querying:** `pushed()` returns `Collection` of `FakeJob` — filter by class, closure, or callable.
- **Batch assertions:** `assertBatchDispatched()` — verify batch structure and callbacks.

---

# When To Use

- **Fake all dispatches in unit tests** — prevents accidental async side effects.
- **Test dispatch separately from job logic** — `Queue::fake()` for dispatch behavior; `dispatchSync()` for job logic.
- **Selective faking** — `Queue::fake(['redis'])` fakes only specific connections.

---

# When NOT To Use

- Integration tests that need full pipeline (including serialization) — use a real queue backend.
- Testing closure serialization — fakes store job as object, never serialize.
- `Bus::fake()` for individual jobs — `Queue::fake()` covers individual dispatches; `Bus::fake()` is for batches/chains.

---

# Best Practices

- **Fake in unit tests, process in integration tests.** Unit tests should verify dispatch behavior, not execution. Integration tests should exercise the full pipeline. *Why: `Queue::fake()` isolates dispatch assertions from async execution — no side effects, deterministic results. Real execution needs an actual queue backend.*
- **Test job logic separately using `dispatchSync()`.** `Queue::fake()` prevents execution — test `handle()` by running the job synchronously. *Why: Job logic tests should not depend on the dispatch mechanism. `dispatchSync()` calls `handle()` inline, testing only the job's business logic.*
- **Use callback assertions for precise matching.** `assertPushed(function ($job) { return $job->orderId === 123; })` — more specific than class name matching. *Why: Class name matching catches the wrong job if multiple jobs of the same class are dispatched with different data — callback assertions verify specific properties.*
- **Clean up between tests.** Reset fakes in `setUp()` or `tearDown()` to prevent leaky state across tests. *Why: `QueueFake` accumulates jobs in memory — without cleanup, a later test sees jobs from an earlier test, causing false positives.*

---

# Performance Considerations

- `Queue::fake()` stores all jobs in memory — large dispatches (thousands) increase memory usage.
- Each assertion filters the entire pushed array — O(n) per assertion.
- Fakes don't serialize jobs — real serialization issues (e.g., non-serializable properties) are not caught.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Asserting without faking | `Queue::fake()` not called | Jobs go to real queue — assertion misses them | Call `Queue::fake()` before action |
| `assertPushed()` with closures | Closures have no class name | Assertion fails | Use `assertPushed(CallQueuedClosure::class)` |
| Testing job logic with fake active | `Queue::fake()` blocks execution | Job never runs — test passes vacuously | Test separately with `dispatchSync()` |
| Missing `Bus::fake()` for batches | `Queue::fake()` doesn't capture Bus | Batch assertions fail | Use `Bus::fake()` for batch/chain tests |

---

# Examples

```php
public function test_order_processed_dispatches_job(): void
{
    Queue::fake();

    ProcessOrder::dispatch($order);

    Queue::assertPushed(ProcessOrder::class);
    Queue::assertPushedOn('orders', ProcessOrder::class);
    Queue::assertPushed(function (ProcessOrder $job) use ($order) {
        return $job->orderId === $order->id;
    });
}
```

---

# Related Topics

- **K006 ShouldQueue Contract (K006)** — What gets faked
- **K007 PendingDispatch Lifecycle (K007)** — Dispatch timing in tests
