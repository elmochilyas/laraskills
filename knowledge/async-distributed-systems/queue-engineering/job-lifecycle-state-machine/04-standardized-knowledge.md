# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** K073 — Job Lifecycle State Machine
- **Knowledge ID:** K073
- **Difficulty Level:** Expert
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Source — `Illuminate\Queue\Worker::process()`

---

# Overview

Every queued job progresses through a defined state machine: **dispatched → queued → popped → processing → (released/exception/failed) → completed**. The Worker class drives this lifecycle in an infinite loop. Understanding the state transitions is essential for debugging stuck jobs, timeout behavior, and retry anomalies. The state machine is not documented as a single diagram anywhere — it's derived from the Worker source code.

---

# Core Concepts

- **Dispatched:** Job pushed to queue backend via `PendingDispatch` destructor.
- **Popped:** Worker retrieved the job. Now "reserved" (invisible to other workers during `retry_after`).
- **Processing:** Worker executing `$job->handle()`. Middleware runs before and after.
- **Released:** Job called `$this->release($delay)`. Re-queued with delay. `$attempts` increments.
- **Exception thrown:** `handle()` threw. Worker checks `$attempts < $tries`. If yes: release with backoff. If no: fail.
- **Failed:** Exhausted retries. Stored in `failed_jobs`. `$job->failed()` called.
- **Completed:** Success — worker deletes job from backend.

---

# When To Use

- Understanding why jobs behave unexpectedly (retry loops, phantom processing)
- Debugging timeout-related issues and stuck jobs
- Building custom monitoring on lifecycle events

---

# Best Practices

- **Release should always have a delay.** Immediate re-release without delay causes tight retry loops that flood the queue. *Why: A release with no delay re-queues the job instantly — the worker picks it up again immediately, creating CPU waste with no progress.*
- **Fail is terminal.** The framework does not automatically retry failed jobs. Only `queue:retry` or Horizon's retry button re-enters the state machine. *Why: Failed jobs are stored permanently — they don't auto-retry. They require external intervention or a scheduled retry command.*
- **`maxExceptions` is checked separately from `$tries`.** A job can fail due to too many exceptions even if `$tries` is not exhausted. *Why: `maxExceptions` limits how many times the job can throw exceptions across all attempts — once exceeded, the job fails immediately regardless of remaining `$tries`.*

---

# Performance Considerations

- Each state transition = at least one backend operation (push/pop/delete).
- Failed jobs add another backend write (DB insert).
- At 1000+ jobs/sec, cumulative transition overhead is measurable.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Modifying `$tries` while jobs in flight | Configuration change | Partially-processed jobs get unexpected retry counts | Drain queue before changing `$tries` |
| Calling `delete()` after `release()` | Both called in error handler | `delete()` wins — job removed, retry skipped | Only call one of delete/release |
| `release()` without delay in loop | Immediate re-queue | Infinite tight loop — CPU 100% | Always provide a delay |

---

# Examples

```
dispatched → queued → popped → [middleware] → handle()
                                                ↓
                                         success? → delete() → completed
                                        /         \
                                  exception → attempts < tries?
                                               /              \
                                         release()         fail()
                                             ↓                 ↓
                                          re-queued        failed_jobs
```

---

# Related Topics

- **K016 Failure Taxonomy (K016)** — Release/exception/fail states
- **K024 Retry Workflow (K024)** — Re-entering the state machine
