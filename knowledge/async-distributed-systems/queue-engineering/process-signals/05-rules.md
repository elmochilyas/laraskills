## Rule 1: Never Use SIGKILL (kill -9) on Workers
---
## Category
Reliability | Scalability
---
## Rule
Always use SIGTERM first to stop queue workers; never use SIGKILL unless the process is unresponsive.
---
## Reason
SIGTERM allows graceful shutdown — the worker finishes its current job then exits. SIGKILL is uncatchable — the worker dies immediately, the current job is lost, and it may be double-processed after `retry_after` expires.
---
## Bad Example
```bash
kill -9 1234  # SIGKILL — worker dies instantly, current job lost
```
---
## Good Example
```bash
kill -15 1234  # SIGTERM — worker finishes current job, then exits
```
---
## Exceptions
Worker unresponsive to SIGTERM after a reasonable timeout (use SIGKILL as last resort).
---
## Consequences Of Violation
Job lost mid-processing; double-processing risk; data corruption from partial execution.

## Rule 2: Ensure pcntl Extension Is Installed on Worker Servers
---
## Category
Reliability | Security
---
## Rule
Ensure the `pcntl` PHP extension is installed and enabled on all queue worker servers.
---
## Reason
Signal handlers are registered via `pcntl_signal()` — without the extension, SIGTERM is ignored and the worker never checks `shouldQuit`, forcing Supervisor to eventually SIGKILL.
---
## Bad Example
```bash
php -m | grep pcntl
# pcntl not listed — signals silently ignored
```
---
## Good Example
```bash
# Ensure installed: apt-get install php-pcntl
php -m | grep pcntl
# pcntl
```
---
## Exceptions
Windows worker environments where pcntl is unavailable — use alternative graceful shutdown mechanisms.
---
## Consequences Of Violation
Workers unresponsive to graceful shutdown signals; forced SIGKILL on every restart; jobs lost.

## Rule 3: Use queue:restart for Multi-Server Restart
---
## Category
Scalability | Maintainability
---
## Rule
Prefer `php artisan queue:restart` over process-level signals when restarting workers across multiple servers.
---
## Reason
`queue:restart` sets a cache key that all workers poll — every worker across every server picks up the restart signal without requiring SSH access to each server.
---
## Bad Example
```bash
# Manual per-server signals — error-prone and slow
ssh server1 "kill -15 $(pidof php)"
ssh server2 "kill -15 $(pidof php)"
```
---
## Good Example
```bash
php artisan queue:restart  # single command — all servers pick it up
```
---
## Exceptions
Horizon deployments — use `horizon:terminate`.
---
## Consequences Of Violation
Missed servers continue running old code; deployment inconsistencies; partial code rollout.
