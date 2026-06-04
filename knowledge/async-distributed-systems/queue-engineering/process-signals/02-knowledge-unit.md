# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Worker Management
Knowledge Unit: Process Signals (SIGTERM, SIGQUIT, SIGUSR2, SIGCONT)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary
The queue worker responds to POSIX process signals for lifecycle management. **SIGTERM**: graceful shutdown — finish current job, then exit. **SIGQUIT**: immediate shutdown — exit after current job. **SIGUSR2**: pause — stop processing new jobs (wait for current to finish). **SIGCONT**: resume after pause. These signals enable Supervisor and Horizon to manage workers without force-killing. Misunderstanding signal handling causes job processing interruptions and potential data loss.

# Core Concepts
- **SIGTERM (15)**: "Please stop." Worker finishes the current job, then exits. No new jobs are popped.
- **SIGQUIT (3)**: "Stop now." Worker exits after current job finishes, but may abort if `--timeout` is exceeded.
- **SIGUSR2 (12)**: "Pause." Worker stops popping new jobs. Completes current job, then waits.
- **SIGCONT (18)**: "Resume." Worker resumes popping jobs after pause.
- **Signal handlers**: Registered in `Queue\Worker::listenForSignals()`. Uses `pcntl_signal()`.
- **Tick-based polling**: PHP signals are not preemptive. The worker must `pcntl_signal_dispatch()` during its loop to handle signals.
- **`--timeout`**: Not a signal — it's a `SIGALRM`-based alarm or `proc_terminate` for the job subprocess. When a job exceeds `--timeout`, the worker process is killed.

# Mental Models
- **Air traffic controller**: SIGTERM = "finish your current landing sequence, then hand over to next controller." SIGQUIT = "land immediately and hand over." SIGUSR2 = "pause all landings, resume when I signal." SIGCONT = "resume normal operations."
- **Waiter during shift change**: SIGTERM = "serve your current table, then clock out." SIGQUIT = "drop everything and clock out now." SIGUSR2 = "finish current table, then stand by." SIGCONT = "continue serving."

# Internal Mechanics
- `Worker::daemon()` calls `$this->listenForSignals()` at the start.
- `listenForSignals()` registers handlers via `pcntl_signal()`:
  - `SIGTERM` → `$this->shouldQuit = true`
  - `SIGQUIT` → `$this->shouldQuit = true` (also may set `$this->paused = true`)
  - `SIGUSR2` → `$this->paused = true`
  - `SIGCONT` → `$this->paused = false`
- At each loop iteration, `Worker::stopIfNeeded()` checks `$this->shouldQuit` and `$this->paused`.
- If `shouldQuit`: break out of daemon loop, exit process.
- If `paused`: sleep and continue checking (don't pop jobs).
- `Worker::$isInterruptedCacheKey` (Redis) is also checked — set by `queue:restart` command.
- PHP signal handling requires the `pcntl` extension. Without it, signals are ignored.

# Patterns
## Supervisor Graceful Stop (SIGTERM)
- **Purpose**: Supervisor sends SIGTERM during deployment, `stopwaitsecs` window.
- **Benefit**: Worker finishes current job before exiting — no job loss.
- **Tradeoff**: Shutdown may take up to longest job's execution time.

## Horizon Pause/Resume (SIGUSR2/SIGCONT)
- **Purpose**: Horizon pauses workers during maintenance.
- **Benefit**: Workers stop processing without exiting.
- **Tradeoff**: Paused workers hold memory until resumed.

## Cache-Based Restart Signal
- **Purpose**: `queue:restart` sets a cache key that all workers check.
- **Benefit**: Workers across all servers restart simultaneously.
- **Tradeoff**: Cache key must be cleared; workers poll with `--sleep` delay.

# Architectural Decisions
- **Use SIGTERM for deployment shutdown**: Supervisor's default stop signal. Worker finishes current job gracefully.
- **Use SIGUSR2 for temporary pause**: Horizon uses this to pause workers during snapshot/backup.
- **Use `queue:restart`** for restarting all workers across all servers: Broadcast restart via cache.
- **Avoid SIGKILL (9)**: Uncatchable. Worker dies immediately. Current job is lost (re-queued after `retry_after`).

# Tradeoffs
SIGTERM graceful shutdown | No job loss, clean exit | Slow shutdown if jobs are long
SIGQUIT fast shutdown | Quick exit | May interrupt jobs at processing boundary
SIGUSR2 pause | Workers don't exit, ready to resume | Workers hold memory while paused

# Performance Considerations
- Signal handling overhead: `pcntl_signal_dispatch()` is called once per loop iteration. Negligible.
- The pause check adds a cache read per loop iteration (checks `$isInterruptedCacheKey`).
- `--timeout` uses alarm signals or process termination. If a job hits the timeout, the process is killed — no graceful cleanup.

# Production Considerations
- The `pcntl` extension is required for signal handling. Most production PHP installations include it, but verify.
- Supervisor's `stopwaitsecs` should match the longest expected job runtime. Workers that don't stop within `stopwaitsecs` are SIGKILLed.
- `queue:restart` sets a cache key. The cache must be shared across all servers for multi-server restart.
- On shared hosting without `pcntl`, signals are not handled. Workers must be managed differently.
- Signal handlers are per-process. In Horizon, the supervisor process handles signals for its worker processes.

# Common Mistakes
- **Assuming SIGTERM is immediate**: SIGTERM waits for the current job to finish. If the job runs for 10 minutes, the shutdown takes 10 minutes.
- **Not setting `stopwaitsecs` correctly in Supervisor**: `stopwaitsecs` is the time Supervisor waits for the process to stop after SIGTERM. If set too low, Supervisor sends SIGKILL before the worker finishes its job.
- **Killing workers with SIGKILL**: `kill -9` cannot be caught. The worker dies immediately. The job it was processing is lost until `retry_after` expires — double-processing risk.
- **Not handling signals in custom daemon scripts**: If you write a custom worker, you must register `pcntl_signal()` handlers. Otherwise, SIGTERM does nothing.
- **Testing signal behavior without `pcntl`**: In environments without `pcntl` (Windows), signals don't work at all. Test on Linux.

# Failure Modes
- **SIGTERM ignored (no pcntl extension)**: Worker receives SIGTERM but continues processing. Supervisor eventually SIGKILLs. Current job lost.
- **Double processing on SIGKILL**: Worker is killed while processing a job. Queue backend re-delivers after `retry_after`. Another worker processes the same job.
- **Pause never released**: SIGUSR2 sent but SIGCONT never sent (operator error). Workers remain paused indefinitely until manually or process restarted.
- **Race condition on `shouldQuit`**: Signal received between checking `shouldQuit` and popping the next job. The job pops after the signal, but the worker exits mid-processing.

# Ecosystem Usage
- **Laravel framework**: `Illuminate\Queue\Worker::listenForSignals()` registers handlers.
- **Laravel Horizon**: Horizon uses `SIGUSR2`/`SIGCONT` for pause/resume. Supervisor manages the main Horizon process.
- **Supervisor**: Sends SIGTERM to workers, waits `stopwaitsecs`, then SIGKILL.

# Related Knowledge Units
- K056 Worker Daemon Architecture (daemon loop context) | K083 Supervisor `stopwaitsecs` (interaction with signal)

## Research Notes
- The queue:work command uses a daemon loop that persists the Laravel application instance across job processing — memory grows over time and periodic recycling via --max-jobs or --max-time is essential in production.
- Process signal handling for workers (SIGTERM, SIGQUIT, SIGINT) changed in Laravel 11 — workers now attempt to finish the current job before stopping, reducing job loss during deployments.
- Supervisor's stopwaitsecs must be configured in relation to the --timeout value — a common misconfiguration causes process force-kill during graceful shutdown before jobs complete.
- Systemd service units for queue workers need Restart=always, RestartSec=3s, and KillMode=process to prevent the supervisor from killing child processes prematurely during unit restart.
- The --sleep parameter controls polling backoff when the queue is empty — setting this too low causes unnecessary CPU usage from idle polling; too high delays job processing when jobs arrive.
- Containerized environments (Docker/Kubernetes) introduce additional complexity for worker lifecycle — SIGTERM propagated from container orchestration must be mapped to the worker process correctly.
- Monitoring worker health requires tracking queue:work process uptime, job processing rate, and memory usage — the php artisan queue:monitor command provides basic health checks since Laravel 10.
