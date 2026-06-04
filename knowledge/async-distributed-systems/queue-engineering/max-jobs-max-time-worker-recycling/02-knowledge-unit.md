# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Worker Management
Knowledge Unit: `--max-jobs`, `--max-time` for Worker Recycling
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
`--max-jobs` and `--max-time` are critical safety valves for daemon workers. They force the worker to exit after processing N jobs or running for N seconds, preventing unbounded memory growth and stale state accumulation. Without these limits, PHP daemon workers gradually consume more memory until OOM or degrade from stale connection handles. Both are enforced in the worker's main loop after each job completes — the worker finishes the current job, then exits cleanly.

# Core Concepts
- **`--max-jobs`**: Maximum number of jobs to process before the worker exits. Default: 0 (no limit).
- **`--max-time`**: Maximum seconds the worker runs before exiting. Default: 0 (no limit).
- **Graceful exit**: The worker finishes the current job, then exits. No job is interrupted.
- **Process restart**: Supervisor/systemd should restart the worker automatically after exit.
- **For Horizon**: These are configured per-supervisor via `maxJobs` and `maxTime`.

# Mental Models
- **Maintenance reminder**: Like an oil change for your car — the worker runs for a while (max-time) or processes a certain number of items (max-jobs), then needs a reset.
- **Shift worker**: `--max-time` is the shift end. The worker leaves when their shift is over. `--max-jobs` is the piece-work quota — after completing N pieces, the worker clocks out.

# Internal Mechanics
- Checked in `Worker::daemon()` after each job completion:
  ```php
  if ($this->jobShouldStop($job)) {
      $this->stop();
  }
  ```
- `jobShouldStop()` checks:
  1. `$this->maxJobs > 0 && $this->jobsProcessed >= $this->maxJobs`
  2. `$this->maxTime > 0 && time() >= $this->startTime + $this->maxTime`
- On stop: break from daemon loop, exit process.
- If no jobs are available (idle), the time counter still ticks. `--max-time` counts total worker lifetime, not active processing time.
- Horizon uses the same mechanism internally, configured via `maxJobs` and `maxTime` per supervisor.

# Patterns
## Conservative Recycling (Low Limits)
- **Purpose**: Restart workers frequently to minimize memory risk.
- **Benefit**: Very low memory growth; catches issues quickly.
- **Tradeoff**: More restarts = more boot overhead; short worker lifetime.

## Aggressive Recycling (High Limits)
- **Purpose**: Maximize throughput by minimizing restarts.
- **Benefit**: Less boot overhead; higher job throughput.
- **Tradeoff**: Higher memory risk; stale state accumulates longer.

## Time-Based Only
- **Purpose**: Restart by wall clock regardless of job count.
- **Benefit**: Predictable restart intervals; workers align to time boundaries.
- **Tradeoff**: High-volume queues with many fast jobs may not benefit as much.

# Architectural Decisions
- **Set both `--max-jobs` and `--max-time`**: Defense in depth. `--max-jobs` catches rapid job accumulation; `--max-time` catches slow leaks.
- **Standard values**: `--max-jobs=500` and `--max-time=3600` (1 hour). Tune based on memory behavior.
- **For Horizon supervisors**: Set `maxJobs` and `maxTime` per supervisor. Different workloads may need different limits.

# Tradeoffs
Low `--max-jobs` (100) | Frequent restarts, low memory | Overhead from frequent booting
High `--max-jobs` (5000) | High throughput between restarts | Higher memory; more stale state
Time-only recycling | Simple, time-predictable | May not catch memory leaks from rapid jobs

# Performance Considerations
- Each restart costs ~50-200ms (PHP boot + Laravel boot).
- At 500 jobs/restart, the overhead is ~0.02% per job. Negligible.
- Memory growth: after restart, the worker starts at baseline memory (~20MB). After N jobs, memory grows. The recycling limit bounds this growth.
- Time-based recycling means a busy worker may restart after processing, e.g., 5000 jobs (if max-job limit is not enforced).

# Production Considerations
- Without recycling, a worker processing PHP 8.x long-running scripts can grow from 20MB to 200MB+ over 24 hours.
- Recycling does NOT leak the current job. The worker finishes then exits.
- Supervisor `autorestart=true` ensures a new worker starts after exit.
- On systems with memory pressure (low RAM), reduce `--max-jobs` to more conservative values.
- Monitor worker process lifetime. If workers consistently hit `--max-time` before `--max-jobs`, increase `--max-jobs`.

# Common Mistakes
- **Not setting either flag**: Worker runs forever. Memory grows indefinitely. Eventual OOM.
- **Setting `--max-jobs` too low**: Worker restarts every few minutes. Restart overhead exceeds processing benefit.
- **Setting `--max-time` too low**: Worker restarts every 5 minutes. For a queue with jobs arriving every 10 seconds, the worker processes only ~30 jobs per lifetime.
- **Assuming recycling cleans all state**: PHP's memory allocator may not release memory back to the OS immediately. Worker RSS after restart may be higher than baseline.

# Failure Modes
- **Memory leak faster than recycling**: If each job leaks 10MB and max-jobs is 100, total leak = 1GB. Worker hits `--memory` limit before `--max-jobs`.
- **Recycling during a critical job**: Rare but possible. The worker finishes the job before exiting — no data loss.
- **No supervisor to restart**: Worker exits after max-jobs. No new worker starts. Queue stops processing.
- **`--max-time` clock skew**: If server time jumps (NTP sync), the worker's start time vs current time calculation may be incorrect — early or late exit.

# Ecosystem Usage
- **Laravel framework**: `queue:work --max-jobs=500 --max-time=3600` is standard.
- **Laravel Horizon**: Horizon supervisors use `maxJobs` and `maxTime` configuration.
- **Laravel Forge**: Forge queue configuration exposes these as advanced settings.

# Related Knowledge Units
- K056 Worker Daemon Architecture (daemon loop context) | K074 Worker Memory Management (memory regulation)

## Research Notes
- The queue:work command uses a daemon loop that persists the Laravel application instance across job processing — memory grows over time and periodic recycling via --max-jobs or --max-time is essential in production.
- Process signal handling for workers (SIGTERM, SIGQUIT, SIGINT) changed in Laravel 11 — workers now attempt to finish the current job before stopping, reducing job loss during deployments.
- Supervisor's stopwaitsecs must be configured in relation to the --timeout value — a common misconfiguration causes process force-kill during graceful shutdown before jobs complete.
- Systemd service units for queue workers need Restart=always, RestartSec=3s, and KillMode=process to prevent the supervisor from killing child processes prematurely during unit restart.
- The --sleep parameter controls polling backoff when the queue is empty — setting this too low causes unnecessary CPU usage from idle polling; too high delays job processing when jobs arrive.
- Containerized environments (Docker/Kubernetes) introduce additional complexity for worker lifecycle — SIGTERM propagated from container orchestration must be mapped to the worker process correctly.
- Monitoring worker health requires tracking queue:work process uptime, job processing rate, and memory usage — the php artisan queue:monitor command provides basic health checks since Laravel 10.
