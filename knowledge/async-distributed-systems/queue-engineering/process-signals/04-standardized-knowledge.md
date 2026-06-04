# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K057 — Process Signals (SIGTERM, SIGQUIT, SIGUSR2, SIGCONT)
- **Knowledge ID:** K057
- **Difficulty Level:** Expert
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Source — `Illuminate\Queue\Worker::listenForSignals()`
  - Supervisor Docs — Process Signals

---

# Overview

The queue worker responds to POSIX process signals for lifecycle management: **SIGTERM** (graceful shutdown — finish current job then exit), **SIGQUIT** (immediate shutdown), **SIGUSR2** (pause — stop new jobs, finish current), and **SIGCONT** (resume). These signals enable Supervisor and Horizon to manage workers without force-killing. Signal handling requires the `pcntl` extension — without it, signals are ignored.

---

# Core Concepts

- **SIGTERM (15):** "Please stop." Worker finishes current job, then exits. No new jobs popped.
- **SIGQUIT (3):** "Stop now." Exits after current job finishes, but may abort if `--timeout` exceeded.
- **SIGUSR2 (12):** "Pause." Stops popping new jobs. Completes current, then waits.
- **SIGCONT (18):** "Resume." Worker resumes popping jobs.
- **Signal handlers:** Registered `pcntl_signal()` in `listenForSignals()`. Tick-based polling via `pcntl_signal_dispatch()`.
- **`--timeout`:** Uses SIGALRM or `proc_terminate` — not a SIGTERM signal; it kills the worker if a job exceeds the limit.

---

# When To Use

- **SIGTERM for deployment shutdown:** Supervisor's default stop signal. Worker finishes current job gracefully.
- **SIGUSR2 for temporary pause:** Horizon uses this to pause workers during backup/snapshot.
- **`queue:restart`** for restarting all workers across all servers — broadcasts restart via cache.

---

# When NOT To Use

- **SIGKILL (9) — never use.** Uncatchable. Worker dies immediately. Current job lost (re-queued after `retry_after`).
- Ignoring signal behavior in environments without `pcntl` (Windows) — signals don't work.

---

# Best Practices

- **Set Supervisor `stopwaitsecs` to exceed the longest expected job runtime.** Otherwise, Supervisor sends SIGKILL after the timer expires, before the worker finishes its job. *Why: SIGTERM waits for the current job to finish — if `stopwaitsecs` is 10s but the job takes 60s, Supervisor SIGKILLs the worker mid-job.*
- **Use `queue:restart` for multi-server restart.** It sets a cache key all workers check — no need to SSH into each server. *Why: Workers poll the restart cache key every loop iteration — updating it broadcasts restart to all workers across all servers simultaneously.*
- **Ensure `pcntl` extension is installed.** Without it, SIGTERM is ignored — Supervisor eventually SIGKILLs, causing job loss. *Why: Signal handlers are registered via `pcntl_signal()` — without the extension, the handlers are no-ops and the worker never checks `shouldQuit`.*

---

# Performance Considerations

- Signal dispatch called once per loop iteration — negligible overhead.
- Pause check adds a cache read per iteration.
- `--timeout` kills the process — no graceful cleanup for the current job.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming SIGTERM is immediate | Misunderstanding graceful shutdown | Shutdown takes as long as longest job | Set `stopwaitsecs` accordingly |
| No `pcntl` extension | Missing PHP extension | Signals ignored — worker never stops gracefully | Install `pcntl` extension |
| Using SIGKILL (kill -9) | Convenience | Job lost mid-processing, double-processing risk | Always use SIGTERM first |

---

# Related Topics

- **K056 Worker Daemon Architecture (K056)** — Daemon loop context
- **K083 Supervisor stopwaitsecs (K083)** — Interaction with signals
