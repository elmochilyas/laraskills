# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Batching & Chaining
- **Knowledge Unit:** K015 — Batch Deployment Hazard — Callback Serialization Across Deploys
- **Knowledge ID:** K015
- **Difficulty Level:** Expert
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Job Batching
  - Laravel Source — `Illuminate\Bus\DatabaseBatchRepository`

---

# Overview

Batch callbacks (`then()`, `catch()`, `finally()`) are serialized closures stored in the `options` column of `job_batches`. When a deployment changes the code these closures reference — renamed classes, modified method signatures, removed variables — in-flight batches break on deserialization. The callbacks fail silently (the callback job throws an error that goes to `failed_jobs`), and post-batch processing never completes. This is a deployment hazard unique to batching: standard jobs are re-created each dispatch, but batch callbacks persist in the database between dispatch and execution.

---

# Core Concepts

- **Callback storage:** The `options` column in `job_batches` stores serialized closures for `before`, `progress`, `then`, `catch`, `finally`.
- **Deserialization failure:** If the closure references a class that no longer exists (renamed, removed), `unserialize()` fails with `ClassNotFoundException`.
- **No backward compatibility guarantee:** Batch callbacks are not versioned. A deploy is effectively a breaking change for in-flight callbacks.
- **Silent failure:** The callback job fails and goes to `failed_jobs`, but the batch is already marked as finished — no alert by default.

---

# When To Use (of the thin-callback pattern)

- Any batch with post-processing logic that must survive deploys
- Production systems with frequent deployments
- Teams practicing continuous delivery

---

# When NOT To Use (of inline callback logic)

- When zero-downtime deploys are not practiced (no callback deployment hazard)
- During development — inline callbacks are fine for one-shot batch operations

---

# Best Practices

- **Use thin callbacks that only dispatch a dedicated job.** A callback should be `->then(fn () => MyPostProcessingJob::dispatch(...))`. *Why: The `MyPostProcessingJob` class is never serialized in the closure — only its class name string in the dispatch call is serialized. Class names are stable across deploys as long as they're not renamed.*
- **Never capture `$this` or framework objects in `use()` clause.** Pass only primitive values (strings, ints, arrays, simple DTOs). *Why: Complex objects like `$request` or `$this` have large object graphs that serialize poorly and change unpredictably between versions.*
- **Drain batches before deploys if callback is critical.** Wait for all in-flight batches to finish before deploying. *Why: Even thin callbacks can fail if the dispatched job class itself changes signatures between versions.*
- **Monitor `failed_jobs` for `BatchCallbackJob` failures after deploys.** A spike indicates callback deserialization failures. *Why: Batch callback failures are silent — the only signal is a `failed_jobs` entry for a batch-callback job.*
- **Test callback serialization across deploys.** Serialize and unserialize the callback in CI with both old and new code. *Why: The serialization library (`Laravel\SerializableClosure`) can change encoding between versions.*

---

# Security Considerations

- A failed callback that was supposed to run cleanup logic can leave sensitive temporary data (temp files, tokens) in place. Ensure TTL-based cleanup as a safety net.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Capturing `$request` or `$this` in callback | Convenience | Serialization failure on dispatch or deserialization failure on execution | Use `use ($orderId, $userId)` with primitives |
| Renaming job classes referenced in callbacks | Refactoring | In-flight callbacks dispatch non-existent class | Use string class references or a dispatch constant |
| Inline logic in `then()` / `catch()` | Simplicity | Deserialization failure after deploy | Extract to dedicated job class |

---

# Examples

```php
// Hazardous: inline closure with complex captured state
Bus::batch($jobs)->then(function (Batch $batch) use ($request, $this) {
    $this->service->process($request->all());
})->dispatch();

// Safe: thin callback dispatching a dedicated job
Bus::batch($jobs)->then(function (Batch $batch) use ($orderId) {
    ProcessBatchCompletion::dispatch($orderId);
})->dispatch();
```

---

# Related Topics

- **K004 Job Serialization (K004)** — Serialization mechanics
- **K011 Batch Callbacks (K011)** — Callback lifecycle
- **K014 Batch of Chains Pattern (K014)** — Deployment hazards with chain composition
