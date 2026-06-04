# Anti-Patterns — Supervisor Configuration for Queue Workers

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Worker Management |
| Knowledge Unit | Supervisor Configuration for Queue Workers |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Missing `autorestart=true` — Worker Exits Permanently
2. Default `stopwaitsecs=10` — Mid-Job SIGKILL
3. No `stopasgroup`/`killasgroup` — Zombie Subprocesses
4. Over-Provisioned `numprocs` — Context Switching Overload

---

## 1. Missing `autorestart=true`

### Category
Reliability

### Description
Not configuring `autorestart=true` in Supervisor, causing workers that exit after `--max-jobs`/`--max-time` to never restart and halt queue processing.

### Why It Happens
The default Supervisor behavior for `autorestart` may be `false` or `unexpected` (restart only on unexpected exit). The developer writes a minimal configuration without specifying `autorestart`. When the worker exits gracefully after hitting `--max-jobs`, Supervisor considers this an expected exit and does not restart it. The queue goes silent.

### Warning Signs
- Supervisor config missing `autorestart=true`
- Workers stop processing after first recycling event
- Queue grows silently after deploy or max-jobs
- Manual `supervisorctl restart` required regularly

### Why Harmful
A team deploys 8 workers with recycling limits. After 500 jobs each, all 8 workers exit within a few minutes of each other. Supervisor, configured without `autorestart=true`, considers these expected exits and doesn't restart. The queue stops completely. The operations team doesn't notice for 30 minutes. During that time, 180,000 jobs pile up — emails, notifications, and webhook deliveries are delayed by half an hour.

### Consequences
- Queue processing halts permanently on first recycling
- Silent backlog growth without alerting
- Manual intervention required to resume processing
- Recycling mechanism makes things worse

### Alternative
Always set `autorestart=true` in every Supervisor program definition for queue workers.

### Refactoring Strategy
1. Add `autorestart=true` to all Supervisor worker configurations
2. Verify with `supervisorctl status` that workers restart after exit
3. Test: wait for worker to hit `--max-jobs`, confirm restart
4. For systemd: equivalent `Restart=always`

### Detection Checklist
- [ ] `autorestart=true` set on all worker programs
- [ ] Workers restart after recycling and crash exits
- [ ] No processing gaps from exit non-restart
- [ ] Manual restart not needed for worker lifecycle

### Related Rules
Always Set autorestart=true in Supervisor Config

### Related Skills
Configure Supervisor for Production Queue Workers

### Related Decision Trees
Supervisor vs Horizon for Process Management

---

## 2. Default `stopwaitsecs=10`

### Category
Reliability

### Description
Leaving Supervisor's `stopwaitsecs` at the default 10 seconds while jobs routinely take longer to process, forcing SIGKILL on every graceful shutdown.

### Why It Happens
The default Supervisor configuration has `stopwaitsecs=10`. Most deploy tools (Forge, Ploi) also leave the default. The developer doesn't know this parameter exists. When Supervisor stops a worker group (deploy, restart), it sends SIGTERM and waits 10 seconds. Most production jobs take longer than 10 seconds. SIGKILL follows.

### Warning Signs
- `stopwaitsecs` not explicitly configured (defaults to 10)
- Workers regularly killed mid-job during Supervisor operations
- Job loss during deployments and restarts
- Logs show SIGKILL after stopwaitsecs expiry

### Why Harmful
Every deployment or Supervisor restart triggers SIGTERM → 10s wait → SIGKILL. Workers processing jobs that take >10 seconds are always killed mid-execution. The current job is lost (re-queued after `retry_after`) and may be double-processed. For a team deploying 5 times per day with 20 workers, this causes 100+ lost jobs per day.

### Consequences
- Workers SIGKILLed on every deployment
- Systemic job loss from routine operations
- Double-processing risk on every restart
- Default `stopwaitsecs` incompatible with production

### Alternative
Set `stopwaitsecs` to at least the worker `--timeout` + 10 seconds.

### Refactoring Strategy
1. Calculate: `stopwaitsecs = worker --timeout + 10`
2. Set `stopwaitsecs` explicitly in Supervisor configuration
3. Verify: `stopwaitsecs > --timeout`
4. Test: stop Supervisor group, confirm no SIGKILL

### Detection Checklist
- [ ] `stopwaitsecs` explicitly configured
- [ ] `stopwaitsecs` > `--timeout` on all workers
- [ ] No SIGKILL during routine operations
- [ ] Jobs not lost during deployments

### Related Rules
Set stopwaitsecs Above Maximum Job Runtime

### Related Skills
Configure Supervisor for Production Queue Workers

### Related Decision Trees
Supervisor vs Horizon for Process Management

---

## 3. No `stopasgroup`/`killasgroup`

### Category
Reliability

### Description
Not setting `stopasgroup=true` and `killasgroup=true`, causing SIGTERM to kill only the parent worker process while child processes survive as zombies.

### Why It Happens
Both parameters default to `false`. The developer follows a basic Supervisor tutorial that omits these settings. When Supervisor stops a worker (SIGTERM), only the main PHP process receives the signal. Any subprocesses spawned by the worker (from `proc_open`, Symfony Process, or `--timeout` subprocess) continue running.

### Warning Signs
- Supervisor config missing `stopasgroup` and `killasgroup`
- Zombie PHP processes accumulate over time
- Memory usage increases from orphaned subprocesses
- File descriptor exhaustion after repeated restarts

### Why Harmful
A job uses Symfony Process to run an external PDF generator. Supervisor stops the worker — the main PHP process exits, but the PDF generator subprocess continues running. Over hours and multiple restarts, dozens of orphaned PDF generators accumulate. Each consumes memory and holds file handles. Eventually, the system runs out of file descriptors or memory, affecting all workers.

### Consequences
- Accumulating zombie subprocesses
- Gradual memory and file descriptor exhaustion
- Workers degrade over time from orphan accumulation
- System-wide resource exhaustion from unmanaged subprocesses

### Alternative
Always set `stopasgroup=true` and `killasgroup=true` to manage the entire process group.

### Refactoring Strategy
1. Add `stopasgroup=true` and `killasgroup=true` to all worker configurations
2. Reload Supervisor config
3. Verify: no orphaned processes after worker restart
4. Clean up existing zombie processes

### Detection Checklist
- [ ] `stopasgroup=true` and `killasgroup=true` set
- [ ] No zombie subprocesses after worker restart
- [ ] Memory and file descriptors stable over time
- [ ] Process group cleanly terminated on stop

### Related Rules
Always Set stopasgroup and killasgroup

### Related Skills
Configure Supervisor for Production Queue Workers

### Related Decision Trees
Supervisor vs Horizon for Process Management

---

## 4. Over-Provisioned `numprocs`

### Category
Performance

### Description
Setting `numprocs` far higher than the server's CPU cores for CPU-bound workloads, causing excessive context switching and reduced throughput.

### Why It Happens
More workers seems better — more parallel processing means higher throughput. The developer sets `numprocs=20` on a 2-core server. For CPU-bound jobs (image processing, PDF generation, encryption), each worker competes for CPU time. The OS context-switches between 20 workers, each making slow progress.

### Warning Signs
- `numprocs` significantly higher than CPU core count
- CPU-bound jobs processing slowly despite many workers
- High context switching rate on the server
- CPU usage near 100% with low job throughput

### Why Harmful
On a 2-core server with 20 workers processing CPU-bound image resizing jobs, each worker gets approximately 10% of a core. Context switching overhead consumes 20-30% of CPU. 20 workers each take 2 seconds to resize an image when a dedicated core could do it in 0.2 seconds. Throughput is 10 jobs/second instead of the theoretical 5 jobs/second (2 cores * 2.5 jobs/second). Adding more workers beyond core count reduces throughput.

### Consequences
- Throughput reduced by excessive context switching
- CPU saturation doesn't translate to job throughput
- Memory pressure from too many worker processes
- Infrastructure wasted on non-productive overhead

### Alternative
Set `numprocs` to CPU core count for CPU-bound workloads, up to 2-3x core count for I/O-bound workloads.

### Refactoring Strategy
1. Determine workload type: CPU-bound (image processing, encryption) or I/O-bound (API calls, database queries)
2. Set `numprocs` = CPU core count for CPU-bound
3. Set `numprocs` = 2-3x CPU core count for I/O-bound
4. For mixed: start at core count, monitor, and adjust
5. Monitor throughput per worker to validate scaling

### Detection Checklist
- [ ] `numprocs` appropriate for workload type
- [ ] CPU-bound: `numprocs` <= core count
- [ ] I/O-bound: `numprocs` <= 3x core count
- [ ] Throughput scales with worker count

### Related Rules
Tune numprocs Based on Workload Type

### Related Skills
Configure Supervisor for Production Queue Workers

### Related Decision Trees
numprocs Concurrency Setting
