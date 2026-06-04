# Skill: Configure Supervisor for Production Queue Workers

## Purpose
Set up Supervisor program definitions to manage queue worker processes with correct autorestart, process group handling, and workers-per-core tuning.

## When To Use
When deploying production queue workers with `queue:work` (not Horizon) to any server.

## When NOT To Use
When using Horizon (Horizon is its own process supervisor); single-server dev environments where `queue:work` runs directly.

## Prerequisites
- Supervisor installed on server
- Knowledge of CPU core count and workload type (CPU-bound vs I/O-bound)
- Queue worker command arguments determined

## Inputs
- Server CPU core count
- Workload type (CPU-bound or I/O-bound)
- Max job runtime for `stopwaitsecs` calculation
- Worker command and arguments

## Workflow
1. Create config: `sudo nano /etc/supervisor/conf.d/laravel-worker.conf`
2. Set `[program:laravel-worker]` with `process_name=%(program_name)s_%(process_num)02d`
3. Set `command=php artisan queue:work redis --sleep=3 --tries=3 --max-jobs=500 --max-time=3600 --memory=256`
4. Configure `autostart=true`, `autorestart=true`
5. Set `stopasgroup=true`, `killasgroup=true`
6. Set `stopwaitsecs` to max job runtime + 10s buffer
7. Set `numprocs` = core count (CPU-bound) or 2-3x core count (I/O-bound)
8. Set `user=forge`
9. Reread: `sudo supervisorctl reread`
10. Update: `sudo supervisorctl update`
11. Start: `sudo supervisorctl start laravel-worker:*`

## Validation Checklist
- [ ] `autorestart=true` is set
- [ ] `stopasgroup=true` and `killasgroup=true` configured
- [ ] `stopwaitsecs` > worker `--timeout`
- [ ] `numprocs` tuned for workload type
- [ ] `user` is non-root
- [ ] All worker processes running: `supervisorctl status`
- [ ] Workers recycle on max-jobs/max-time and restart

## Common Failures
- `autorestart` not set — worker exits on max-jobs, queue stops
- Default `stopwaitsecs=10` — worker SIGKILLed mid-job
- `numprocs` too high for CPU cores — context switching reduces throughput
- No `stopasgroup` — zombie subprocesses accumulate

## Decision Points
- CPU-bound: set `numprocs` = core count
- I/O-bound: set `numprocs` = 2-3x core count
- Mixed: start at core count, monitor, increase gradually

## Performance Considerations
- Each worker ~20-40MB RAM — 20 workers = 400-800MB baseline
- Process spawning ~100ms per worker
- Excessive `numprocs` on low-CPU: context switching overhead

## Security Considerations
- Always set `user=forge` (non-root) — never run workers as root
- `stopasgroup` prevents orphaned subprocesses

## Related Rules
- Rule 1: Always Set autorestart=true in Supervisor Config
- Rule 2: Always Set stopasgroup and killasgroup
- Rule 3: Set stopwaitsecs Above Maximum Job Runtime
- Rule 4: Tune numprocs Based on Workload Type

## Related Skills
- Configure Supervisor stopwaitsecs for Graceful Shutdown
- Configure --max-jobs and --max-time for Worker Recycling

## Success Criteria
Workers run continuously under Supervisor, restart after crashes and recycling, stop gracefully on deploy, and provide consistent throughput at configured concurrency level.
