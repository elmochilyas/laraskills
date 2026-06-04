# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K056 — Worker Daemon Architecture
- **Knowledge ID:** K056
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Source — `Illuminate\Queue\Worker::daemon()`
  - Laravel Docs — Queues: Running the Queue Worker

---

# Overview

`queue:work` launches a long-lived PHP daemon that boots the application once and processes jobs in an infinite loop. Unlike traditional PHP (boot, handle request, die), the daemon boots the framework once and reuses the service container across hundreds of jobs — ~10x faster than `queue:listen` (which reboots per job). However, daemon workers accumulate state (memory, stale connections, cached values) requiring periodic recycling via `--max-jobs` and `--max-time`.

---

# Core Concepts

- **Daemon process:** PHP process running indefinitely. Boots Laravel once, loops: pop → process → sleep → repeat.
- **`queue:listen` vs `queue:work`:** `listen` spawns a new PHP process per job (boots Laravel each time). `work` is a daemon (boots once). `work` is 5-10x faster.
- **State accumulation:** Service container, facades, static properties persist across jobs. Memory grows.
- **Recycling:** `--max-jobs` (jobs before exit) and `--max-time` (seconds before exit) force graceful exit. Supervisor restarts with fresh state.

---

# When To Use

- **Always use `queue:work` in production.** Daemon mode is far more efficient than `queue:listen`.
- **Set `--max-jobs` and `--max-time` on all production workers.** Standard: 500 jobs or 1 hour.
- **Set `--memory` to 128MB+.** Kills workers exceeding this threshold, preventing OOM.

---

# When NOT To Use

- `queue:listen` in production — poor performance, should only be used for local development.
- No recycling limits — worker runs forever, memory grows unbounded, eventual OOM.

---

# Best Practices

- **Always run under Supervisor/systemd.** If worker exits (--max-jobs, OOM, crash), supervisor restarts it. *Why: Without a process supervisor, a single worker failure or recycling exit stops all job processing until manual intervention.*
- **Set both `--max-jobs` and `--max-time` for defense in depth.** `--max-jobs` catches rapid job accumulation; `--max-time` catches slow leaks. *Why: A job that leaks 1MB per iteration is caught by `--max-jobs` after N jobs. A job that leaks 1MB per hour is caught by `--max-time` — but only if both limits are set.*
- **Use `--memory` limit as a safety net, not primary defense.** Default 128MB is conservative — adjust based on observed RSS. *Why: `--memory` is checked AFTER each job, not during — a single memory-intensive job can exceed the limit before the check runs.*
- **Run `queue:restart` after every deploy.** Old workers run old code. *Why: The daemon booted once at container start — it keeps the old code in memory until restarted.*

---

# Performance Considerations

- Daemon boot: ~50-200ms (one time). Job time = logic only.
- `queue:listen`: boot ~50-200ms PER JOB. For 100ms jobs, this is 50-66% overhead.
- Memory check uses `memory_get_usage(true)` — measures RSS, not allocator-internal.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| `queue:work` without Supervisor | No process manager | Worker exits on max-jobs — queue stops | Always use Supervisor/systemd |
| No `--max-jobs` / `--max-time` | Default is no limit | Memory grows unbounded → OOM | Set both limits |
| `queue:listen` in production | Familiarity from dev | 5-10x slower than daemon | Use `queue:work` |

---

# Related Topics

- **K057 Process Signals (K057)** — Stop/restart interaction
- **K058 max-jobs / max-time (K058)** — Recycling mechanism
- **K074 Worker Memory Management (K074)** — Memory regulation
