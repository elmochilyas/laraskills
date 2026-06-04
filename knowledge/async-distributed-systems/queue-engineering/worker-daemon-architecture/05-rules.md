## Rule 1: Always Use queue:work Over queue:listen in Production
---
## Category
Performance | Scalability
---
## Rule
Always use `php artisan queue:work` (daemon mode) in production; never use `queue:listen`.
---
## Reason
`queue:work` boots the framework once and reuses the service container across hundreds of jobs — 5-10x faster than `queue:listen`, which spawns a new PHP process per job.
---
## Bad Example
```bash
php artisan queue:listen redis  # new process per job — 5-10x slower
```
---
## Good Example
```bash
php artisan queue:work redis  # daemon — boots once, processes many jobs
```
---
## Exceptions
Local development where debugging per-job framework boot is helpful.
---
## Consequences Of Violation
5-10x throughput reduction; unnecessary CPU waste from repeated framework bootstrapping.

## Rule 2: Always Run Workers Under a Process Supervisor
---
## Category
Reliability
---
## Rule
Always run daemon workers under Supervisor or systemd — never run `queue:work` without a process manager.
---
## Reason
The daemon exits after `--max-jobs`/`--max-time` or crashes on OOM. Without a process supervisor, no new worker replaces it and queue processing stops.
---
## Bad Example
```bash
# Running daemon without process manager — single failure stops processing
php artisan queue:work redis --max-jobs=500
```
---
## Good Example
```ini
; Supervisor manages lifecycle — autorestart on exit
[program:laravel-worker]
autorestart=true
command=php artisan queue:work redis --max-jobs=500
```
---
## Exceptions
Local development where continuous processing isn't critical.
---
## Consequences Of Violation
Queue processing halts on worker exit; silent backlog growth until manual restarts.

## Rule 3: Set Both --max-jobs and --max-time for Defense in Depth
---
## Category
Reliability | Performance
---
## Rule
Configure both `--max-jobs` AND `--max-time` on all production daemon workers.
---
## Reason
`--max-jobs` catches rapid accumulations (leaky job), `--max-time` catches slow leaks (gradual memory growth over hours). One alone misses the other case.
---
## Bad Example
```bash
--max-jobs=500  ; slow leak over 24h eventually OOMs
```
---
## Good Example
```bash
--max-jobs=500 --max-time=3600  ; both limits active
```
---
## Exceptions
Workers that must run for fixed durations for operational reasons.
---
## Consequences Of Violation
Either rapid or slow memory leaks cause OOM depending on which limit is omitted.

## Rule 4: Always Run queue:restart After Every Deploy
---
## Category
Reliability | Maintainability
---
## Rule
Add `php artisan queue:restart` as the final step in every deployment script.
---
## Reason
The daemon booted once at container start — it keeps old code in memory until restarted. Without restart, workers process jobs with stale code.
---
## Bad Example
```bash
git pull origin main
php artisan migrate --force
# No queue:restart — workers still run old code
```
---
## Good Example
```bash
git pull origin main
php artisan migrate --force
php artisan queue:restart
```
---
## Exceptions
Horizon deployments — use `horizon:terminate`.
---
## Consequences Of Violation
Workers process jobs with outdated code against potentially new schemas; undetected business logic defects.
