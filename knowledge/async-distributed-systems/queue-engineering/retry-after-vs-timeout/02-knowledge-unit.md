# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Worker Management
Knowledge Unit: `retry_after` vs `--timeout` Semantics
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary
`retry_after` and `--timeout` serve different purposes but their interaction is commonly misunderstood, leading to double-processing or job loss. **`retry_after`** (queue connection config) is the backend's reservation timeout — how long the queue backend waits before making a reserved job available to another worker. **`--timeout`** (worker flag) is the worker's maximum execution time per job — after this, the worker process is killed. The critical rule: `--timeout` must be LESS than `retry_after`. If `--timeout` exceeds `retry_after`, a job that takes longer than `retry_after` is re-processed by another worker while the original worker is still running — guaranteed double processing.

# Core Concepts
- **`retry_after`**: Config option per queue connection. Defines how long the job is reserved for a single worker. Default: 90 seconds. Set in `config/queue.php`.
- **`--timeout`**: Worker CLI flag. Maximum seconds a job is allowed to run. If exceeded, the worker process is killed (SIGALRM or proc_terminate). Default: 60 seconds.
- **`--timeout` < `retry_after`**: Safe zone. Worker is killed before the reservation expires. Job is released for retry.
- **`--timeout` > `retry_after`**: Danger zone. Reservation expires while worker is still processing. A second worker grabs the job. Both workers process it.
- **`retry_after` = `--timeout`**: Race condition. Timing may cause the reservation to expire just before the worker is killed.

# Mental Models
- **Library book reservation**: `retry_after` is the library checkout period for a book (job). `--timeout` is your personal deadline to read it. If you exceed the checkout period (retry_after), the book can be checked out by someone else — even though you still have it. You're both reading the same book (double processing).
- **Parking meter**: `retry_after` is the parking meter time. `--timeout` is how long you plan to stay. If you stay longer than the meter has paid (retry_after), you get a ticket (worker killed), but the parking spot may have been given to another car (second worker).

# Internal Mechanics
- For Redis: `retry_after` controls how long a popped job stays in the "reserved" state before it's returned to the queue. Redis does this automatically — when `retry_after` expires, Redis moves the job from the reserved list back to the main list.
- For SQS: `retry_after` maps to SQS visibility timeout. When it expires, SQS makes the message visible again.
- `--timeout` on `queue:work`: sets `pcntl::alarm($seconds)` or uses `proc_terminate` for the job subprocess.
- If `alarm` fires: SIGALRM is sent. Worker catches it, attempts to fail the current job, then exits.
- If `--timeout` is in the child process: `proc_terminate($process)` kills the job subprocess. The main worker continues.
- `retry_after` is NOT the maximum job execution time. It's the maximum reservation time. A job can run longer than `retry_after` — but it will be double-processed.

# Patterns
## Safe Configuration
- **Purpose**: Ensure `--timeout` < `retry_after` with buffer.
- **Benefit**: No double processing due to timeout misconfiguration.
- **Tradeoff**: `retry_after` must be long enough for max expected job duration.

## Timeout-Based Job Length Enforcement
- **Purpose**: Use `--timeout` as the maximum job execution time.
- **Benefit**: Prevents runaway jobs.
- **Tradeoff**: Too short kills legitimate long-running jobs.

## Retry After as Safety Net
- **Purpose**: Set `retry_after` significantly higher than `--timeout`.
- **Benefit**: Even if `--timeout` doesn't fire (signal issue), the reservation expires safely.
- **Tradeoff**: Long `retry_after` means delayed re-processing of failed jobs.

# Architectural Decisions
- **Set `--timeout` = max expected job runtime + 30% buffer**. Not longer.
- **Set `retry_after` = `--timeout` + 10 seconds**. Always larger than `--timeout`.
- **For Horizon supervisors**: The `timeout` config maps to `--timeout`. The `retry_after` is set on the Redis connection config.
- **For multi-queue supervisors**: Different queues may have different acceptable timeouts. Use separate supervisors with separate `retry_after` values (separate Redis connection configs).

# Tradeoffs
`--timeout` < `retry_after` (safe) | No double processing, clear separation | `retry_after` must be higher than any job's runtime
`--timeout` > `retry_after` (danger) | Job starts but may finish before retry_after | Double processing; data corruption risk
Large `retry_after` (300s) | Ample safety margin | Delayed failure recovery; reserved job blocks for 5 minutes

# Performance Considerations
- `retry_after` setting only affects how long the reservation lasts. No CPU impact.
- `--timeout` uses signals or process monitoring. Minimal CPU overhead.
- A worker killed by `--timeout` loses all in-memory state for that job. The job is re-queued and retried.
- Double processing from misconfiguration: two workers consume resources for the same job.

# Production Considerations
- Treat `retry_after` and `--timeout` as a paired configuration. Document both for each supervisor.
- Test with a job that sleeps longer than `retry_after` to verify no double processing.
- Monitor for "phantom completions" — jobs that appear to succeed but also appear in failed_jobs (indicates double processing where one succeeded and one failed).
- When `--timeout` is hit, the job is NOT stored in `failed_jobs` unless `$tries` is also exceeded. The job is simply released (retried).
- `retry_after` in Horizon is set per connection. All supervisors on that connection share the same `retry_after`.

# Common Mistakes
- **Setting `--timeout` equal to `retry_after`**: A 1-second clock skew between the worker and the queue backend can cause double processing. Always keep a 10+ second gap.
- **Not considering job `$timeout` property**: The job's `$timeout` property overrides the worker's `--timeout`. A job with `$timeout = 600` runs even if the worker `--timeout` is 60.
- **Assuming `retry_after` is per-queue**: `retry_after` is per CONNECTION. All queues on the same connection share the same value.
- **Changing `retry_after` on a live system**: Existing reserved jobs still use the old value. New jobs use the new value.
- **Setting `retry_after` too low for batch-heavy workloads**: Batched jobs may take longer than individual jobs. Account for batch job processing time.

# Failure Modes
- **Classic double processing**: Job takes 65 seconds. `retry_after` = 60, `--timeout` = 70. At 60s, the reservation expires. Second worker grabs the job. Both workers process it simultaneously.
- **Silent timeout job loss**: `--timeout` is hit. Worker is killed. The job was not deleted from the queue. It's re-queued after `retry_after`. But the job may have partially committed side effects before being killed.
- **`--timeout` signal not handled**: Signal handlers not registered (no pcntl). `--timeout` doesn't kill the worker. Job runs indefinitely.
- **Horizon timeout vs retry_after interaction**: Horizon supervisors have their own `timeout` setting which may differ from the connection's `retry_after`. Check both.

# Ecosystem Usage
- **Laravel framework**: `retry_after` in `config/queue.php`. `--timeout` on `queue:work`.
- **Laravel Horizon**: Supervisor `timeout` config. `retry_after` from connection config.
- **Spatie packages**: Not directly affected, but Docker-based deployments of Spatie apps must configure both correctly.

# Related Knowledge Units
- K056 Worker Daemon Architecture (timeout in daemon loop) | K057 Process Signals (SIGALRM relationship)

## Research Notes
- The queue:work command uses a daemon loop that persists the Laravel application instance across job processing — memory grows over time and periodic recycling via --max-jobs or --max-time is essential in production.
- Process signal handling for workers (SIGTERM, SIGQUIT, SIGINT) changed in Laravel 11 — workers now attempt to finish the current job before stopping, reducing job loss during deployments.
- Supervisor's stopwaitsecs must be configured in relation to the --timeout value — a common misconfiguration causes process force-kill during graceful shutdown before jobs complete.
- Systemd service units for queue workers need Restart=always, RestartSec=3s, and KillMode=process to prevent the supervisor from killing child processes prematurely during unit restart.
- The --sleep parameter controls polling backoff when the queue is empty — setting this too low causes unnecessary CPU usage from idle polling; too high delays job processing when jobs arrive.
- Containerized environments (Docker/Kubernetes) introduce additional complexity for worker lifecycle — SIGTERM propagated from container orchestration must be mapped to the worker process correctly.
- Monitoring worker health requires tracking queue:work process uptime, job processing rate, and memory usage — the php artisan queue:monitor command provides basic health checks since Laravel 10.
