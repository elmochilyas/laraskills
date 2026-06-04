# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Worker Management
Knowledge Unit: Supervisor/Supervisord Configuration (numprocs, autorestart)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Supervisord is the standard process manager for Laravel queue workers. It keeps worker processes running, restarts them on crash or after recycling (`--max-jobs`, `--max-time`), and manages multi-process deployments. Key configuration parameters: `numprocs` (number of worker processes), `autorestart` (always restart on exit), `stopwaitsecs` (time to wait for graceful shutdown), `stopasgroup`/`killasgroup` (process group management). Without Supervisor, a single worker failure stops job processing until manually restarted.

# Core Concepts
- **`[program:worker]`**: Supervisor program definition. Each program manages a group of processes.
- **`numprocs`**: Number of worker processes to start. Scales concurrency.
- **`process_name`**: Template for process names: `%(program_name)s_%(process_num)02d`.
- **`autorestart=true`**: Always restart the worker when it exits (for any reason: `--max-jobs`, crash, signal).
- **`stopwaitsecs`**: Seconds to wait for SIGTERM graceful shutdown before SIGKILL.
- **`stopasgroup`/`killasgroup`**: Manage process groups — ensures child processes are also stopped.
- **`user=forge`**: Run workers as a specific user (not root).

# Mental Models
- **Babysitter**: Supervisor is the babysitter. It watches the workers (children) and takes action if they stop playing (crash). If a worker leaves (exits), the babysitter brings in a new one (restart).
- **Hotel front desk**: Workers are hotel guests. Supervisor is the front desk. When a guest checks out (exits), the front desk assigns the room to a new guest (starts a new process).

# Internal Mechanics
- Supervisor reads config files from `/etc/supervisor/conf.d/*.conf`.
- On `supervisorctl start`, it spawns `numprocs` processes running the command.
- Each process's stdout/stderr is captured to log files.
- When a process exits, Supervisor checks `autorestart`.
- On `stopwaitsecs` timer: SIGTERM → wait → if still running → SIGKILL.
- `stopasgroup=true` sends the signal to the process group, not just the parent process. Important when using `queue:work` which may spawn subprocesses.
- `user` specifies which OS user runs the process.

# Patterns
## Per-Queue Worker Groups
- **Purpose**: Separate Supervisor programs for different queues.
- **Benefit**: Independent processes, scaling, and restart policies per queue.
- **Tradeoff**: More config files to manage.

## Process Group Management
- **Purpose**: Use `stopasgroup` and `killasgroup` for clean shutdown.
- **Benefit**: Subprocesses (like `queue:work --timeout` child) are also killed.
- **Tradeoff**: May kill subprocesses that should survive the worker.

## Log Per Worker Process
- **Purpose**: Separate log files per worker process.
- **Benefit**: Debugging individual worker behavior.
- **Tradeoff**: Many log files; disk space.

# Architectural Decisions
- **Always use `autorestart=true`**: Workers that exit (for any reason) should be replaced.
- **Always use `stopasgroup=true`**: Ensures subprocesses are terminated, preventing zombie processes.
- **`numprocs` based on CPU cores**: For CPU-bound jobs, `numprocs <= core_count`. For I/O-bound, `numprocs > core_count` (up to 2-3x).
- **`stopwaitsecs` = max job timeout + buffer**: If jobs can run 60 seconds, set `stopwaitsecs=70`.

# Tradeoffs
Multiple workers per program | Simple config, scaled via numprocs | All workers share same config
Separate programs per queue | Independent scaling per queue | More config files; more complex management
High numprocs (25+) | High concurrency | CPU/memory contention; context switching overhead

# Performance Considerations
- Each worker process uses ~20-40MB RAM. 20 workers = 400-800MB baseline.
- Supervisor itself uses minimal resources (~5MB).
- Process spawning: Supervisor starts workers quickly (~100ms per process).
- High `numprocs` on low-CPU servers: context switching reduces effective throughput.

# Production Considerations
- Test `stopwaitsecs` value — too short causes SIGKILL before worker finishes job (job re-queued for double processing).
- Use `redirect_stderr=true` to capture error output in the log file.
- Set `stdout_logfile_maxbytes=50MB` and `stdout_logfile_backups=10` to manage log rotation.
- Monitor Supervisor status: `supervisorctl status all` shows worker states.
- Use `supervisorctl reread && supervisorctl update` after config changes.
- On multi-server deployments, each server has its own Supervisor.

# Common Mistakes
- **Not setting `autorestart=true`**: Worker exits after `--max-jobs`. Supervisor doesn't restart it. Queue stops processing.
- **Not setting `stopasgroup=true`**: SIGTERM kills the worker process but not its subprocess. Subprocess becomes zombie.
- **`stopwaitsecs` too short for long-running jobs**: Worker is SIGKILLed while processing a job. Job re-queues, potentially duplicates.
- **Running worker as root**: Security risk. Use `user=forge` or equivalent.
- **Too many log files without rotation**: Supervisor logs grow unbounded. Configure rotation.

# Failure Modes
- **Supervisor crash**: If Supervisor itself crashes, all workers die. No auto-recovery until Supervisor restarts.
- **FATAL state**: Worker starts but immediately exits (e.g., PHP fatal error). Supervisor marks as FATAL and stops retrying after `startretries` attempts.
- **Zombie processes**: Without `stopasgroup`, killed workers leave orphan processes consuming memory.
- **PID file conflicts**: Supervisor PID files conflict if config is duplicated or directories misconfigured.
- **Graceful stop timeout**: Workers that don't stop within `stopwaitsecs` are SIGKILLed. Current job processing is interrupted.

# Ecosystem Usage
- **Laravel framework**: Documentation recommends Supervisor for production queue workers.
- **Laravel Forge**: Forge auto-generates Supervisor config for queue workers during server provisioning.
- **Laravel Horizon**: Horizon replaces Supervisor for worker management. It is its own process supervisor.
- **Spatie packages**: Not directly related, but all queue workers regardless of package need process management.

# Related Knowledge Units
- K056 Worker Daemon Architecture (what Supervisor manages) | K083 Supervisor `stopwaitsecs` and Graceful Shutdown (advanced)

## Research Notes
- The queue:work command uses a daemon loop that persists the Laravel application instance across job processing — memory grows over time and periodic recycling via --max-jobs or --max-time is essential in production.
- Process signal handling for workers (SIGTERM, SIGQUIT, SIGINT) changed in Laravel 11 — workers now attempt to finish the current job before stopping, reducing job loss during deployments.
- Supervisor's stopwaitsecs must be configured in relation to the --timeout value — a common misconfiguration causes process force-kill during graceful shutdown before jobs complete.
- Systemd service units for queue workers need Restart=always, RestartSec=3s, and KillMode=process to prevent the supervisor from killing child processes prematurely during unit restart.
- The --sleep parameter controls polling backoff when the queue is empty — setting this too low causes unnecessary CPU usage from idle polling; too high delays job processing when jobs arrive.
- Containerized environments (Docker/Kubernetes) introduce additional complexity for worker lifecycle — SIGTERM propagated from container orchestration must be mapped to the worker process correctly.
- Monitoring worker health requires tracking queue:work process uptime, job processing rate, and memory usage — the php artisan queue:monitor command provides basic health checks since Laravel 10.
