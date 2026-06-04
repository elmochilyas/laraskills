# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Retry & Failure Handling
- **Knowledge Unit:** K016 — Failure Taxonomy: Release / Exception / Fail
- **Knowledge ID:** K016
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Source — `Illuminate\Queue\Worker::process()`

---

# Overview

Laravel categorizes job failures into three types: **release** (explicit re-queue with delay), **exception** (automatic retry up to `$tries`), and **fail** (terminal with permanent storage). Each triggers different code paths: release returns the job to the queue immediately, exception decrements the attempt counter and may release with backoff, and fail moves the job to `failed_jobs` and calls `$job->failed()`. A job can progress through all three states.

---

# Core Concepts

- **Release:** Job calls `$this->release($delay)`. Returns to queue with `attempts++`. No exception thrown. Controlled retry.
- **Exception:** `handle()` throws uncaught exception. Worker catches, decrements remaining tries, releases with backoff or fails.
- **Fail:** Terminal. Exhausted retries, OR `$this->fail()` called. Moves to `failed_jobs`, calls `failed()`, dispatches `Queue::failing` event.
- **`$this->fail()`:** Explicit fail without consuming a retry attempt. Immediately moves to failed state.

---

# When To Use

- **Release:** API rate limits hit, known recovery window — controlled backoff without "real" failure.
- **Exception:** Transient errors (timeouts, deadlocks) — let the retry mechanism handle them.
- **Fail:** Known non-recoverable conditions (invalid data, authorization failure) — fail fast.

---

# When NOT To Use

- Don't throw exception when `release()` is appropriate — both cause retry, but release is cleaner and doesn't consume an attempt.
- Don't `fail()` for transient errors — let retries handle them.

---

# Best Practices

- **Map exception types to retry behavior.** Connection timeouts → retry. HTTP 400 → fail. HTTP 429 → release with delay. *Why: Different errors have different recovery profiles — treating all errors the same wastes retries on permanent failures and retries too aggressively on rate limits.*
- **Prefer `$this->fail()` for known unrecoverable conditions.** Makes intent clear and avoids wasting retry attempts. *Why: An exception is the worker sees "might be transient" — it retries. `fail()` explicitly says "this will never succeed" — no wasted attempts.*
- **Monitor the release ratio vs success rate.** High release rates indicate systemic issues, not transient errors. *Why: Releases are invisible in standard failure monitoring — they don't appear in `failed_jobs` or failure alerts. A job that releases 10 times before succeeding is unreliable but looks "successful."*

---

# Performance Considerations

- Each release cycle: re-queue + re-pop — minimal overhead.
- Exception retries cost more (throw + catch overhead).
- Fail path is most expensive (DB insert + event dispatch + failed method call).

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Throwing exception when `release()` is appropriate | One-size-fits-all error handling | Consumes retry attempt unnecessarily | Use `release()` for rate limits |
| `fail()` for transient errors | Misclassification | Job fails permanently on recoverable error | Let retry mechanism handle it |
| Not distinguishing release from exception in logs | Same log line for both | Cannot differentiate controlled vs uncontrolled retries | Log the retry type explicitly |

---

# Related Topics

- **K017 $tries / $maxExceptions / retryUntil (K017)** — Retry policy
- **K023 Dead-Letter Queue Pattern (K023)** — Terminal failure handling
