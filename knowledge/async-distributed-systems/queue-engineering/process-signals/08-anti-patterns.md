# Anti-Patterns — Process Signals (SIGTERM, SIGQUIT, SIGUSR2, SIGCONT)

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Worker Management |
| Knowledge Unit | Process Signals |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. SIGKILL as Default Shutdown
2. Missing `pcntl` Extension
3. Per-Server Signals on Multi-Server
4. `stopwaitsecs` Shorter Than Job Runtime

---

## 1. SIGKILL as Default Shutdown

### Category
Reliability

### Description
Using `kill -9` (SIGKILL) as the default method to stop queue workers, killing the process immediately and losing the current job.

### Why It Happens
SIGKILL is the most forceful and familiar signal. When developers need to stop a worker quickly, they reach for `kill -9` out of habit. They may not know about SIGTERM (graceful shutdown) or the worker's ability to finish current jobs before exiting.

### Warning Signs
- Deployment scripts or runbooks use `kill -9` for worker shutdown
- Workers regularly lose current jobs during restarts
- `retry_after` expires for jobs killed by SIGKILL
- Double-processing incidents traced to SIGKILL events

### Why Harmful
SIGKILL is uncatchable — the worker dies immediately. The current job is terminated mid-execution. The queue backend eventually releases the job (after `retry_after`), and another worker picks it up. The job may be partially processed (database writes committed, API calls made) before being killed. When the new worker processes it, side effects may duplicate.

### Consequences
- Jobs lost mid-processing on every kill
- Potential double-processing from partial execution + retry
- Data corruption from interrupted operations
- Unnecessary `retry_after` delays for killed jobs

### Alternative
Always use SIGTERM (`kill -15`) for routine worker shutdown — the worker finishes its current job and exits gracefully.

### Refactoring Strategy
1. Replace all `kill -9` with `kill -15` in scripts and runbooks
2. Use `php artisan queue:restart` for deployments instead of signals
3. Only use SIGKILL as a last resort for unresponsive workers
4. Document the signal hierarchy: SIGTERM first, SIGKILL as emergency

### Detection Checklist
- [ ] SIGTERM used for routine shutdown
- [ ] SIGKILL limited to unresponsive workers only
- [ ] No jobs lost during routine restarts
- [ ] Runbooks document correct signal usage

### Related Rules
Never Use SIGKILL (kill -9) on Workers

### Related Skills
Manage Queue Workers with Process Signals

### Related Decision Trees
SIGTERM vs SIGQUIT for Worker Shutdown

---

## 2. Missing `pcntl` Extension

### Category
Reliability

### Description
Running queue workers without the `pcntl` PHP extension installed, causing signal handlers to be no-ops and graceful shutdown to fail silently.

### Why It Happens
The `pcntl` extension is not installed by default in many PHP installations. The developer deploys workers without verifying the extension. Signal handling functions (`pcntl_signal()`) exist as PHP functions but do nothing without the extension. SIGTERM is sent, the worker's handler runs (but does nothing), and the worker continues processing.

### Warning Signs
- `php -m | grep pcntl` returns nothing on worker servers
- SIGTERM does not cause workers to exit
- Supervisor `stopwaitsecs` always expires and sends SIGKILL
- Workers never finish current jobs on shutdown

### Why Harmful
Without `pcntl`, the worker registers signal handlers via `pcntl_signal()`, but these are no-ops. When Supervisor sends SIGTERM, the worker ignores it. Supervisor waits `stopwaitsecs` (default 10 seconds) and sends SIGKILL. Every graceful shutdown becomes a forced kill. Every restart loses the current job. No worker ever finishes its current job before exiting.

### Consequences
- SIGTERM silently ignored by workers
- Every shutdown forces SIGKILL
- Jobs lost on every restart or deploy
- Persistent double-processing risk

### Alternative
Install the `pcntl` PHP extension on all worker servers.

### Refactoring Strategy
1. Install `pcntl`: `apt-get install php-pcntl` or `docker-php-ext-install pcntl`
2. Verify installation: `php -m | grep pcntl`
3. Test: send SIGTERM to worker, verify graceful exit after current job
4. Add pcntl to deployment server provisioning script

### Detection Checklist
- [ ] `pcntl` extension installed on all worker servers
- [ ] SIGTERM handled gracefully (worker finishes current job)
- [ ] Supervisor `stopwaitsecs` does not expire unnecessarily
- [ ] No jobs lost on routine restarts

### Related Rules
Ensure pcntl Extension Is Installed on Worker Servers

### Related Skills
Manage Queue Workers with Process Signals

### Related Decision Trees
SIGTERM vs SIGQUIT for Worker Shutdown

---

## 3. Per-Server Signals on Multi-Server

### Category
Scalability

### Description
Sending signals (SIGTERM) to individual worker processes on each server instead of using `queue:restart`, making multi-server restarts error-prone and incomplete.

### Why It Happens
The developer writes a deployment script that SSHes into each server and sends a signal to worker processes. This approach requires knowing the PID of every worker on every server, handling SSH failures, and repeating the process for each server. One missed server means workers there continue running indefinitely.

### Warning Signs
- Deployment script SSHes into servers to send kill signals
- Manual `kill` commands used in runbooks
- Some servers' workers miss the restart signal
- Mixed old/new code after deployments

### Why Harmful
A team deploys to 5 servers. The script SSHes into each and runs `kill -15 $(pgrep -f queue:work)`. Server C's SSH connection times out — its workers are never signaled. Three-quarters of workers restart, but Server C's continue with old code. The deployment is incomplete for queue processing, and the team doesn't notice until mixed old/new behavior causes data corruption.

### Consequences
- Missed servers continue with old code
- Error-prone per-server SSH management
- Deployment completeness depends on SSH reliability
- No centralized coordination of restart timing

### Alternative
Use `php artisan queue:restart` — a single command that broadcasts the restart signal to all workers across all servers via shared cache.

### Refactoring Strategy
1. Replace per-server SSH kill commands with `php artisan queue:restart`
2. Ensure shared cache (Redis/Memcached) is configured
3. Verify: call `queue:restart`, check all servers' workers restart
4. For Horizon: use `php artisan horizon:terminate`

### Detection Checklist
- [ ] `queue:restart` used instead of per-server signals
- [ ] All servers' workers restart consistently
- [ ] Shared cache configured for cross-server broadcast
- [ ] No missed servers after restart

### Related Rules
Use queue:restart for Multi-Server Restart

### Related Skills
Manage Queue Workers with Process Signals

### Related Decision Trees
queue:restart vs Per-Server Signal

---

## 4. `stopwaitsecs` Shorter Than Job Runtime

### Category
Reliability

### Description
Leaving Supervisor's `stopwaitsecs` at the default of 10 seconds while jobs run longer than 10 seconds, causing Supervisor to SIGKILL workers before they finish their current job.

### Why It Happens
The default `stopwaitsecs=10` in Supervisor configuration is rarely changed. The developer configures the worker command (`queue:work`) but doesn't adjust `stopwaitsecs`. When Supervisor sends SIGTERM and waits 10 seconds, most production jobs haven't finished yet. Supervisor sends SIGKILL, killing the worker mid-job.

### Warning Signs
- `stopwaitsecs` at default (10 seconds)
- Worker `--timeout` or job `$timeout` > 10 seconds
- Jobs lost during every Supervisor stop/restart
- `supervisorctl` logs show SIGKILL after stopwaitsecs expiry

### Why Harmful
Supervisor sends SIGTERM → worker continues current job (will take 60 seconds) → wait 10 seconds → SIGKILL. The worker is killed mid-execution. The job is lost. After `retry_after` expires, another worker picks it up — but the first worker may have partially committed side effects. The default `stopwaitsecs` guarantees job loss on every deployment or Supervisor restart.

### Consequences
- Workers SIGKILLed mid-job on every restart
- Jobs lost during deployments and Supervisor operations
- Double-processing from partial execution + retry
- Default `stopwaitsecs` incompatible with production jobs

### Alternative
Set `stopwaitsecs` to at least `--timeout` + 10 seconds in Supervisor configuration.

### Refactoring Strategy
1. Calculate: `stopwaitsecs = max(worker --timeout, job $timeout) + 10`
2. Set `stopwaitsecs` in Supervisor configuration
3. Ensure `stopwaitsecs` > `--timeout`
4. Test: stop Supervisor group, verify no SIGKILL

### Detection Checklist
- [ ] `stopwaitsecs` > max expected job runtime
- [ ] No SIGKILL during routine Supervisor stops
- [ ] Workers finish current jobs on shutdown
- [ ] No jobs lost during deployments

### Related Rules
Set Supervisor stopwaitsecs to Exceed Longest Job Runtime

### Related Skills
Manage Queue Workers with Process Signals

### Related Decision Trees
SIGTERM vs SIGQUIT for Worker Shutdown
