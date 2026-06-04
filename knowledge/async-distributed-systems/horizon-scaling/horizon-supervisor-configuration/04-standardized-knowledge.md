# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Horizon Scaling & Monitoring
- **Knowledge Unit:** K041 — Horizon Supervisor Configuration
- **Knowledge ID:** K041
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Horizon: Configuration
  - Laravel Source — `Laravel\Horizon\Supervisor`
  - Laravel Source — `Laravel\Horizon\MasterSupervisor`

---

# Overview

Horizon supervisors are the core unit of configuration — they define which queues to process, how many worker processes to allocate, balancing strategy, retry/timeout limits, and memory constraints. Unlike raw `queue:work` commands, Horizon supervisors are declared in `config/horizon.php` per environment and managed through Horizon's own process supervisor (the `Horizon::start()` master process). This code-driven configuration enables environment-specific worker topologies, version-controlled alongside application code.

---

# Core Concepts

- **Supervisor definition:** Each supervisor in `config/horizon.php` specifies `connection`, `queue`, `balance`, `minProcesses`, `maxProcesses`, `tries`, `timeout`, `memory`, `nice`, etc.
- **Environment mapping:** `environments` array maps environments (production, staging, local) to supervisor configurations.
- **Horizon master process:** `horizon:start` spawns the master process, which reads config and spawns supervisors.
- **Supervisor process tree:** Horizon master → supervisor processes → worker processes (one per worker).
- **Code-driven deployment:** Supervisor config is in source control. Changing worker topology is a code deploy.
- **Graceful restart:** `horizon:terminate` stops all supervisors and workers. `horizon:continue` resumes paused supervisors.

---

# When To Use

- Managing Laravel queue workers at scale across multiple environments
- Teams that want version-controlled worker topology (infrastructure as code)
- Applications with distinct job types requiring different worker configurations (webhooks, emails, reports)
- Multi-server deployments where consistent worker config across servers is critical

---

# When NOT To Use

- Simple single-server applications — `queue:work` with Supervisor is simpler
- Non-Laravel applications — Horizon is Laravel-specific
- Environments without Redis — Horizon requires Redis for coordination and dashboard data

---

# Best Practices

- **Set `maxJobs` and `maxTime` on all supervisors.** Prevents memory leak accumulation — 500 jobs or 1 hour is standard. *Why: PHP processes accumulate memory over time — recycling workers prevents OOM crashes.*
- **Use one supervisor per queue type.** Webhooks, emails, default, reports each get their own supervisor with tuned config. *Why: Different job types have different resource requirements — isolation prevents one workload from starving another.*
- **Run `horizon:terminate` in deployment scripts.** Signals workers to finish their current job and restart with new code. *Why: Without graceful termination, workers continue running old code until manually restarted.*
- **Set `nice` for priority.** Lower values (0 = highest) get more CPU time. Background maintenance jobs can use higher values (19). *Why: `nice` influences OS process scheduling priority — critical jobs get CPU preference over batch work.*

---

# Architecture Guidelines

- Horizon master process is lightweight (~10MB) — it does not process jobs, only manages supervisors.
- Each supervisor manages a pool of worker processes, spawning/killing based on balancing strategy.
- Workers internally run `php artisan queue:work horizon` — Horizon's custom queue worker command.
- Communication between Horizon and workers uses Redis keys (`illuminate:horizon:*`).
- Supervisors report metrics (job count, wait time, runtime) to Redis for the dashboard.
- The `processes` option (for `balance: false`) sets an exact fixed number of workers.

---

# Performance Considerations

- Each supervisor uses ~5-10MB baseline memory. Each worker uses ~20-40MB.
- With 4 supervisors × 10 workers each = baseline ~1-2GB for workers alone.
- Supervisor overhead (spawning, monitoring) is negligible.
- Process creation/disposal during balancing cycles adds transient CPU/memory load.

---

# Security Considerations

- Horizon config lives in `config/horizon.php` — ensure this file is not publicly accessible.
- The `force` option allows Horizon to run even if the environment is not in the config — use with caution in production.
- Workers run with the permissions of the Horizon process — ensure the process user has appropriate system access.
- `horizon:terminate` sends SIGTERM — ensure no data loss occurs from termination of in-progress jobs.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Missing environment config | Deploying to environment not in `horizon.php` | Horizon refuses to start | Add all deployment environments |
| Too many supervisors | 10 supervisors × 16 minProcesses | 160 processes on 4 cores — oversubscription | Match total workers to CPU cores × 2-3 |
| `balance: false` without `processes` | Omitting required `processes` setting | Horizon throws configuration error | Always set `processes` with `balance: false` |
| No horizon:terminate in deploy | Skipping graceful restart | Workers run old code indefinitely | Add `horizon:terminate` to deploy script |

---

# Anti-Patterns

- **One giant supervisor for all queues:** Processing emails, webhooks, and report generation on the same supervisor with the same config. Each workload has different requirements.
- **Hardcoding server-specific paths in supervisor config:** Config should be environment-aware but server-agnostic. Use environment variables for server-specific settings.
- **Not monitoring Horizon visibility:** Deploying Horizon without checking the dashboard — missed metrics, silent failures.

---

# Examples

```php
// config/horizon.php
'environments' => [
    'production' => [
        'supervisor-webhooks' => [
            'connection' => 'redis',
            'queue' => ['webhooks'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'minProcesses' => 2,
            'maxProcesses' => 10,
            'tries' => 3,
            'timeout' => 60,
            'nice' => 0,
        ],
        'supervisor-emails' => [
            'connection' => 'redis',
            'queue' => ['emails'],
            'balance' => 'simple',
            'minProcesses' => 1,
            'maxProcesses' => 5,
            'tries' => 1,
            'timeout' => 120,
            'nice' => 10,
        ],
        'supervisor-default' => [
            'connection' => 'redis',
            'queue' => ['default'],
            'balance' => 'auto',
            'minProcesses' => 1,
            'maxProcesses' => 3,
            'tries' => 3,
            'timeout' => 300,
        ],
    ],
    'staging' => [
        'supervisor-default' => [
            'connection' => 'redis',
            'queue' => ['default'],
            'balance' => 'auto',
            'minProcesses' => 1,
            'maxProcesses' => 2,
            'tries' => 3,
            'timeout' => 300,
        ],
    ],
],
```

---

# Related Topics

- **K042 Auto Balancing with `time` Strategy (K042)** — Dynamic balancing within supervisor config
- **K043 Simple and No Balancing Modes (K043)** — Alternative balancing strategies
- **K044 Horizon Tuning Parameters (K044)** — minProcesses, maxProcesses, balanceMaxShift, balanceCooldown
- **K049 Multi-Server Horizon (K049)** — Multi-server supervisor coordination

---

# AI Agent Notes

- When generating Horizon config, always include environment-specific supervisor configurations. Use `minProcesses` of at least 1 to prevent queue starvation.
- The `wait` option in supervisor config controls the polling interval during idle periods — recommend 3-5 seconds for most workloads.
- For bursty workloads (webhooks), prefer `auto` balancing with `time` strategy. For steady workloads, `simple` or `false` are appropriate.
- `horizon:terminate` should always be included in deployment scripts — it's the equivalent of a graceful queue worker restart.

---

# Verification

- [ ] Horizon starts successfully — run `php artisan horizon:start` and verify no errors
- [ ] Supervisor processes running — verify via `php artisan horizon:status`
- [ ] Workers processing jobs — dispatch a test job and verify it appears in Horizon dashboard
- [ ] Environment config matches APP_ENV — verify Horizon uses correct environment block
- [ ] `horizon:terminate` works — verify graceful shutdown with no job interruption
- [ ] Dashboard accessible — navigate to `/horizon` and verify metrics display
