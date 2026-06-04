# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Worker Management
Knowledge Unit: systemd Service for Queue Workers
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
systemd is an alternative to Supervisord for managing queue workers, common on servers where Supervisor is not installed or where operational teams prefer native system tooling. A systemd service unit defines the worker command, restart policy, user, and resource limits. While Supervisor offers finer-grained process management (process groups, log rotation), systemd integrates with the OS's init system (journald logging, dependency-based startup, socket activation) and is available by default on modern Linux distributions.

# Core Concepts
- **Service unit file**: `/etc/systemd/system/queue-worker@.service` — defines the worker process.
- **Template unit**: `@` in the unit name allows parameterized instances (`queue-worker@1.service`, `queue-worker@2.service`).
- **`ExecStart`**: The command to run: `php /path/to/artisan queue:work redis --sleep=3 --tries=3 --max-jobs=500 --max-time=3600`.
- **`Restart=always`**: Always restart the worker when it exits (equivalent to Supervisor's `autorestart=true`).
- **`User=forge`**: Run as non-root user.
- **`RestartSec`**: Delay before restarting (prevents rapid restart loops).
- **`Journald`**: Logging via `journalctl -u queue-worker@1` — centralized logging, no separate log files.

# Mental Models
- **Native guardian**: systemd is the OS's built-in process manager. Like Supervisor, it watches and restarts workers. It's just part of the operating system rather than a separate package.
- **Parameterized factory**: The `@` template is like a factory — create as many worker instances as needed, each with a different index.

# Internal Mechanics
- systemd reads unit files from `/etc/systemd/system/`.
- `systemctl start queue-worker@1` starts instance 1. `systemctl enable queue-worker@1` enables auto-start on boot.
- On worker exit, `Restart=always` triggers an automatic restart after `RestartSec`.
- The `Type=simple` default means systemd considers the process started when `ExecStart` forks.
- `KillMode=process` (default) sends SIGTERM to the main process only. `KillMode=mixed` sends to the main process, then cgroup.
- Logging goes to journald by default. `journalctl -u queue-worker@1 -f` for real-time logs.

# Patterns
## Parameterized Multi-Worker
- **Purpose**: Run multiple workers using a single template unit.
- **Benefit**: `systemctl start queue-worker@{1..4}` starts 4 workers.
- **Tradeoff**: Must manually manage instance range; no auto-scaling.

## Combined with systemd Timer
- **Purpose**: Restart workers on a schedule via systemd timer.
- **Benefit**: Periodic fresh starts regardless of job count.
- **Tradeoff**: Adds timer management complexity.

## Resource-Limited Worker via systemd
- **Purpose**: Use systemd's `MemoryMax`, `CPUQuota` for worker resource limits.
- **Benefit**: OS-enforced resource caps; no need for `--memory` flag.
- **Tradeoff**: Limits are per-service, not per-job.

# Architectural Decisions
- **Use systemd over Supervisor when**: You want native OS integration, simpler stack (fewer packages), or the ops team prefers systemd.
- **Use Supervisor over systemd when**: You need process groups (`numprocs`), auto-scaling within a group, or more sophisticated log management.
- **Use systemd for**: Small deployments (1-2 servers), teams familiar with systemd, or when avoiding Supervisor dependency.

# Tradeoffs
systemd | Native OS integration, no extra package, journald logs | Manual multi-instance; no process groups; simpler restart policies
Supervisor | Process groups, numprocs scaling, rich config | Extra package; separate config format
Supervisor + Horizon | Code-driven config, auto-balancing | More complex stack; Redis dependency

# Performance Considerations
- systemd service overhead: negligible.
- Multiple systemd services: each is a separate process, same memory as Supervisor-managed workers.
- Journald log storage: by default, logs are stored in `/var/log/journal/`. Configure `MaxUse` to prevent disk fill.

# Production Considerations
- Enable workers on boot: `systemctl enable queue-worker@1`.
- Monitor worker status: `systemctl status queue-worker@1`.
- Rolling restarts: `systemctl restart queue-worker@{1..4}` — restarts all workers (brief period with reduced capacity).
- For multi-server deployments, each server has its own systemd services.
- systemd does NOT have an equivalent of Supervisor's `numprocs` — use `@` templates with a loop in a shell script or Ansible.

# Common Mistakes
- **Forgetting to set `Restart=always`**: Worker exits after `--max-jobs` and is NOT restarted. Queue stops processing.
- **Using `KillMode=process`**: SIGTERM is sent to the main process only. If the worker spawned subprocesses (via `proc_open`), they become orphaned.
- **Not setting `User=`**: Worker runs as root by default. Security risk.
- **Running without `--max-jobs`/`--max-time`**: Worker runs forever, memory grows indefinitely.
- **Too short `RestartSec`**: Worker crashes and restarts immediately. If the crash is due to a persistent error, this creates a tight restart loop.

# Failure Modes
- **systemd restart loop**: Worker crashes immediately on start (e.g., PHP error). systemd restarts it repeatedly until `StartLimitInterval` is exceeded — then marks as failed.
- **Log file fills disk**: Journald logs accumulate. If `MaxUse` is not configured, they can fill the disk.
- **systemd timeout on stop**: Default `TimeoutStopSec=90s`. If the worker doesn't stop within 90s, systemd sends SIGKILL.
- **Orphaned PHP processes**: Without proper `KillMode`, child processes survive worker termination.
- **Configuration drift**: Different systemd versions (Ubuntu vs CentOS) have different default values for restart and timeout behaviors.

# Ecosystem Usage
- **Laravel framework**: Documentation mentions systemd as an alternative to Supervisor.
- **Laravel Forge**: Forge uses Supervisor by default, not systemd.
- **Spatie packages**: Not affected; systemd manages the worker process regardless of job content.

# Related Knowledge Units
- K056 Worker Daemon Architecture | K059 Supervisor Configuration (comparison with systemd)

## Research Notes
- The queue:work command uses a daemon loop that persists the Laravel application instance across job processing — memory grows over time and periodic recycling via --max-jobs or --max-time is essential in production.
- Process signal handling for workers (SIGTERM, SIGQUIT, SIGINT) changed in Laravel 11 — workers now attempt to finish the current job before stopping, reducing job loss during deployments.
- Supervisor's stopwaitsecs must be configured in relation to the --timeout value — a common misconfiguration causes process force-kill during graceful shutdown before jobs complete.
- Systemd service units for queue workers need Restart=always, RestartSec=3s, and KillMode=process to prevent the supervisor from killing child processes prematurely during unit restart.
- The --sleep parameter controls polling backoff when the queue is empty — setting this too low causes unnecessary CPU usage from idle polling; too high delays job processing when jobs arrive.
- Containerized environments (Docker/Kubernetes) introduce additional complexity for worker lifecycle — SIGTERM propagated from container orchestration must be mapped to the worker process correctly.
- Monitoring worker health requires tracking queue:work process uptime, job processing rate, and memory usage — the php artisan queue:monitor command provides basic health checks since Laravel 10.
