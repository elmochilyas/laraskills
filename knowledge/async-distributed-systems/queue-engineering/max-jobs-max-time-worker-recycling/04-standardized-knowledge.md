# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K058 — `--max-jobs` and `--max-time` for Worker Recycling
- **Knowledge ID:** K058
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: `queue:work` Options
  - Laravel Source — `Illuminate\Queue\Worker`

---

# Overview

`--max-jobs` and `--max-time` force daemon workers to exit after processing N jobs or running for N seconds, preventing unbounded memory growth and stale state accumulation. Without these limits, PHP daemon workers gradually consume more memory until OOM or degrade from stale connection handles. Both are enforced after each job completes — the worker finishes the current job, then exits cleanly.

---

# Core Concepts

- **`--max-jobs`:** Max jobs before worker exits. Default: 0 (no limit).
- **`--max-time`:** Max seconds worker runs before exiting. Default: 0 (no limit).
- **Graceful exit:** Worker finishes current job, then exits. No job interrupted.
- **Process restart:** Supervisor/systemd restarts the worker after exit.
- **Horizon equivalent:** Per-supervisor via `maxJobs` and `maxTime` config.

---

# When To Use

- **Always set both.** Defense in depth — `--max-jobs` catches rapid accumulation; `--max-time` catches slow leaks.
- **Standard values:** `--max-jobs=500` and `--max-time=3600` (1 hour). Tune based on memory behavior.

---

# When NOT To Use

- Neither limit set — worker runs forever, memory grows unbounded, eventual OOM.
- `--max-jobs` too low (e.g., 10) — worker restarts every few minutes, excessive boot overhead.
- `--max-time` too low (e.g., 300) — worker processes only ~30 jobs per lifetime.

---

# Best Practices

- **Set both limits for defense in depth.** A quick memory leak is caught by `--max-jobs`; a slow leak by `--max-time`. *Why: A job leaking 10MB per iteration is caught by `--max-jobs=500` (5GB growth). A job leaking 100KB per iteration accumulates only 1GB in 500 jobs — `--max-time` catches it before it reaches OOM.*
- **Tune based on observed memory growth.** Monitor RSS over worker lifetime. If a worker grows 30MB over 500 jobs but `--memory` is 128MB, you can increase `--max-jobs`. *Why: Worker recycling has overhead (~50-200ms per restart). Tune the limits to maximize throughput while keeping memory within safe bounds.*
- **Ensure Supervisor `autorestart=true`.** Without it, the worker exits after `--max-jobs` and never restarts. *Why: The recycling mechanism relies on the process supervisor to detect the exit and spawn a new worker — without `autorestart`, the queue stops processing.*

---

# Performance Considerations

- Each restart costs ~50-200ms (PHP boot + Laravel boot).
- At 500 jobs/restart: ~0.02% overhead per job. Negligible.
- After restart, worker starts at baseline memory (~20MB).

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Neither limit set | Default is 0 | Memory grows unbounded → OOM | Set both limits |
| `--max-jobs` too low | Overly conservative | Frequent restarts kill throughput | Standard: 500 jobs |
| No Supervisor autorestart | Process manager misconfig | Worker exits and never returns | Set `autorestart=true` |

---

# Related Topics

- **K056 Worker Daemon Architecture (K056)** — Daemon loop context
- **K074 Worker Memory Management (K074)** — Memory regulation
