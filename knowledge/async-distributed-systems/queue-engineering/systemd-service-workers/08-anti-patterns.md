# Anti-Patterns — systemd Service for Queue Workers

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Worker Management |
| Knowledge Unit | systemd Service for Queue Workers |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Missing `Restart=always` — Single Worker Lifetime
2. Default `KillMode=process` — Zombie Subprocesses
3. No `RestartSec` — Tight Crash Loop
4. Single Worker Without Template Units

---

## 1. Missing `Restart=always`

### Category
Reliability

### Description
Not setting `Restart=always` in a systemd service unit for queue workers, causing the worker to exit after `--max-jobs`/`--max-time` and never restart.

### Why It Happens
The default systemd `Restart` directive is `no` — the service runs once and never restarts. The developer creates a service unit with `ExecStart` and doesn't add `Restart=always`. The worker starts fine, processes jobs, hits `--max-jobs`, and exits. systemd considers the exit successful and does not restart.

### Warning Signs
- `Restart` not explicitly configured in service unit
- Worker stops after processing its recycling limit
- Queue processing halts until manual `systemctl start`
- No automatic recovery from worker exits

### Why Harmful
A worker processes 500 jobs per hour with `--max-jobs=500`. After each hour, the worker exits (expected behavior for recycling). Without `Restart=always`, the service never restarts. After the first recycling, queue processing stops permanently. The team doesn't notice for 30 minutes. 250 jobs pile up. The queue backlog causes downstream timeout failures.

### Consequences
- Worker stops permanently after first recycling
- Queue processing halts with no automatic recovery
- Silent backlog growth until manual restart
- systemd service shows "inactive (dead)" with no restart

### Alternative
Always set `Restart=always` in systemd worker service units.

### Refactoring Strategy
1. Add `Restart=always` to the `[Service]` section of the unit file
2. Reload systemd: `sudo systemctl daemon-reload`
3. Restart service: `sudo systemctl restart queue-worker@1`
4. Test: wait for `--max-jobs`, confirm automatic restart

### Detection Checklist
- [ ] `Restart=always` configured
- [ ] Worker restarts after `--max-jobs` exit
- [ ] Queue processing continues uninterrupted
- [ ] Service shows "active (running)" after recycling

### Related Rules
Always Set Restart=always on Worker Service Units

### Related Skills
Configure systemd Service Units for Queue Workers

### Related Decision Trees
systemd vs Supervisor for Worker Management

---

## 2. Default `KillMode=process`

### Category
Reliability

### Description
Leaving `KillMode` at the default `process`, causing systemd to kill only the main PHP process while child subprocesses survive as zombies.

### Why It Happens
The default `KillMode=process` sends signals to only the main process. The developer doesn't override it. When the service stops (deploy, restart), systemd sends SIGTERM to the main PHP process only. Any subprocesses spawned during job execution continue running.

### Warning Signs
- `KillMode` not explicitly set (defaults to `process`)
- Child processes survive after service stop
- Zombie processes accumulate over time
- Resource usage grows from orphaned processes

### Why Harmful
A job runs `ffmpeg` via `proc_open` for video processing. systemd stops the worker service — the main PHP process exits, but the `ffmpeg` child continues running. Over days of deployments and restarts, dozens of orphaned `ffmpeg` processes accumulate, each consuming CPU and memory. The system's process table fills up, and new workers can't be spawned.

### Consequences
- Accumulating orphaned subprocesses
- Resource consumption by zombie children
- Process table exhaustion over time
- System degradation from accumulated orphans

### Alternative
Set `KillMode=mixed` to signal the entire control group including child processes.

### Refactoring Strategy
1. Add `KillMode=mixed` to the `[Service]` section
2. Reload systemd: `sudo systemctl daemon-reload`
3. Restart service: `sudo systemctl restart queue-worker@1`
4. Verify: no orphaned processes after stop

### Detection Checklist
- [ ] `KillMode=mixed` configured
- [ ] No orphaned subprocesses after service stop
- [ ] Process group cleanly terminated
- [ ] Resource usage stable over time

### Related Rules
Set KillMode=mixed for Clean Subprocess Handling

### Related Skills
Configure systemd Service Units for Queue Workers

### Related Decision Trees
systemd vs Supervisor for Worker Management

---

## 3. No `RestartSec`

### Category
Reliability

### Description
Not setting `RestartSec`, defaulting to 0, causing a tight crash-restart loop if the worker persistently fails on startup.

### Why It Happens
The default `RestartSec=0` means systemd immediately restarts the service after exit. The developer sets `Restart=always` but doesn't add a delay. If the worker has a persistent error (PHP syntax error, missing extension), it crashes on startup, systemd restarts it immediately, and the crash-restart cycle loops at maximum speed.

### Warning Signs
- `RestartSec` not configured (defaults to 0)
- Rapid service restarts in `systemctl status` output
- High CPU from continuous PHP boot + crash
- Journald logs filled with repeated crash entries

### Why Harmful
A deployment introduces a PHP syntax error in a queued job class. The worker boots, parses the file, encounters the syntax error, and crashes. systemd detects the exit and immediately restarts (RestartSec=0). The worker boots again, crashes again. This happens hundreds of times per minute. CPU spikes to 100% from continuous PHP bootstrap. Journald fills with repeated error logs. Other services on the server are affected by resource contention.

### Consequences
- CPU saturation from continuous crash-restart cycles
- Rapid log growth filling disk space
- Resource contention affecting other services
- Delayed detection — crash loop may not trigger alerts

### Alternative
Always set `RestartSec=3s` (or higher) to add a delay between restart attempts.

### Refactoring Strategy
1. Add `RestartSec=3s` to the `[Service]` section
2. Reload systemd: `sudo systemctl daemon-reload`
3. Restart service
4. For persistent errors, systemd's `StartLimitInterval` will eventually stop trying

### Detection Checklist
- [ ] `RestartSec` >= 3 seconds configured
- [ ] No tight crash-restart loops
- [ ] CPU stable during persistent error scenarios
- [ ] Journald logs not overwhelmed by restart entries

### Related Rules
Set RestartSec=3s to Prevent Crash Loops

### Related Skills
Configure systemd Service Units for Queue Workers

### Related Decision Trees
systemd vs Supervisor for Worker Management

---

## 4. Single Worker Without Template Units

### Category
Scalability

### Description
Running a single worker process without using template units for multi-worker concurrency, limiting job processing throughput.

### Why It Happens
systemd lacks Supervisor's `numprocs` feature. The developer creates a single service unit for one worker. The application processes 10,000 jobs/day, but one worker can only process ~3,000 jobs/day. The queue remains backlogged. The developer doesn't know about template units (`@`) for multi-instance workers.

### Warning Signs
- Single worker service unit (no `@` template)
- Queue backlog despite idle server CPU
- Worker throughput cannot scale
- Need to manually create duplicate unit files for more workers

### Why Harmful
One worker processes jobs sequentially. With a job taking 10 seconds on average, throughput is 6 jobs/minute, 360 jobs/hour, ~8,640 jobs/day. The application dispatches 15,000 jobs/day. Each day, 6,360 jobs accumulate in the backlog. The backlog grows indefinitely. Adding more worker processes is the only fix, but systemd requires template units or separate files for parallelism.

### Consequences
- Sequential processing limits throughput
- Permanent queue backlog
- Server CPU underutilized with single worker
- No way to scale without unit file changes

### Alternative
Use systemd template units (`queue-worker@.service`) with multiple instances for parallel processing.

### Refactoring Strategy
1. Create template unit: `queue-worker@.service` with `%i` for instance number
2. Enable multiple instances: `systemctl enable queue-worker@1 queue-worker@2 queue-worker@3 queue-worker@4`
3. Start all instances: `systemctl start queue-worker@1 queue-worker@2 queue-worker@3 queue-worker@4`
4. Verify parallel processing: all instances processing jobs

### Detection Checklist
- [ ] Template unit used for multi-worker setups
- [ ] Multiple worker instances running
- [ ] Parallel job processing confirmed
- [ ] Throughput scales with worker count

### Related Rules
Use Template Units for Multi-Worker Setups

### Related Skills
Configure systemd Service Units for Queue Workers

### Related Decision Trees
systemd vs Supervisor for Worker Management
