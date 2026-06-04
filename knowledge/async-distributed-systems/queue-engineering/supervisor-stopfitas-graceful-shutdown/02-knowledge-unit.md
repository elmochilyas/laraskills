# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Worker Management
Knowledge Unit: Supervisor `stopwaitsecs` and Graceful Shutdown
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
`stopwaitsecs` in Supervisor config determines how long Supervisor waits for a process to stop after sending SIGTERM before sending SIGKILL. If `stopwaitsecs` is shorter than the worker's remaining job execution time, the worker is force-killed mid-job — the job is lost (until `retry_after` expires) and may be double-processed. This parameter must be tuned to exceed the longest expected job runtime. Related: `stopasgroup` and `killasgroup` control whether signals are sent to the entire process group.

# Core Concepts
- **`stopwaitsecs`**: Time (seconds) Supervisor waits for SIGTERM to stop the process. Default: 10 seconds.
- **SIGTERM → SIGKILL sequence**: Graceful stop → wait `stopwaitsecs` → force kill.
- **Worker behavior on SIGTERM**: Finishes current job, then exits. This takes up to the job's execution time.
- **`stopasgroup=true`**: Send SIGTERM to the process group (worker + its children), not just the parent.
- **`killasgroup=true`**: Send SIGKILL to the process group if `stopwaitsecs` expires.
- **Impact**: If `stopwaitsecs` < job execution time, the worker is killed before finishing. The job is not deleted from the queue — it re-appears after `retry_after`.

# Mental Models
- **Eviction notice**: Supervisor gives a 10-second eviction notice (SIGTERM). If you're not out in 10 seconds, the sheriff (SIGKILL) forcibly removes you. If you need 30 seconds to pack (process your job), you need a 30-second notice period.
- **Hotel checkout**: `stopwaitsecs` is the checkout time. You must be out by this time. If you're not, your belongings are removed (job lost). Set checkout time to your latest possible checkout.

# Internal Mechanics
- On `supervisorctl stop` or during `supervisorctl restart`: Supervisor sends SIGTERM to the process.
- Worker receives SIGTERM → sets `shouldQuit = true` → finishes current job → exits.
- Supervisor starts `stopwaitsecs` timer.
- If worker exits before timer: clean shutdown.
- If timer expires: Supervisor sends SIGKILL → OS immediately terminates the process.
- With `stopasgroup=true`: SIGTERM goes to the process group. If the worker spawned subprocesses (for `--timeout` management), they also receive SIGTERM.
- With `killasgroup=true`: SIGKILL goes to the process group after `stopwaitsecs`.

# Patterns
## Generous `stopwaitsecs`
- **Purpose**: Ensure no job is interrupted during shutdown.
- **Benefit**: Zero job loss from forced termination.
- **Tradeoff**: Shutdown may take minutes if there's a long-running job.

## Aggressive `stopwaitsecs`
- **Purpose**: Fast shutdown during deployments.
- **Benefit**: Quick deployment turnover.
- **Tradeoff**: Jobs may be killed and need re-processing.

## Timeout-Based Alignment
- **Purpose**: Set `stopwaitsecs` to match `retry_after` + buffer.
- **Benefit**: If worker is killed, the job is re-queued within the expected retry window.
- **Tradeoff**: Must coordinate with queue configuration.

# Architectural Decisions
- **Set `stopwaitsecs` = max expected job runtime + 10 seconds**: For most workers, 60-90 seconds is safe. For jobs that run 10 minutes, set `stopwaitsecs=610`.
- **Always use `stopasgroup=true` and `killasgroup=true`**: Prevents orphaned subprocesses.
- **For Horizon workers**: Horizon manages `stopwaitsecs` internally. Supervisor's `stopwaitsecs` should be higher than Horizon's internal timeout.

# Tradeoffs
Long `stopwaitsecs` (300s) | No job loss, safe | Deploy takes longer; old worker lingers
Short `stopwaitsecs` (10s) | Fast deploy, quick turnaround | Frequent job interruption; double-processing risk
Group management enabled | Clean child process shutdown | May kill processes that should survive

# Performance Considerations
- `stopwaitsecs` timer has no CPU cost — it's just a wall-clock wait.
- The worker holds memory during the shutdown wait. Long `stopwaitsecs` with memory-intensive workers delays memory release.
- SIGKILL immediately frees all process memory — fast but ungraceful.

# Production Considerations
- Default `stopwaitsecs=10` is dangerously low for most production queue workers.
- Audit all Supervisor configs for `stopwaitsecs`. Many deployment tools (Forge, Envoyer) set conservative defaults, but always verify.
- During rolling deployments, the first server's slow shutdown (due to long `stopwaitsecs`) delays the deployment pipeline.
- Monitor shutdown duration in Supervisord logs. If workers are consistently killed (SIGKILL), increase `stopwaitsecs`.
- For zero-downtime deployments, use rolling restarts where `stopwaitsecs` is only relevant per server.

# Common Mistakes
- **Using default `stopwaitsecs=10`**: Most queue jobs take longer than 10 seconds. Workers are always killed with SIGKILL.
- **Not setting `stopasgroup=true`**: Worker process is killed, but subprocess (e.g., for `--timeout`) survives as an orphan.
- **Setting `stopwaitsecs` lower than `--timeout`**: The worker may be killed while a job is running. The job is lost.
- **Setting `stopwaitsecs` too low for Horizon**: Horizon has its own internal grace period. Supervisor's `stopwaitsecs` must exceed Horizon's.
- **Ignoring `killasgroup`**: Subprocesses survive the SIGKILL if only the parent is targeted.

# Failure Modes
- **SIGKILL during critical job**: Job processing is interrupted mid-stream. If the job had side effects (DB writes, API calls), they may be partially committed.
- **Orphaned subprocesses**: Without `killasgroup`, killed workers leave behind PHP subprocesses that accumulate and consume memory.
- **Deploy-time job loss**: A deploy terminates workers before they finish long-running jobs. The jobs re-queue and re-process — acceptable if idempotent, but wasted work.
- **`stopwaitsecs` → SIGKILL → retry_after interaction**: Worker is killed. Job is not deleted. After `retry_after` seconds, another worker picks it up. If the original job had partially committed work, double effects occur.

# Ecosystem Usage
- **Supervisor**: `stopwaitsecs`, `stopasgroup`, `killasgroup` are standard Supervisor config options.
- **Laravel Forge**: Forge generates Supervisor configs with `stopwaitsecs` configurable via UI.
- **Laravel Horizon**: Horizon is NOT managed by Supervisor's `stopwaitsecs` in the same way. Horizon manages its own graceful shutdown via `horizon:terminate`. Supervisor should use generous `stopwaitsecs` for Horizon master process.

# Related Knowledge Units
- K057 Process Signals (SIGTERM/SIGKILL interaction) | K061 Deployment Restart Strategies (deployment context)

## Research Notes
- The queue:work command uses a daemon loop that persists the Laravel application instance across job processing — memory grows over time and periodic recycling via --max-jobs or --max-time is essential in production.
- Process signal handling for workers (SIGTERM, SIGQUIT, SIGINT) changed in Laravel 11 — workers now attempt to finish the current job before stopping, reducing job loss during deployments.
- Supervisor's stopwaitsecs must be configured in relation to the --timeout value — a common misconfiguration causes process force-kill during graceful shutdown before jobs complete.
- Systemd service units for queue workers need Restart=always, RestartSec=3s, and KillMode=process to prevent the supervisor from killing child processes prematurely during unit restart.
- The --sleep parameter controls polling backoff when the queue is empty — setting this too low causes unnecessary CPU usage from idle polling; too high delays job processing when jobs arrive.
- Containerized environments (Docker/Kubernetes) introduce additional complexity for worker lifecycle — SIGTERM propagated from container orchestration must be mapped to the worker process correctly.
- Monitoring worker health requires tracking queue:work process uptime, job processing rate, and memory usage — the php artisan queue:monitor command provides basic health checks since Laravel 10.
