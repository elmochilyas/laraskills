# Metadata
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: Horizon Supervisor Configuration
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Horizon supervisors are the core unit of configuration — they define which queues to process, how many worker processes to allocate, balancing strategy, retry/timeout limits, and memory constraints. Unlike raw `queue:work` commands, Horizon supervisors are declared in `config/horizon.php` per environment and managed through Horizon's own process supervisor (the `Horizon::start()` master process). This code-driven configuration enables environment-specific worker topologies, version-controlled alongside application code, without manual Supervisor configuration per server.

# Core Concepts
- **Supervisor definition**: Each supervisor in `config/horizon.php` is an array of configuration with `connection`, `queue`, `balance`, `minProcesses`, `maxProcesses`, `tries`, `timeout`, `memory`, `nice`, etc.
- **Environment mapping**: `environments` array maps environments (production, staging, local) to supervisor configurations.
- **Horizon master process**: `horizon:start` spawns the Horizon master process, which reads the config and spawns supervisors.
- **Supervisor process tree**: Horizon master → supervisor processes → worker processes (one per worker).
- **Code-driven deployment**: Supervisor config is in source control. Changing worker topology is a code deploy, not a server SSH session.
- **Graceful restart**: `horizon:terminate` gracefully stops all supervisors and workers. `horizon:continue` resumes paused supervisors.

# Mental Models
- **Factory floor manager**: Horizon master is the factory manager. Supervisors are department heads. Workers are assembly line workers. The manager reads the blueprint (config/horizon.php) and assigns departments and staff accordingly.
- **Declarative infrastructure**: Like Kubernetes deployment config, Horizon's config file declares the desired worker state. Horizon maintains that state.

# Internal Mechanics
- `Horizon::start()` reads `config('horizon.environments.' . app()->environment())`.
- For each supervisor, Horizon spawns a Supervisor process (a PHP process running `Horizon\Supervisor`).
- Each Supervisor manages a pool of worker processes (`Horizon\WorkerProcess`), spawning/killing them based on balancing strategy.
- Each worker process calls `php artisan queue:work horizon` internally (Horizon's queue worker command).
- Horizon communicates with workers via Redis — uses the `illuminate:horizon:supervisor` Redis key for signaling.
- Supervisors report metrics (job count, wait time, runtime) to Redis for the dashboard.
- On `horizon:terminate`, the master sends SIGTERM to all supervisors → supervisors send SIGTERM to workers → workers finish current job and exit.

# Patterns
## Environment-Specific Topology
- **Purpose**: Different worker configurations per environment.
- **Benefit**: Production gets aggressive auto-scaling; staging gets minimal workers.
- **Tradeoff**: Must maintain multiple environment configs; identical topology preferred for parity.

## Workload-Based Supervisor Separation
- **Purpose**: Separate supervisors for different job types.
- **Benefit**: Each supervisor tuned for its workload (webhooks: min/max 2/10, low timeout; reports: min/max 1/2, high timeout).
- **Tradeoff**: More supervisors to manage; over-isolation wastes processes.

## Memory-Limited Supervisor
- **Purpose**: Cap supervisor memory to prevent OOM on leaky jobs.
- **Benefit**: Automatic worker recycling when memory threshold exceeded.
- **Tradeoff**: Long-running jobs may be killed if they legitimately need memory.

# Architectural Decisions
- **One supervisor per queue type**: Webhooks, emails, default, reports each get their own supervisor with tuned config.
- **Balance strategy per supervisor**: Use `auto` for variable-load queues, `false` for fixed-load queues.
- **Set `maxJobs` and `maxTime` on all supervisors**: Prevents memory leak accumulation. 500 jobs or 1 hour is standard.
- **Use `nice` for priority**: Set priority levels (0 = highest, 19 = lowest) to influence OS process scheduling.

# Tradeoffs
Code-driven config | Version controlled, deployable, reviewable | Requires deploy to change worker count
Environment-specific | Tailored per environment | Configuration drift; staging vs prod differences
Separate supervisors | Isolated, tuned per workload | More supervisors = more memory overhead

# Performance Considerations
- Each supervisor process uses ~5-10MB baseline memory. Each worker process uses ~20-40MB.
- With 4 supervisors × 10 workers each = 40 workers. Baseline memory: ~1-2GB for workers alone.
- Horizon master process is lightweight (~10MB). It doesn't process jobs.
- Supervisor overhead (spawning, monitoring workers) is negligible.

# Production Considerations
- Monitor Horizon supervisor process count. Too many supervisors (20+) increases complexity without benefit.
- Use `horizon:terminate` in deployment scripts — signals workers to finish current job and restart with new code.
- The `wait` option in supervisor config sets the number of seconds to wait between polling the queue for jobs during periods of inactivity.
- `php` and `force` options allow using PHP binary path and forcing Horizon to operate even if the environment is not in the config.
- Horizon environment (`APP_ENV`) must match an environment key in `horizon.php`. If not, Horizon fails to start.

# Common Mistakes
- **Not including all environments in `horizon.php`**: Horizon refuses to start if the environment is not defined.
- **Too many supervisors oversubscribing CPU**: 10 supervisors × 16 minProcesses = 160 worker processes on 4 CPU cores. Oversubscription causes context switching overhead.
- **Setting `balance` to `false` without `processes`**: `balance: false` requires explicit `processes` count or defaults to 1.
- **Not running `horizon:terminate` during deployment**: Old Horizon processes continue with old code. New code is not picked up.

# Failure Modes
- **Horizon master crash**: If the Horizon master process dies (OOM, exception), all supervisors and workers die. No jobs processed until `horizon:start` restarts.
- **Supervisor death**: A supervisor process crashes. Its workers are orphaned or die with it. Jobs on that supervisor's queues stop processing.
- **Config error prevents start**: A syntax error in `horizon.php` prevents Horizon from starting. No jobs processed until config fixed and Horizon restarted.
- **Environment mismatch**: Deploying to a server with `APP_ENV=production` but `horizon.php` missing `production` key. Horizon fails silently.

# Ecosystem Usage
- **Laravel Horizon**: The `config/horizon.php` file is the central configuration artifact.
- **Laravel Forge**: Forge provides Horizon management UI with supervisor config editing and restart commands.
- **Spatie packages**: Not directly related, but Horizon is the recommended queue manager for Laravel apps using any queue-related Spatie package.

# Related Knowledge Units
- K042 Auto Balancing with `time` Strategy | K044 Horizon Tuning Parameters | K049 Multi-Server Horizon

## Research Notes
- Horizon's auto-balancing mode uses a scoring algorithm that reassigns worker processes between queues every few seconds — the scoring considers queue backlog depth and processing time to determine worker allocation.
- The alance:auto strategy in Horizon implements a "min/max" approach where each supervisor has a configured minProcesses and maxProcesses — the balancer adjusts within this range based on load.
- Horizon v5 (Laravel 11+) improved Redis cluster support by abstracting queue connections through a consistent hashing layer — jobs are distributed across cluster nodes based on job ID hash.
- The Horizon dashboard authorization gate can be customized via Horizon::auth() — exposing the dashboard without authentication in production is a common security gap.
- Horizon metrics (throughput, runtime, wait time) are stored in Redis with a retention period configured via 	rim — long retention can consume significant Redis memory in high-throughput environments.
- The horizon:snapshot command generates a work-in-progress report of all supervisors, processes, and queue metrics — useful for debugging queue backlogs during incidents.
- Silenced job tags in Horizon prevent specific job types from appearing in the "Completed Jobs" and "Failed Jobs" lists — this is a display-only filter that does not affect job processing or logging.
- Horizon's queue:monitor integration was added in Laravel 12 — it provides a Pulse integration for queue health dashboards beyond Horizon's own UI.
