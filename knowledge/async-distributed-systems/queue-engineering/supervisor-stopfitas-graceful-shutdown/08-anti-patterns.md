# Anti-Patterns — Supervisor `stopwaitsecs` and Graceful Shutdown

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Worker Management |
| Knowledge Unit | Supervisor `stopwaitsecs` and Graceful Shutdown |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Default `stopwaitsecs=10` — Guaranteed SIGKILL
2. `stopwaitsecs` Lower Than `--timeout`
3. Missing `stopasgroup`/`killasgroup` — Zombie Accumulation
4. No Buffer Over `retry_after`

---

## 1. Default `stopwaitsecs=10`

### Category
Reliability

### Description
Using Supervisor's default `stopwaitsecs=10` in production, guaranteeing that workers processing jobs longer than 10 seconds are force-killed on every shutdown.

### Why It Happens
The default value of 10 seconds matches quick demo setups but is far too low for production. The developer installs Supervisor, adds a basic configuration without specifying `stopwaitsecs`, and deploys. Every Supervisor stop operation (deploy, config reload, manual restart) results in SIGKILL. The developer may not realize because the worker restarts via `autorestart=true`.

### Warning Signs
- `stopwaitsecs` not explicitly configured (defaults to 10)
- Workers consistently lose jobs during deployments
- `supervisorctl` shows SIGKILL in process logs
- Double-processing incidents correlate with deployments

### Why Harmful
Every deployment runs `supervisorctl reload` or restarts worker groups. Supervisor sends SIGTERM to all workers, waits 10 seconds, and SIGKILLs any still running. Workers processing 60-second jobs are always killed at 10 seconds — 50 seconds of work is lost. The job is re-queued after `retry_after`. Over 100 jobs per deployment, that's 100 re-queued jobs, 100 lost processing cycles, and potential double-processing for each.

### Consequences
- Systemic job loss from default timeout
- Every deployment causes re-queued jobs
- Workers forced-killed mid-execution on all operations
- Double-processing risk on every restart

### Alternative
Set `stopwaitsecs` to at least maximum job runtime + 10 seconds.

### Refactoring Strategy
1. Audit all Supervisor configs for missing `stopwaitsecs`
2. Calculate: `stopwaitsecs = max(worker --timeout, max job $timeout) + 10`
3. Add explicit `stopwaitsecs` to every worker configuration
4. Verify: `stopwaitsecs` > worker `--timeout`
5. Test: stop worker, confirm no SIGKILL

### Detection Checklist
- [ ] `stopwaitsecs` explicitly set in all Supervisor configs
- [ ] `stopwaitsecs` > worker `--timeout`
- [ ] No SIGKILL during routine operations
- [ ] Workers finish current jobs on graceful shutdown

### Related Rules
Always Set stopwaitsecs Above Longest Job Runtime

### Related Skills
Configure Supervisor stopwaitsecs for Graceful Shutdown

### Related Decision Trees
stopwaitsecs Value Selection

---

## 2. `stopwaitsecs` Lower Than `--timeout`

### Category
Reliability

### Description
Setting `stopwaitsecs` to a value less than the worker's `--timeout`, guaranteeing that the worker cannot finish jobs before SIGKILL arrives.

### Why It Happens
The developer sets `stopwaitsecs=30` but the worker `--timeout=60`. If `stopwaitsecs` is the maximum time Supervisor waits before SIGKILL, and `--timeout` is the maximum time a job can run, then a job that runs for 60 seconds will always be killed at 30 seconds. The relationship should be the opposite.

### Warning Signs
- `stopwaitsecs < --timeout` in configuration
- Jobs never complete during shutdown
- Workers always force-killed on stop
- Job loss on every Supervisor operation

### Why Harmful
Worker `--timeout=60` means jobs can run up to 60 seconds before being killed by the worker itself. But `stopwaitsecs=30` means Supervisor kills the worker after 30 seconds of waiting for graceful shutdown. Any job that takes more than 30 seconds is guaranteed to be killed mid-execution. The worker never gets a chance to safely reach its own timeout.

### Consequences
- Guaranteed SIGKILL for jobs exceeding stopwaitsecs
- Worker's own timeout never reached during shutdown
- Systemic job loss from configuration mismatch
- Every shutdown interrupts jobs

### Alternative
Always ensure `stopwaitsecs > --timeout` by a comfortable buffer.

### Refactoring Strategy
1. Compare `stopwaitsecs` and `--timeout` in all configurations
2. Set `stopwaitsecs = --timeout + 10` (minimum)
3. Verify the inequality: `stopwaitsecs > --timeout`
4. Test: stop a worker processing a long job, confirm no SIGKILL

### Detection Checklist
- [ ] `stopwaitsecs > --timeout`
- [ ] `stopwaitsecs - --timeout >= 10` seconds buffer
- [ ] No SIGKILL during graceful shutdown
- [ ] Workers can finish jobs up to `--timeout` duration

### Related Rules
Always Set stopwaitsecs Above Longest Job Runtime

### Related Skills
Configure Supervisor stopwaitsecs for Graceful Shutdown

### Related Decision Trees
stopwaitsecs Value Selection

---

## 3. Missing `stopasgroup`/`killasgroup`

### Category
Reliability

### Description
Not configuring `stopasgroup=true` and `killasgroup=true`, causing only the parent PHP process to receive signals while child subprocesses survive.

### Why It Happens
Both default to `false`. The developer uses a generic Supervisor template that doesn't include these directives. When Supervisor stops a worker, only the main PHP process receives SIGTERM (and later SIGKILL). Any subprocesses spawned during job execution (e.g., `proc_open` for PDF generation) are orphaned.

### Warning Signs
- `stopasgroup` and `killasgroup` not in Supervisor configuration
- Child PHP or system processes surviving after worker stops
- Accumulating zombie processes over time
- Memory or file descriptor leaks on worker servers

### Why Harmful
A job runs a `pdftotext` binary via `proc_open`. When Supervisor stops the worker, the main PHP process exits, but the `pdftotext` child continues running. Over days, dozens of orphaned `pdftotext` processes accumulate. Each consumes memory and holds input/output file handles. Eventually, the system runs out of available file descriptors or memory, causing all workers to fail.

### Consequences
- Accumulating orphaned subprocesses
- Memory and file descriptor leaks
- Gradual system resource exhaustion
- Workers fail due to resource limits

### Alternative
Always set `stopasgroup=true` and `killasgroup=true` to signal the entire process group.

### Refactoring Strategy
1. Add `stopasgroup=true` and `killasgroup=true` to all Supervisor configs
2. Reload Supervisor configuration
3. Clean up existing orphaned processes
4. Verify: no orphans after worker stop

### Detection Checklist
- [ ] `stopasgroup=true` and `killasgroup=true` configured
- [ ] No orphaned subprocesses after worker stop
- [ ] Resource usage stable over time
- [ ] Process group cleanly terminated

### Related Rules
Always Configure stopasgroup and killasgroup

### Related Skills
Configure Supervisor stopwaitsecs for Graceful Shutdown

### Related Decision Trees
stopwaitsecs Value Selection

---

## 4. No Buffer Over `retry_after`

### Category
Reliability

### Description
Setting `stopwaitsecs` without accounting for `retry_after`, potentially allowing the queue backend to release a job before Supervisor sends SIGKILL.

### Why It Happens
The developer sets `stopwaitsecs` in isolation without considering the relationship to the queue connection's `retry_after`. If `stopwaitsecs > retry_after`, a job killed by Supervisor's SIGKILL may have its reservation expire before the worker is killed, causing double processing.

### Warning Signs
- `stopwaitsecs > retry_after`
- Double processing during deploys or restarts
- Reservation expiry during worker shutdown
- No documented relationship between the two values

### Why Harmful
Supervisor sends SIGTERM → worker continues processing a 60-second job → at 30 seconds, Supervisor's `stopwaitsecs` timer is still active → `retry_after=45` expires → queue backend releases the job → another worker picks it up → at 30 seconds, `stopwaitsecs` expires and SIGKILL kills the original worker. Both workers processed the same job.

### Consequences
- Double processing during extended shutdown
- `retry_after` expiry before SIGKILL
- Race condition between Supervisor and queue backend
- Duplicate side effects during deployments

### Alternative
Set `stopwaitsecs = retry_after + 10` to ensure the worker is killed before the reservation expires.

### Refactoring Strategy
1. Set `stopwaitsecs = retry_after + 10` in all Supervisor configs
2. Ensure `stopwaitsecs > --timeout` (redundant if using formula above)
3. Document the timeout relationships in operations docs
4. Test: verify no reservation expiry during worker shutdown

### Detection Checklist
- [ ] `stopwaitsecs = retry_after + 10` (or greater)
- [ ] No reservation expiry during shutdown
- [ ] No double processing from shutdown-reservation race
- [ ] Timeout relationships documented

### Related Rules
Never Use Default stopwaitsecs in Production

### Related Skills
Configure Supervisor stopwaitsecs for Graceful Shutdown

### Related Decision Trees
stopwaitsecs Value Selection
