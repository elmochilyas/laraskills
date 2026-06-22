# Metadata

Domain: DevOps & Infrastructure
Subdomain: Queue Deployment Safety
Knowledge Unit: Queue Deployment Safety Operations
Difficulty Level: Advanced
Last Updated: 2026-06-22

---

# Executive Summary

Deploying code changes to a production Laravel application with active queue workers requires specific safety operations to prevent job failures, data corruption, and silent data loss. The key operations — `php artisan queue:restart`, backward-compatible job payloads via `SerializesModels`, pre-deploy code deployment, `horizon:terminate` for graceful worker shutdown, and post-deploy monitoring of failed jobs — form a deployment safety net that maintains queue integrity across version transitions. Without these practices, in-flight jobs may fail with deserialization errors, jobs may process with old logic against new schemas, or workers may crash mid-job and leave locks unreleased.

---

# Core Concepts

- **`php artisan queue:restart`**: Signals workers to restart after finishing their current job. Does NOT interrupt in-flight jobs. Must be called after each deployment.
- **`SerializesModels`**: Serializes Eloquent model references as identifiers (not full objects) in job payloads. Workers re-fetch from the database on job execution, ensuring the latest data.
- **`horizon:terminate`**: Gracefully stops Horizon. Workers finish current jobs, then exit. The supervisor restarts them. No jobs are killed mid-execution.
- **Backward-compatible payloads**: Job constructor parameters must survive deserialization when new code (new constructor signature) tries to load old payloads.
- **Schema compatibility window**: Database schema changes (new columns, removed columns) must account for in-flight jobs that reference old schemas.
- **Feature flags for rollout**: Use feature flags to control which code path executes, allowing safe rollout of risky job changes.
- **Staggered worker groups**: Multiple worker groups on different deployment targets enable phased rollout.

---

# Mental Models

- **Train track replacement**: You can replace the tracks (code) while the trains (in-flight jobs) are still running, but you must ensure the new tracks connect to the old ones and the trains can switch smoothly.
- **Ship in a dry dock**: Take the ship (worker) out of the water (stop accepting new jobs), let the crew finish (complete current jobs), then perform maintenance (deploy), and re-launch.
- **Database migration with live traffic**: You don't shut down the database to add a column — you make the change backward-compatible. Same principle applies to job payloads.

---

# Internal Mechanics

- **`queue:restart` mechanism**: Writes a timestamp to `cache:illuminate:queue:restart` (Redis/cache). Workers check this value between jobs. If the timestamp changed, the worker dies after finishing its current job. The supervisor (Horizon, systemd, supervisor) restarts it with new code.
- **`SerializesModels` internals**: Instead of storing the full Eloquent model in the job payload, only the model class name and ID are stored. On `__unserialize()`, the worker re-fetches `Model::findOrFail($id)`. Changes to the model's database row between dispatch and execution are reflected.
- **`horizon:terminate` internals**: Sends a `SIGTERM` to the Horizon supervisor process. The supervisor signals all workers to complete their current jobs and exit. The master process waits for workers to finish (with a configurable timeout), then exits. The process manager (systemd/supervisor) restarts Horizon with new code.
- **Payload versioning**: Job payloads include the job class name and a serialized representation of constructor arguments. When constructor signatures change, old payloads can't be unserialized — throwing `Illuminate\Contracts\Queue\EntityNotFoundException` or generic unserialization errors.

---

# Patterns

## Deploy Code Before Schema Changes
- **Purpose**: New code handles both old and new schemas. Old schema still has the old columns. Deploy code, then run migrations.
- **Benefit**: No downtime. In-flight jobs work with either schema version.
- **Tradeoff**: Code must be written to handle both schema states (active column exists/doesn't exist).

## Feature-Flagged Job Behavior
- **Purpose**: Risky job code changes are gated behind a feature flag. Rollout is gradual.
- **Benefit**: Instant rollback by disabling the flag. No re-deploy needed.
- **Tradeoff**: Adds conditional branches to job code that must eventually be cleaned up.

## Staggered Worker Groups
- **Purpose**: Deploy new code to Worker Group A, keep Worker Group B on old code. Verify A works, then roll B.
- **Benefit**: Reduced blast radius. Canary deployment for queue workers.
- **Tradeoff**: Both worker groups must handle old and new payloads during the transition window.

## Phased Migrations for Large Tables
- **Purpose**: Schema changes on large tables (100M+ rows) done in phases — add column (nullable), backfill, add constraint, remove old column.
- **Benefit**: No long table locks. In-flight jobs are not blocked.
- **Tradeoff**: Migration takes hours/days instead of minutes. Multiple deployments required.

---

# Architectural Decisions

- **Use `queue:restart` after every deploy**: Non-negotiable. Old code continues processing without this signal.
- **Use `horizon:terminate` for graceful shutdown**: Ensures no in-flight jobs are killed mid-execution. Prevents stale locks (`WithoutOverlapping`, `ShouldBeUnique`).
- **Use `SerializesModels` on all jobs**: Prevent stale model data. Workers always fetch fresh data.
- **Deploy code before running migrations**: Ensures running workers can handle the new schema. Schema changes should be additive and backward-compatible.
- **Use feature flags for risky job changes**: Enables instant rollback without code re-deploy and `queue:restart` cycle.

---

# Tradeoffs

| Approach | Benefit | Cost |
|----------|---------|------|
| `queue:restart` after deploy | Workers pick up new code quickly | Brief spike in queue latency as workers restart |
| `horizon:terminate` graceful stop | No mid-job kills, no stale locks | Horizon has configurable timeout; if jobs exceed it, SIGKILL is sent |
| Phased migrations | No table locks, backward compatible | Multiple deploys, longer migration timeline |
| Feature flags on jobs | Instant rollback | Conditional complexity, flag cleanup overhead |
| Staggered worker groups | Canary deployment, reduced blast radius | Infrastructure complexity, dual-compatibility requirement |

---

# Performance Considerations

- `queue:restart` check: cache read per job (~1ms). Minimal overhead.
- Worker restart: cold boot of PHP, re-compilation of classes. First few jobs may be slower.
- `horizon:terminate` timeout: configurable. Default is 60 seconds. Long-running jobs may be killed.
- Job payload size: `SerializesModels` reduces payload dramatically (IDs vs full objects) — saves cache/DB storage.
- Phased migrations: multiple deployments mean multiple `queue:restart` cycles — brief latency spikes with each.

---

# Production Considerations

- Monitor `failed_jobs` table growth during and immediately after deployment — the first indicator of payload incompatibility.
- Alert on `Illuminate\Contracts\Queue\EntityNotFoundException` — indicates a model referenced in a job payload was deleted before execution.
- Set `horizon:terminate` timeout to exceed p99 job execution time — prevent SIGKILL on slow but normal jobs.
- Maintain a deployment runbook with the exact sequence: deploy code → `queue:restart` → verify Horizon → run migrations → verify failed_jobs.
- Cache the `queue:restart` signal in a persistent cache (Redis, not array) — survives PHP process restarts.
- After `queue:restart`, old workers may take up to `--timeout` seconds to die if they're processing a long job.

---

# Failure Modes

- **No `queue:restart` after deploy**: Workers run old code against new schemas. Type mismatches, missing columns, runtime exceptions.
- **Incompatible constructor signatures**: Old job payloads fail unserialization on new workers. Jobs are lost (moved to failed_jobs without processing).
- **`horizon:terminate` kills in-flight jobs**: Timeout too short. Job killed mid-execution, stale locks, partial side effects.
- **Migrations run before code deploy**: Workers with old code can't handle new schema. Old columns dropped but code still references them.
- **Phase N migration before Phase N-1 complete**: Workers encounter intermediate schema state that neither old nor new code handles.
- **Cache cleared during deploy**: `queue:restart` signal lost. Workers never restart. Old code runs indefinitely.

---

# Ecosystem Usage

- **Laravel Forge**: Automatically calls `php artisan queue:restart` after deployment. Configurable in deployment script.
- **Laravel Envoyer**: Zero-downtime deployment with automatic `queue:restart` and `horizon:terminate` hooks.
- **Laravel Vapor**: Serverless — no persistent workers. No `queue:restart` needed. Each invocation loads fresh code.
- **Spatie/laravel-webhook-client**: Uses `SerializesModels` on webhook call jobs. Backward-compatible payloads ensure webhook processing survives deploys.
- **Horizon**: Supervisor manages worker lifecycle. `horizon:terminate` triggers graceful shutdown via the supervisor.

---

# Related Knowledge Units

- K046 `$tries` and `$maxExceptions` — Retry configurations affect how many times a failed deployment job retries
- K055 `ShouldBeUnique` — Unique locks must survive worker restart; `horizon:terminate` prevents stale locks
- K052 `WithoutOverlapping` — Concurrent execution locks; graceful shutdown prevents orphaned locks
- Database migration engineering KUs — Schema change patterns for large tables

## Research Notes

- `queue:restart` writes to `cache:illuminate:queue:restart` using the cache driver configured for queues. If using `array` cache, restarts don't work — use Redis or database cache.
- The `queue:restart` signal is polled by workers between jobs. A worker processing a 10-minute job won't see the restart signal until it finishes. The `--timeout` flag on workers controls the maximum time before a worker is force-killed.
- `horizon:terminate` sends SIGTERM to the master process. The master passes it to all workers. Workers finish their current job and exit. The master waits `--timeout` seconds for all workers to exit, then sends SIGKILL.
- Job payload compatibility: when you add a new constructor parameter with a default value, old payloads (without the parameter) still work. When you remove a parameter, old payloads break.
- `SerializesModels` stores `{class: "App\Models\User", id: 42}` in the payload. On unserialize: `User::findOrFail(42)`. If the user was deleted between dispatch and execution, it throws `ModelNotFoundException`.
