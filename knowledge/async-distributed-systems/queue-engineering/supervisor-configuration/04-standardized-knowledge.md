# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K059 — Supervisor Configuration for Queue Workers
- **Knowledge ID:** K059
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Supervisor Docs
  - Laravel Docs — Queues: Supervisor Configuration

---

# Overview

Supervisord is the standard process manager for Laravel queue workers. It keeps worker processes running, restarts them on crash or after recycling (`--max-jobs`, `--max-time`), and manages multi-process deployments. Key parameters: `numprocs` (worker count), `autorestart=true` (always restart), `stopwaitsecs` (graceful shutdown timeout), `stopasgroup`/`killasgroup` (process group management). Without Supervisor, a single worker failure stops all processing.

---

# Core Concepts

- **`numprocs`:** Number of worker processes. Scales concurrency.
- **`autorestart=true`:** Always restart on exit (for any reason).
- **`stopwaitsecs`:** Wait time for SIGTERM graceful shutdown before SIGKILL.
- **`stopasgroup`/`killasgroup`:** Manage process groups — prevents orphan subprocesses.
- **`user=forge`:** Run as non-root user.

---

# When To Use

- Always for production `queue:work` deployments (unless using Horizon).
- Per-queue worker groups for independent scaling per queue.
- If not using Horizon — Supervisor is the standard approach.

---

# When NOT To Use

- When using Horizon — Horizon is its own process supervisor.
- Single-server dev environments — `queue:work` can run directly.

---

# Best Practices

- **Always use `autorestart=true`.** Workers exit after `--max-jobs`/`--max-time` — without autorestart, processing stops. *Why: Worker recycling is built into Laravel's daemon — it relies on the process supervisor to detect the exit and spawn a fresh worker.*
- **Always use `stopasgroup=true` and `killasgroup=true`.** Prevents orphaned subprocesses when workers are killed. *Why: Without process group management, SIGTERM kills only the parent process — child processes (from `--timeout` subprocess or `proc_open`) survive as zombies.*
- **Set `stopwaitsecs` to max job runtime + buffer.** If jobs run up to 60 seconds, set `stopwaitsecs=70`. *Why: When Supervisor sends SIGTERM, the worker finishes its current job before exiting. If `stopwaitsecs` expires before the job finishes, Supervisor sends SIGKILL — the job is lost.*
- **Set `numprocs` based on workload.** CPU-bound: `numprocs <= core_count`. I/O-bound: `numprocs` up to 2-3x core_count. *Why: CPU-bound jobs benefit from at most one per core — more causes context switching overhead. I/O-bound jobs spend most time waiting (HTTP, DB) — more workers utilize idle CPU.*

---

# Performance Considerations

- Each worker uses ~20-40MB RAM. 20 workers = 400-800MB baseline.
- Process spawning: ~100ms per worker.
- High `numprocs` on low-CPU: context switching reduces throughput.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| `autorestart` not set | Default may be false | Worker exits and never restarts | Always set `autorestart=true` |
| `stopwaitsecs` too short (default 10s) | Misunderstanding graceful shutdown | Worker SIGKILLed mid-job → double processing | Set to max job time + buffer |
| No `stopasgroup` | Default is false | Zombie subprocesses accumulate | Set `stopasgroup=true` |
| Worker as root | Default user | Security risk | Set `user=forge` |

---

# Examples

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /home/forge/app/artisan queue:work redis --sleep=3 --tries=3 --max-jobs=500 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=forge
numprocs=4
stopwaitsecs=70
```

---

# Related Topics

- **K056 Worker Daemon Architecture (K056)** — What Supervisor manages
- **K083 Supervisor stopwaitsecs (K083)** — Graceful shutdown details
