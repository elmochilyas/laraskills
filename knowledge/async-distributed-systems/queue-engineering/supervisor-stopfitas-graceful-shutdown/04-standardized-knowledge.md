# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K083 — Supervisor `stopwaitsecs` and Graceful Shutdown
- **Knowledge ID:** K083
- **Difficulty Level:** Intermediate
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Supervisor Docs — Configuration
  - Laravel Docs — Queues: Supervisor

---

# Overview

`stopwaitsecs` in Supervisor config determines how long Supervisor waits for a process to stop after sending SIGTERM before sending SIGKILL. If `stopwaitsecs` is shorter than the worker's remaining job execution time, the worker is force-killed mid-job — the job is lost (until `retry_after` expires) and may be double-processed. This parameter must be tuned to exceed the longest expected job runtime.

---

# Core Concepts

- **`stopwaitsecs`:** Seconds Supervisor waits for SIGTERM to stop the process. Default: 10 seconds.
- **SIGTERM → SIGKILL sequence:** Graceful stop → wait `stopwaitsecs` → force kill.
- **Worker on SIGTERM:** Finishes current job, then exits. Takes up to job execution time.
- **`stopasgroup=true`:** Signal to process group (worker + children), not just parent.
- **`killasgroup=true`:** SIGKILL to process group if timer expires.

---

# When To Use

- **Generous `stopwaitsecs` (job runtime + buffer):** Ensures no job is interrupted. For most workers, 60-90 seconds.
- **Always `stopasgroup=true` and `killasgroup=true`:** Prevents orphaned subprocesses.

---

# When NOT To Use

- Default 10 seconds — dangerously low for most production workers.
- Setting `stopwaitsecs` lower than `--timeout` — guarantees SIGKILL during job processing.

---

# Best Practices

- **Set `stopwaitsecs` to max expected job runtime + 10 seconds.** If jobs run up to 60 seconds, set `stopwaitsecs=70`. *Why: When Supervisor sends SIGTERM, the worker finishes its current job before exiting — this takes up to the job's execution time. If `stopwaitsecs` expires first, SIGKILL kills the worker mid-job.*
- **Always use `stopasgroup=true` and `killasgroup=true`.** Prevents orphaned subprocesses. *Why: Without `stopasgroup`, SIGTERM kills only the parent worker process — any subprocesses (from `--timeout` or `proc_open`) survive as zombie processes consuming memory.*
- **Default `stopwaitsecs=10` is dangerously low for production.** Audit all Supervisor configs. Many deployment tools set conservative defaults, but always verify. *Why: Most queue jobs take longer than 10 seconds to process — default `stopwaitsecs` guarantees SIGKILL on every graceful shutdown, defeating the purpose of graceful shutdown.*

---

# Performance Considerations

- `stopwaitsecs` timer has no CPU cost — wall-clock wait only.
- Worker holds memory during shutdown wait — long `stopwaitsecs` with memory-intensive workers delays memory release.
- SIGKILL immediately frees all process memory — fast but ungraceful.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Default `stopwaitsecs=10` | Not configuring | Worker always SIGKILLed mid-job | Set to job runtime + buffer |
| `stopwaitsecs` < `--timeout` | Misunderstanding | Guaranteed SIGKILL during job | Ensure `stopwaitsecs` > `--timeout` |
| No `stopasgroup` | Default is false | Orphaned subprocesses accumulate | Always set `stopasgroup=true` |

---

# Examples

```ini
[program:laravel-worker]
command=php /home/forge/app/artisan queue:work redis --sleep=3 --tries=3 --timeout=60
process_name=%(program_name)s_%(process_num)02d
numprocs=4
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
stopwaitsecs=70  ; Must exceed --timeout (60)
user=forge
```

---

# Related Topics

- **K057 Process Signals (K057)** — SIGTERM/SIGKILL interaction
- **K061 Deployment Restart Strategies (K061)** — Deployment context
