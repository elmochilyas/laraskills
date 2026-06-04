## Rule 1: Always Set stopwaitsecs Above Longest Job Runtime
---
## Category
Reliability | Scalability
---
## Rule
Always set `stopwaitsecs` to at least the maximum expected job runtime plus a 10-second buffer in every Supervisor worker configuration.
---
## Reason
If `stopwaitsecs` expires before the worker finishes its current job, Supervisor sends SIGKILL — the job is lost mid-processing and may be double-processed after `retry_after` expires.
---
## Bad Example
```ini
[program:laravel-worker]
stopwaitsecs=10  ; default — dangerously low
command=php artisan queue:work redis --sleep=3 --tries=3 --timeout=60
```
---
## Good Example
```ini
[program:laravel-worker]
stopwaitsecs=70  ; exceeds --timeout (60s) by buffer
command=php artisan queue:work redis --sleep=3 --tries=3 --timeout=60
```
---
## Exceptions
Local development environments where jobs are trivial and job loss is acceptable.
---
## Consequences Of Violation
Jobs terminated mid-processing; double-processing on retry; data corruption from partial execution.

## Rule 2: Always Configure stopasgroup and killasgroup
---
## Category
Reliability | Security
---
## Rule
Always set `stopasgroup=true` and `killasgroup=true` in every Supervisor worker configuration.
---
## Reason
Without `stopasgroup`, SIGTERM kills only the parent worker process — subprocesses survive as zombie processes, consuming memory and file descriptors.
---
## Bad Example
```ini
[program:laravel-worker]
; stopasgroup and killasgroup not set — defaults to false
command=php artisan queue:work redis
```
---
## Good Example
```ini
[program:laravel-worker]
stopasgroup=true
killasgroup=true
command=php artisan queue:work redis
```
---
## Exceptions
No common exceptions. Always set both flags for production workers.
---
## Consequences Of Violation
Accumulating orphaned subprocesses; memory leaks; file descriptor exhaustion over time.

## Rule 3: Never Use Default stopwaitsecs in Production
---
## Category
Reliability | Performance
---
## Rule
Never deploy queue workers to production with the default `stopwaitsecs=10` in Supervisor configuration.
---
## Reason
The default 10-second timeout is lower than most production job runtimes — every graceful shutdown becomes a forced SIGKILL, defeating the purpose of graceful termination.
---
## Bad Example
```ini
[program:laravel-worker]
; stopwaitsecs defaults to 10 — guarantees SIGKILL for any job > 10s
autorestart=true
```
---
## Good Example
```ini
[program:laravel-worker]
stopwaitsecs=90  ; tuned for actual job durations
autorestart=true
```
---
## Exceptions
Environments where all jobs complete in under 5 seconds and the 10s default provides adequate buffer.
---
## Consequences Of Violation
Every deploy or supervisor restart force-kills workers mid-job; systemic double-processing on busy queues.
