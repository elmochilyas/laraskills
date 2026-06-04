# Metadata
Domain: Async & Distributed Systems
Subdomain: Job Batching & Chaining
Knowledge Unit: Batch Deployment Hazard — Callback Serialization Across Deploys
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary
Batch callbacks (`then()`, `catch()`, `finally()`) are serialized closures stored in the `options` column of `job_batches`. When a deployment changes the code these closures reference — renamed classes, modified method signatures, removed variables — in-flight batches break on deserialization. The callbacks fail silently (the callback job throws an error), and post-batch processing never completes. This is a deployment hazard unique to batching: standard jobs are re-created each dispatch, but batch callbacks persist in the database between dispatches and executions.

# Core Concepts
- **Callback storage**: The `options` column in `job_batches` stores serialized closures for `before`, `progress`, `then`, `catch`, `finally`.
- **Serialization anchor**: The closure is serialized with its bound variables, scope, and context at dispatch time.
- **Deserialization failure**: If the serialized closure references a class that no longer exists (renamed, removed), `unserialize()` fails.
- **`$this` limitation**: Closures that reference `$this` (the dispatching context) fail on serialization or hold stale references.
- **No backward compatibility guarantee**: Batch callbacks are not versioned. A deploy is effectively a breaking change for in-flight callbacks.

# Mental Models
- **Deployed bomb**: Each batch callback is like a time-delayed bomb that detonates (deserializes) when the batch finishes. A deploy while the bomb is ticking changes the detonator mechanism — it may not work.
- **Message in a bottle across versions**: The message was written in version 1.0 and washed ashore (deserialized) in version 1.1. The handwriting (serialization format) changed.

# Internal Mechanics
- `PendingBatch::dispatch()` serializes callbacks via `$this->serialize($batch->options)` in `DatabaseBatchRepository::store()`.
- The serialized string is stored in the `options` TEXT column.
- When the batch finishes (all jobs ran), the worker calls `dispatch($callback)` where the callback is the unserialized closure.
- `unserialize($options['callbacks']['then'])` reconstructs the closure.
- If the closure referenced `App\Jobs\SomeJob` and that class was removed, `unserialize()` fails with a `ClassNotFoundException`.
- The callback job fails, but the batch is already marked as finished. The failure is silent unless explicitly monitored.

# Patterns
## Thin Callback Pattern
- **Purpose**: Minimize callback surface area to reduce deployment risk.
- **Benefit**: Callbacks only dispatch a known job class — simple, stable serialization.
- **Tradeoff**: Extra job class, indirect post-processing.

## Callback Versioning via Closure Capture
- **Purpose**: Embed version information in captured variables to detect stale callbacks.
- **Benefit**: Version check at callback execution time — reject old callbacks gracefully.
- **Tradeoff**: Manual version management, additional code.

## Callback-Free Batch Completion
- **Purpose**: Poll for batch completion from application code instead of using callbacks.
- **Benefit**: No serialized closures, zero deployment hazard.
- **Tradeoff**: Polling overhead, eventual consistency, added complexity.

# Architectural Decisions
- **Never put complex logic in callbacks**: Callbacks should be one-liners that dispatch a specific job class. The job class is safe from serialization issues because it's referenced by name in the dispatch call.
- **Avoid `use ($this)` in callbacks**: `$this` does not serialize reliably. Capture only primitive values or simple objects.
- **Test callback serialization across deploys**: If you deploy frequently, add an integration test that serializes and unserializes the batch callback in both old and new code.

# Tradeoffs
Thin callback → dispatch job | Stable across deploys, testable post-processing | Extra job class, indirect flow
Inline logic in callback | No extra job, direct execution | Fragile across deploys; deserialization failures
Polling for completion | No serialization, zero deploy risk | Polling overhead; eventual consistency

# Performance Considerations
- Serialization size of callbacks is typically small (<1KB for thin closures). Complex closures with large `use` bindings inflate this.
- Deserialization failure of a callback fails only the callback job, not the batch state. The batch remains marked as finished.
- The callback job's failure is captured in `failed_jobs` and can be retried via `queue:retry`.

# Production Considerations
- Add a deployment procedure for in-flight batches:
  1. Check for unfinished batches before deploy.
  2. Wait for them to finish or cancel them.
  3. Deploy.
  4. Re-dispatch cancelled batches.
- Monitor `failed_jobs` for `BatchCallbackJob` failures after deployment. A spike indicates callback deserialization failures.
- Consider draining all batches before zero-downtime deployments. Horizon's `horizon:terminate` does NOT drain batches.
- Serialized closures use the `Opis\Closure` or `Laravel\SerializableClosure` library. Version bumps of this library may also break deserialization across deploys.

# Common Mistakes
- **Capturing route parameters in callbacks**: `Bus::batch(...)->then(function () use ($request) { ... })`. The `$request` object is large and framework-specific — likely fails serialization.
- **Assuming closures are safe from serialization**: Closures in batch callbacks MUST be serializable. Any non-serializable object in the `use` clause causes the entire batch dispatch to fail.
- **Renaming job classes referenced in callbacks**: If the callback dispatches `OldJobName::class` and you rename it to `NewJobName`, the in-flight callback tries to dispatch a non-existent class.

# Failure Modes
- **Silent callback failure**: Batch finishes, callback deserialization fails, no error output. The batch looks completed but post-processing never ran.
- **Class not found on deserialization**: Renamed or moved listener/job classes referenced in the serialized closure cause `Error: Class "..." not found`. The callback job fails.
- **Serialized scope incompatibility**: The closure was serialized with PHP version X, deployed to PHP version Y. Closure serialization format differences cause deserialization failure.
- **Library version mismatch**: `Laravel\SerializableClosure` or `Opis\Closure` library updated between deploy and callback execution. Serialization format may differ.

# Ecosystem Usage
- **Laravel framework**: This is a known limitation. Framework documentation advises keeping callbacks simple and not referencing `$this`.
- **Laravel Horizon**: Displays callback jobs but doesn't distinguish "batch callback" from regular jobs. Monitoring required.
- **Spatie packages**: Avoid batch callbacks entirely — use explicit job dispatch for post-processing.

# Related Knowledge Units
- K004 Job Serialization (serialization mechanics) | K011 Batch Callbacks (callback lifecycle) | K014 Batch of Chains Pattern

## Research Notes
- Job batches in Laravel use a Redis-backed BatchRepository that tracks batch state (total jobs, pending jobs, failures) — the atch:table Artisan command creates a migration for a database-backed fallback.
- The llowFailures method on a batch allows remaining jobs to continue processing even when some jobs in the batch fail — this is distinct from the catch callback which fires when any job fails.
- Batch of chains pattern (Bus::chunk) creates independent chains that each execute sequentially — failure in one chain does not affect other chains, unlike a single chain where failure stops execution.
- The Bus::batch and Bus::chain interaction has known limitations — chains within batches cannot have their own catch/finally callbacks, and batch-level callbacks fire independently of chain completion.
- Batch deployment hazards occur when pushing new batch-based code to production — running jobs from the old deployment may not recognize the new batch structure, causing orphaned batches.
- The Batchable trait provides cancel() and cancelled() methods for cooperative cancellation — the job must periodically check $this->batch()->cancelled() to support cancellation mid-execution.
- Batch state locking uses Laravel's cache lock to prevent race conditions on batch updates — Redis locks are recommended for high-throughput batch environments.
- Laravel 12 introduced the atchProgress() helper on job batches, providing a percentage-based progress indicator for real-time UI updates.
