## Rule 1: Always Set autorestart=true in Supervisor Config
---
## Category
Reliability
---
## Rule
Always configure `autorestart=true` on every Supervisor program definition for queue workers.
---
## Reason
Workers exit after `--max-jobs`/`--max-time` by design. Without `autorestart`, the worker never comes back and queue processing halts permanently.
---
## Bad Example
```ini
[program:laravel-worker]
; autorestart not set — defaults may be false
command=php artisan queue:work redis
```
---
## Good Example
```ini
[program:laravel-worker]
autorestart=true
command=php artisan queue:work redis
```
---
## Exceptions
No common exceptions. Always required for production queue workers.
---
## Consequences Of Violation
Workers exit on max-jobs and never restart; queue goes silent; manual intervention needed.

## Rule 2: Always Set stopasgroup and killasgroup
---
## Category
Reliability | Security
---
## Rule
Always set `stopasgroup=true` and `killasgroup=true` in every Supervisor program definition.
---
## Reason
Without process group management, SIGTERM kills only the parent — child processes survive as zombies.
---
## Bad Example
```ini
[program:laravel-worker]
; stopasgroup defaults to false — orphaned subprocesses
```
---
## Good Example
```ini
[program:laravel-worker]
stopasgroup=true
killasgroup=true
```
---
## Exceptions
No common exceptions for production workers.
---
## Consequences Of Violation
Zombie subprocess accumulation; memory and file descriptor leaks.

## Rule 3: Set stopwaitsecs Above Maximum Job Runtime
---
## Category
Reliability
---
## Rule
Always set `stopwaitsecs` to at least the maximum expected job runtime plus a buffer (minimum 10 seconds).
---
## Reason
Supervisor sends SIGKILL if `stopwaitsecs` expires before the worker finishes its current job — the job is lost and may be double-processed.
---
## Bad Example
```ini
; stopwaitsecs defaults to 10 — inadequate for production
command=php artisan queue:work redis --timeout=60
```
---
## Good Example
```ini
stopwaitsecs=70  ; exceeds --timeout=60
command=php artisan queue:work redis --timeout=60
```
---
## Exceptions
Local development where job loss is acceptable.
---
## Consequences Of Violation
Force-killed workers mid-job; double processing; potential data corruption.

## Rule 4: Tune numprocs Based on Workload Type
---
## Category
Scalability | Performance
---
## Rule
Set `numprocs` to CPU core count for CPU-bound workloads and up to 2-3x core count for I/O-bound workloads.
---
## Reason
CPU-bound jobs benefit from at most one per core — more causes context switching overhead. I/O-bound jobs spend time waiting — more workers utilize idle CPU.
---
## Bad Example
```ini
numprocs=20  ; 2-core server — far exceeds capacity
```
---
## Good Example
```ini
numprocs=4   ; 4-core server, mixed workload
```
---
## Exceptions
Horizon-managed workers — use Horizon supervisor config instead.
---
## Consequences Of Violation
Excess context switching overhead reduces throughput; server memory exhaustion from too many worker processes.
