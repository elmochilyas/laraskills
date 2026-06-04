# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Worker Management
Knowledge Unit: Deployment Restart Strategies (`horizon:terminate`)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Deploying new code requires restarting queue workers to pick up the updated application. For `queue:work` workers, `queue:restart` broadcasts a restart signal via cache. For Horizon, `horizon:terminate` gracefully stops all supervisors and workers, then `horizon:continue` (or the process supervisor) restarts them. The restart strategy must balance zero job loss (finish current jobs) with prompt code deployment.

# Core Concepts
- **`queue:restart`**: Sets a cache key (`illuminate:queue:restart`) that all workers check. Workers finish their current job, then exit. Supervisor restarts them with new code.
- **`horizon:terminate`**: Sends pause → terminate signals to all supervisor processes. Workers finish current jobs and exit. Horizon master process stops.
- **`horizon:continue`**: Resumes paused Horizon. Used after maintenance.
- **Grace period**: Workers may take up to max(`--timeout`, longest job) seconds to finish before restarting.
- **Rolling restart** (multi-server): Terminate Horizon on Server A, wait, deploy, restart. Repeat for Server B.

# Mental Models
- **Theater intermission**: `horizon:terminate` is like ringing the intermission bell. Current actors finish their scene, then the curtain falls. When code is deployed, the bell rings again (`horizon:continue`) and the show resumes with new material.
- **Baton relay**: Workers are runners passing a baton. The restart is the handoff zone — the current runner finishes their lap (job) and passes the baton to the new runner (process).

# Internal Mechanics
- `queue:restart` writes the current timestamp to cache key `illuminate:queue:restart`.
- Each worker checks this key in its main loop (`$this->stopIfNeeded()`).
- If the cache value > worker start time, the worker sets `shouldQuit = true`.
- Worker finishes current job, breaks the loop, exits.
- Supervisor detects exit → spawns new worker with new code.
- `horizon:terminate` sends `pause` command via Redis → supervisors pause workers → workers finish jobs → supervisors send SIGTERM → workers exit.
- `horizon:continue` clears the pause state — workers resume processing.
- For multi-server: `horizon:terminate` must be run on each server individually.

# Patterns
## Zero-Downtime Rolling Restart
- **Purpose**: Restart workers without stopping processing entirely.
- **Benefit**: Jobs continue processing during deploy.
- **Tradeoff**: Brief period with reduced capacity (half workers active).

## Deferred Restart
- **Purpose**: Delay restart until current long-running jobs finish.
- **Benefit**: Avoid interrupting jobs that must not be interrupted.
- **Tradeoff**: Deploy takes longer; old code runs longer.

## Post-Deploy Auto-Restart via Script
- **Purpose**: Include `queue:restart` or `horizon:terminate` in deployment script.
- **Benefit**: Restart is automatic; no manual step.
- **Tradeoff**: If restart fails silently, old workers persist.

# Architectural Decisions
- **Use `queue:restart` for standard workers**: Simple, cache-based, reliable.
- **Use `horizon:terminate` for Horizon deployments**: Graceful, coordinated stop of all supervisors.
- **Always restart after deploy**: Without restart, workers run old code indefinitely.
- **Include restart in deployment script**: Enqueue. Deploy. Restart. Never rely on manual restart.

# Tradeoffs
`queue:restart` | Simple, instant broadcast, no CLI needed | Workers poll with delay; not all stop simultaneously
`horizon:terminate` | Coordinated, graceful, multi-supervisor | Must re-start with supervisor; not for non-Horizon
Rolling restart | Zero downtime, always capacity | More complex; coordination across servers

# Performance Considerations
- `queue:restart` propagation delay: workers check the cache every `--sleep` seconds. A worker with `--sleep=3` takes up to 3 seconds to notice the restart signal.
- `horizon:terminate` uses Redis pub/sub — near-instant propagation (~10ms).
- During rolling restart, capacity is reduced by 1/N per server. For 2 servers with 10 workers each: during restart, 10 workers are temporarily missing.

# Production Considerations
- Test restart in staging — ensure workers stop and restart correctly.
- Monitor worker count after deploy. Expected count = pre-deploy count. If lower, restart didn't work.
- Long-running jobs delay restart. Set `--timeout` to prevent jobs from delaying shutdown indefinitely.
- `queue:restart` requires a shared cache. On single-server, file cache works. On multi-server, Redis/Memcached required.
- For Horizon, deployment script should: `php artisan horizon:terminate` → wait → deploy → `supervisorctl restart horizon` (or similar).

# Common Mistakes
- **Not restarting workers after deploy**: Workers run old code. New code does not take effect. Bug fixes and features are not applied.
- **Using `queue:restart` without shared cache**: On multi-server with file cache, only workers on the same server receive the restart signal.
- **Terminating Horizon without restarting it**: `horizon:terminate` stops Horizon. If the process supervisor doesn't restart it, jobs stop processing.
- **Not waiting for workers to finish before deploy**: If code changes affect the currently running job, the job may fail after deploy.
- **Confusing `horizon:terminate` with `horizon:pause`**: `pause` stops new jobs but workers stay alive. `terminate` shuts everything down.

# Failure Modes
- **Restart signal missed**: Worker doesn't check the cache during a long job. It continues with old code after deploy.
- **Horizon doesn't auto-start after terminate**: If Supervisor is not configured to restart Horizon after it exits, queue processing stops.
- **Rolling restart race condition**: Server A deploys new code that changes database schema. Server B (still on old code) processes jobs that reference the new schema and fails.
- **Restart during job execution**: A job is mid-processing when the worker receives the restart signal. The job finishes, but the next job waits for the new worker — no data loss.
- **Cache (restart key) expires before all workers check**: If cache TTL is short and workers check infrequently, some workers may never see the restart signal.

# Ecosystem Usage
- **Laravel framework**: `queue:restart` built-in. Uses cache facade.
- **Laravel Horizon**: `horizon:terminate` and `horizon:continue` commands.
- **Laravel Forge**: Forge deployment scripts include `php artisan horizon:terminate` by default for Horizon projects.
- **Spatie packages**: Not directly affected, but deployment without proper restart means new Spatie package code doesn't take effect in workers.

# Related Knowledge Units
- K057 Process Signals (what happens during termination) | K049 Multi-Server Horizon (rolling restart across servers)

## Research Notes
- The queue:work command uses a daemon loop that persists the Laravel application instance across job processing — memory grows over time and periodic recycling via --max-jobs or --max-time is essential in production.
- Process signal handling for workers (SIGTERM, SIGQUIT, SIGINT) changed in Laravel 11 — workers now attempt to finish the current job before stopping, reducing job loss during deployments.
- Supervisor's stopwaitsecs must be configured in relation to the --timeout value — a common misconfiguration causes process force-kill during graceful shutdown before jobs complete.
- Systemd service units for queue workers need Restart=always, RestartSec=3s, and KillMode=process to prevent the supervisor from killing child processes prematurely during unit restart.
- The --sleep parameter controls polling backoff when the queue is empty — setting this too low causes unnecessary CPU usage from idle polling; too high delays job processing when jobs arrive.
- Containerized environments (Docker/Kubernetes) introduce additional complexity for worker lifecycle — SIGTERM propagated from container orchestration must be mapped to the worker process correctly.
- Monitoring worker health requires tracking queue:work process uptime, job processing rate, and memory usage — the php artisan queue:monitor command provides basic health checks since Laravel 10.
