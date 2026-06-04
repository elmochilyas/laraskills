## Rule 1: Always Set Both --max-jobs and --max-time on Workers
---
## Category
Reliability | Performance
---
## Rule
Always configure both `--max-jobs` and `--max-time` on every queue worker for defense-in-depth memory management.
---
## Reason
`--max-jobs` catches rapid memory accumulation from leaky jobs; `--max-time` catches slow leaks that accumulate gradually over time. Either alone leaves a gap.
---
## Bad Example
```bash
php artisan queue:work redis
; neither limit set — memory grows unbounded
```
---
## Good Example
```bash
php artisan queue:work redis --max-jobs=500 --max-time=3600
```
---
## Exceptions
Workers processing fewer than 50 jobs total (local dev, CI).
---
## Consequences Of Violation
Worker RSS grows until OOM; process killed forcibly; potential job corruption.

## Rule 2: Tune Limits Based on Observed Memory Growth
---
## Category
Performance | Maintainability
---
## Rule
Monitor worker RSS over lifetime and adjust `--max-jobs`/`--max-time` to maximize throughput while keeping memory within safe bounds.
---
## Reason
Worker recycling overhead (~50-200ms per restart) is negligible, but overly aggressive limits (e.g., 10 jobs) cause excessive restarts that hurt throughput.
---
## Bad Example
```bash
--max-jobs=10  ; worker restarts every ~2 minutes — excessive overhead
```
---
## Good Example
```bash
--max-jobs=500 --max-time=3600  ; standard values — ~0.02% overhead per job
```
---
## Exceptions
Jobs with known memory leaks — reduce limits until leak is fixed.
---
## Consequences Of Violation
Too-low limits: excessive restarts reduce throughput. Too-high limits: memory growth risks OOM between recycling events.

## Rule 3: Ensure autorestart=true in Supervisor
---
## Category
Reliability
---
## Rule
Always pair worker recycling with Supervisor `autorestart=true` so the process manager restarts the worker after it exits.
---
## Reason
Worker recycling relies on the process supervisor to detect the exit and spawn a fresh worker. Without `autorestart`, the queue stops processing.
---
## Bad Example
```ini
[program:laravel-worker]
; autorestart not set — worker exits on max-jobs and never returns
command=php artisan queue:work redis --max-jobs=500 --max-time=3600
```
---
## Good Example
```ini
[program:laravel-worker]
autorestart=true
command=php artisan queue:work redis --max-jobs=500 --max-time=3600
```
---
## Exceptions
Workers managed by systemd — equivalent `Restart=always` needed.
---
## Consequences Of Violation
Worker recycles once; queue stops processing; silent backlog growth.
