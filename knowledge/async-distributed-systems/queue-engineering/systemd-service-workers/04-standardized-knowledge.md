# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K060 — systemd Service for Queue Workers
- **Knowledge ID:** K060
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - systemd Documentation
  - Laravel Docs — Queues: Supervisor (with systemd alternative)

---

# Overview

systemd is an alternative to Supervisor for managing queue workers, common where ops teams prefer native OS tooling. A systemd service unit defines the worker command, restart policy, user, and resource limits. While Supervisor offers finer-grained process management, systemd integrates with journald logging and init system features. Template units (`@`) allow parameterized multi-worker instances.

---

# Core Concepts

- **Service unit file:** `/etc/systemd/system/queue-worker@.service` — defines the process.
- **Template unit:** `@` allows parameterized instances (`queue-worker@1`, `queue-worker@2`).
- **`Restart=always`:** Always restart on exit (equivalent to Supervisor's `autorestart=true`).
- **`RestartSec`:** Delay before restart (prevents rapid restart loops).
- **`User=forge`:** Run as non-root.
- **`KillMode`:** Controls how processes are terminated — `process` (default), `mixed`, `control-group`.
- **Journald:** `journalctl -u queue-worker@1` for centralized logging.

---

# When To Use

- Over Supervisor: when ops team prefers systemd, smaller deployments (1-2 servers), avoiding extra package dependency.
- Combined with systemd timer for scheduled worker restarts.

---

# When NOT To Use

- When you need process groups (`numprocs`) — systemd requires manual instance management.
- When Horizon is used — Horizon manages its own processes.
- When you need Supervisor's richer log management.

---

# Best Practices

- **Set `Restart=always`.** Without it, worker exits after `--max-jobs` and never restarts. *Why: Same as Supervisor `autorestart=true` — worker recycling depends on the process manager detecting the exit and spawning a new worker.*
- **Use template units for multi-worker.** `queue-worker@1`, `queue-worker@2` — manage each independently. *Why: systemd lacks `numprocs` — template units give you multi-worker with individual service control.*
- **Set `RestartSec=3s`.** Prevents tight restart loops on persistent errors. *Why: If the worker crashes on startup due to a PHP error, `RestartSec=0` creates a tight crash-restart loop that burns CPU.*
- **Set `KillMode=mixed` for clean subprocess handling.** Sends SIGTERM to the main process, then to the cgroup. *Why: `KillMode=process` only kills the main process — orphaned subprocesses survive. `mixed` covers the entire cgroup.*

---

# Performance Considerations

- systemd overhead: negligible.
- Each service = separate process, same memory as Supervisor-managed workers.
- Journald logs: configure `MaxUse` to prevent disk fill.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| No `Restart=always` | Default is no restart | Worker exits on max-jobs — queue stops | Always set `Restart=always` |
| `KillMode=process` (default) | Not specified | Child processes become orphans | Use `KillMode=mixed` |
| No `User=` set | Worker runs as root | Security risk | Set `User=forge` |
| No `RestartSec` | Default 0s | Tight restart loop on persistent errors | Set `RestartSec=3s` |

---

# Examples

```ini
[Unit]
Description=Laravel Queue Worker %i
After=network.target redis-server.service

[Service]
User=forge
ExecStart=/usr/bin/php /home/forge/app/artisan queue:work redis --sleep=3 --tries=3 --max-jobs=500 --max-time=3600
Restart=always
RestartSec=3s
KillMode=mixed
```

---

# Related Topics

- **K056 Worker Daemon Architecture (K056)** — What systemd manages
- **K059 Supervisor Configuration (K059)** — Comparison
