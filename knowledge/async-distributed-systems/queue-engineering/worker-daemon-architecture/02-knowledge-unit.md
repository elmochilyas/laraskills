# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Worker Management
Knowledge Unit: Worker Daemon Architecture
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
The `queue:work` command launches a long-lived PHP daemon process that boots the application once and processes jobs in an infinite loop. Unlike traditional PHP (which boots, handles one request, and dies), the daemon worker boots the framework, instantiates the service container, and reuses it across hundreds of jobs. This provides ~10x performance over `queue:listen` (which reboots per job). However, daemon workers accumulate state — memory leaks, stale cached values, connection drops — requiring periodic recycling via `--max-jobs` and `--max-time`.

# Core Concepts
- **Daemon process**: A PHP process that runs indefinitely. Boots Laravel once, enters a loop, pops and processes jobs until stopped.
- **Infinite loop**: The worker's `daemon()` method calls `pop()` → `process()` → `sleep()` → repeat.
- **`queue:listen` vs `queue:work`**: `listen` calls a new PHP process per job (boots Laravel each time). `work` is a daemon (boots once). `work` is 5-10x faster.
- **State accumulation**: Service container, facades, static properties persist across jobs. Memory grows.
- **Recycling**: `--max-jobs` (max jobs before restart) and `--max-time` (max seconds before restart) force worker exit, triggering Supervisor to spawn a fresh worker.

# Mental Models
- **Long-haul truck driver vs courier**: `queue:work` is a long-haul truck driver — drives all day without returning to depot (rebooting). `queue:listen` is a local courier — returns to depot after each delivery (rebooting). Long-haul is faster but needs periodic rest breaks (recycling).
- **Marathon runner**: The daemon worker is a marathon runner who runs many laps. With each lap (job), they carry more fatigue (memory growth). A rest (restart) is needed to recover.

# Internal Mechanics
- `Queue\Worker::daemon()` is the main loop:
  1. Listen for `Queue::looping` event — can stop worker.
  2. Pop job from queue via `$this->getNextJob()`.
  3. If no job: `sleep($sleep)` seconds, check for restart, loop.
  4. If job: `$this->process()` → fire job, handle middleware.
  5. Check memory: if > `--memory` limit, stop.
  6. Check `--max-jobs`: if exceeded, stop.
  7. Check `--max-time`: if exceeded, stop.
  8. Check restart flag (cache key `illuminate:queue:restart`).
  9. Loop.
- The service container is NOT reset between jobs. Singletons persist.
- Facades cache resolved instances. Static properties on classes persist.
- Database connections, Redis connections, HTTP clients are reused.
- The daemon should be managed by Supervisor/systemd to auto-restart on exit.

# Patterns
## Memory-Limited Recycling
- **Purpose**: Restart worker when memory exceeds threshold.
- **Benefit**: Prevents OOM crashes.
- **Tradeoff**: Loses accumulated state (caches, warm connections).

## Time-Bound Recycling
- **Purpose**: Force restart after max execution time.
- **Benefit**: Cleans up accumulated stale connections and memory.
- **Tradeoff**: Restarting during a job may abort it.

## Graceful Shutdown via Signal
- **Purpose**: Stop the daemon gracefully on deploy.
- **Benefit**: Current job finishes before exit.
- **Tradeoff**: Shutdown may take up to job timeout seconds.

# Architectural Decisions
- **Use `queue:work` in production**: Daemon mode is far more efficient than `queue:listen`. Always prefer `work`.
- **Set `--max-jobs` and `--max-time` on all production workers**: Prevents unbounded growth. Standard: 500 jobs or 1 hour.
- **Set `--memory` to 128MB**: Kills workers that exceed this threshold. Prevents OOM.
- **Use `--sleep` for idle backoff**: 1-3 seconds between polls when queue is empty. Reduces CPU waste.

# Tradeoffs
`queue:work` (daemon) | Fast, boot once, reuses container | State accumulation; memory leaks; stale connections
`queue:listen` (per-job) | No state accumulation, fresh container each time | 5-10x slower; high CPU from repeated booting
High `--sleep` (5-10s) | Low CPU when idle | Slow to respond to new jobs (up to 10s delay)

# Performance Considerations
- Daemon worker: boot time ~50-200ms (one time). Job processing time = job logic only.
- `queue:listen`: boot time ~50-200ms PER JOB. For 100ms jobs, this is 50-66% overhead.
- Memory growth depends on job behavior. Jobs that cache data in static properties grow memory fastest.
- The `--memory` check uses `memory_get_usage(true)` — measures actual RSS, not allocator-reported.

# Production Considerations
- Always run daemon workers under Supervisor/systemd. If the worker stops (--max-jobs, OOM, crash), supervisor restarts it.
- Monitor worker restart rate. Too frequent (<1 restart per 10 minutes) indicates `--max-jobs` or `--max-time` too low.
- After framework upgrades, restart workers to pick up new code. `queue:restart` broadcasts a restart signal via cache.
- The daemon continues running even if Redis/Database goes down temporarily. It will reconnect on the next operation.
- Long-running daemons may hold database connections open for extended periods. Monitor connection count.

# Common Mistakes
- **Running `queue:work` without Supervisor**: If the worker crashes or hits `--max-jobs`, it doesn't restart. Jobs stop processing.
- **Not setting `--max-jobs` or `--max-time`: Worker runs forever. Memory grows unbounded. Eventually OOM.
- **`queue:listen` in production**: Poor performance. Should only be used for local development.
- **Assuming daemon workers don't have state issues**: Singleton classes, facades, static properties accumulate across jobs. Test for crossover bugs.
- **Not running `queue:restart` after deploy**: Old workers still run old code. New code doesn't take effect until workers restart.

# Failure Modes
- **Memory leak crash**: Worker exceeds `--memory` limit. Process killed. New worker starts but may also leak.
- **Stale singleton state**: Job A sets a property on a singleton. Job B reads the property (intended for a different context). Data crossover bug.
- **Connection exhaustion**: Worker holds database connections open across many jobs. If connections aren't released, the pool is exhausted.
- **Deadlock from long-running worker**: A transaction opened in one job, not properly closed, affects the next job.
- **PHP segmentation fault**: A rare but critical failure in long-running PHP processes. Process dies, all state lost.

# Ecosystem Usage
- **Laravel framework**: `Illuminate\Queue\Worker` implements the daemon loop. `Queue\Console\WorkCommand` is the CLI entry point.
- **Laravel Horizon**: Horizon manages daemon workers via its own supervisor. It internally runs `queue:work horizon` for each worker.
- **Spatie packages**: Not directly related, but Spatie webhook-server jobs run on daemon workers.

# Related Knowledge Units
- K057 Process Signals (stop/restart interaction) | K058 `--max-jobs`, `--max-time` (recycling)

## Research Notes
- The queue:work command uses a daemon loop that persists the Laravel application instance across job processing — memory grows over time and periodic recycling via --max-jobs or --max-time is essential in production.
- Process signal handling for workers (SIGTERM, SIGQUIT, SIGINT) changed in Laravel 11 — workers now attempt to finish the current job before stopping, reducing job loss during deployments.
- Supervisor's stopwaitsecs must be configured in relation to the --timeout value — a common misconfiguration causes process force-kill during graceful shutdown before jobs complete.
- Systemd service units for queue workers need Restart=always, RestartSec=3s, and KillMode=process to prevent the supervisor from killing child processes prematurely during unit restart.
- The --sleep parameter controls polling backoff when the queue is empty — setting this too low causes unnecessary CPU usage from idle polling; too high delays job processing when jobs arrive.
- Containerized environments (Docker/Kubernetes) introduce additional complexity for worker lifecycle — SIGTERM propagated from container orchestration must be mapped to the worker process correctly.
- Monitoring worker health requires tracking queue:work process uptime, job processing rate, and memory usage — the php artisan queue:monitor command provides basic health checks since Laravel 10.
