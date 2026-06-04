## Rule 1: Always Set Restart=always on Worker Service Units
---
## Category
Reliability
---
## Rule
Always configure `Restart=always` in every systemd service unit managing queue workers.
---
## Reason
Workers exit after processing `--max-jobs` or `--max-time` — without `Restart=always`, the worker never restarts and queue processing stops permanently.
---
## Bad Example
```ini
[Service]
ExecStart=/usr/bin/php artisan queue:work redis
; no Restart directive — defaults to Restart=no
```
---
## Good Example
```ini
[Service]
Restart=always
ExecStart=/usr/bin/php artisan queue:work redis
```
---
## Exceptions
No common exceptions. Always set for queue worker services.
---
## Consequences Of Violation
Worker exits on max-jobs; queue processing halts; manual intervention required.

## Rule 2: Set KillMode=mixed for Clean Subprocess Handling
---
## Category
Reliability | Security
---
## Rule
Always set `KillMode=mixed` in systemd worker service units to prevent orphaned subprocesses.
---
## Reason
`KillMode=process` (default) sends SIGTERM only to the main process — child processes survive as zombies. `mixed` signals the entire cgroup.
---
## Bad Example
```ini
[Service]
; KillMode defaults to process — children become orphans
ExecStart=/usr/bin/php artisan queue:work redis
```
---
## Good Example
```ini
[Service]
KillMode=mixed
ExecStart=/usr/bin/php artisan queue:work redis
```
---
## Exceptions
No common exceptions. Always set for queue worker services.
---
## Consequences Of Violation
Accumulating zombie subprocesses; memory leaks; file descriptor exhaustion.

## Rule 3: Use Template Units for Multi-Worker Setups
---
## Category
Scalability | Maintainability
---
## Rule
Use systemd template units (`queue-worker@.service`) with instance names (`queue-worker@1`, `queue-worker@2`) when running multiple worker processes.
---
## Reason
Systemd lacks Supervisor's `numprocs` feature — template units provide multi-worker capability with independent per-instance lifecycle management.
---
## Bad Example
```ini
; Single worker — no parallelism
[Service]
ExecStart=/usr/bin/php artisan queue:work redis
```
---
## Good Example
```ini
; /etc/systemd/system/queue-worker@.service
[Service]
ExecStart=/usr/bin/php artisan queue:work redis

; Enable instances:
; systemctl enable queue-worker@1 queue-worker@2 queue-worker@3
```
---
## Exceptions
When Horizon manages workers instead of systemd.
---
## Consequences Of Violation
Single worker provides no concurrency; jobs process sequentially; throughput limited.

## Rule 4: Set RestartSec=3s to Prevent Crash Loops
---
## Category
Reliability | Performance
---
## Rule
Always configure `RestartSec=3s` (or higher) on queue worker service units to prevent tight restart loops.
---
## Reason
If a worker crashes on startup due to a PHP error, `RestartSec=0` creates a tight crash-restart loop that burns CPU and fills logs.
---
## Bad Example
```ini
[Service]
Restart=always
; RestartSec defaults to 0 — tight restart loop on crash
```
---
## Good Example
```ini
[Service]
Restart=always
RestartSec=3s
```
---
## Exceptions
No common exceptions. Always set a positive RestartSec.
---
## Consequences Of Violation
CPU saturation from rapid crash-restart cycles; rapid log growth; delayed detection of persistent worker failure.
