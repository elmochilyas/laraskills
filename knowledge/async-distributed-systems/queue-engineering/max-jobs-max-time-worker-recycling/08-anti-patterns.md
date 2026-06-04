# Anti-Patterns — `--max-jobs` and `--max-time` for Worker Recycling

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Worker Management |
| Knowledge Unit | `--max-jobs` and `--max-time` for Worker Recycling |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Missing Recycling Limits — No Limits at All
2. Only One Limit — Gap in Coverage
3. Too-Low Limits — Excessive Restart Overhead
4. No Supervisor Autorestart — Recycling Kills Queue

---

## 1. Missing Recycling Limits

### Category
Performance

### Description
Running daemon workers without `--max-jobs` or `--max-time`, allowing memory to grow unbounded until the process is killed by the OOM killer.

### Why It Happens
Both flags default to 0 (no limit). The developer configures `queue:work` with queue names, sleep, tries, and timeout — but skips recycling limits. The worker runs fine for the first hour, but memory slowly accumulates. After days of continuous processing, RSS reaches dangerous levels.

### Warning Signs
- Worker command lacks both `--max-jobs` and `--max-time`
- Worker RSS increases monotonically over time
- Workers crash with OOM after hours or days
- Memory growth graph shows steady upward trend

### Why Harmful
PHP daemon workers accumulate memory due to zend_mm fragmentation, cached objects in the service container, and open connections. A worker that starts at 25MB RSS grows to 150MB+ over 24 hours. Without recycling, every worker eventually exceeds available memory and is killed by the OOM killer. The force-kill can corrupt the currently processing job, and the worker doesn't restart properly.

### Consequences
- Uncontrolled memory growth over worker lifetime
- Workers force-killed by OOM killer
- Potential job corruption from force-kill
- Regular, unpredictable worker crashes

### Alternative
Always set `--max-jobs=500` and `--max-time=3600` as standard recycling limits.

### Refactoring Strategy
1. Add `--max-jobs=500` and `--max-time=3600` to all `queue:work` commands
2. Verify Supervisor `autorestart=true` or systemd `Restart=always`
3. Monitor RSS to confirm limits keep memory in check
4. Tune based on observed growth

### Detection Checklist
- [ ] Both `--max-jobs` and `--max-time` configured
- [ ] RSS stays within safe bounds
- [ ] Workers recycle before OOM
- [ ] No memory-related worker crashes

### Related Rules
Always Set Both --max-jobs and --max-time on Workers

### Related Skills
Configure --max-jobs and --max-time for Worker Recycling

### Related Decision Trees
max-jobs Value Selection, max-time Value Selection

---

## 2. Only One Limit — Gap in Coverage

### Category
Reliability

### Description
Setting only `--max-jobs` or only `--max-time`, leaving a gap that allows either rapid or slow memory leaks to grow unchecked.

### Why It Happens
The developer chooses one limit based on the most obvious concern. If they're worried about leaky jobs, they set `--max-jobs`. If they're worried about long-running processes, they set `--max-time`. Either alone misses the other scenario — a slow leak spreads over hours (not caught by `--max-jobs` alone) or a rapid leak fills memory before `--max-time` fires.

### Warning Signs
- Only `--max-jobs` set, no `--max-time`
- Only `--max-time` set, no `--max-jobs`
- Worker RSS grows slowly over hours (missed by `--max-jobs` only)
- Worker RSS grows rapidly (missed by `--max-time` only)

### Why Harmful
With only `--max-jobs=500`, a job leaking 100KB per iteration accumulates 50MB over 500 jobs — well within safe bounds. But a slow leak of 1MB per hour (from a connection pool or cache) accumulates 24MB over 24 hours. `--max-jobs` may not fire for 24 hours (500 jobs may take a full day). The slow leak goes unchecked.

With only `--max-time=3600`, a job leaking 5MB per iteration accumulates 250MB in 50 jobs (5 minutes). The worker OOMs before `--max-time` fires at 3600 seconds. The rapid leak is unchecked.

### Consequences
- Slow leaks grow unchecked with only `--max-jobs`
- Rapid leaks OOM before `--max-time` fires
- Memory protection has a predictable gap
- Workers crash from the unguarded leak type

### Alternative
Always set both limits for defense in depth — `--max-jobs` catches rapid leaks, `--max-time` catches slow leaks.

### Refactoring Strategy
1. Add the missing limit to all worker commands
2. Default: `--max-jobs=500 --max-time=3600`
3. Tune both based on observed memory growth patterns
4. Monitor: verify the first-limit-reached covers both scenarios

### Detection Checklist
- [ ] Both limits set (not one)
- [ ] Rapid leaks caught by `--max-jobs`
- [ ] Slow leaks caught by `--max-time`
- [ ] No memory-related crashes between limits

### Related Rules
Always Set Both --max-jobs and --max-time on Workers

### Related Skills
Configure --max-jobs and --max-time for Worker Recycling

### Related Decision Trees
max-jobs Value Selection, max-time Value Selection

---

## 3. Too-Low Limits — Excessive Restart Overhead

### Category
Performance

### Description
Setting very low recycling limits (e.g., `--max-jobs=10` or `--max-time=300`), causing workers to restart so frequently that boot overhead significantly reduces throughput.

### Why It Happens
The developer observes memory growth and sets aggressive recycling limits. If a worker grows 10MB per job and has a 128MB limit, they set `--max-jobs=10`. The worker restarts every 10 jobs. Each restart costs 50-200ms of boot time. At 10 jobs/restart, the overhead is 5-20ms per job — potentially doubling job execution time.

### Warning Signs
- `--max-jobs < 50` or `--max-time < 600`
- Workers restart more than once per 5 minutes
- Job throughput is significantly lower than expected
- Worker boot overhead visible in job processing metrics

### Why Harmful
Each worker restart costs 50-200ms for PHP + Laravel boot. At 10 jobs/restart, overhead is 5-20ms per job. For a 50ms job, this adds 10-40% overhead. For 100,000 jobs/day, that's 5000-20,000 seconds of boot overhead — one hour of wasted CPU time. The aggressive recycling intended to protect memory actually hurts throughput.

### Consequences
- Significant throughput reduction from frequent restarts
- Wasted CPU on framework boot overhead
- Higher infrastructure costs for same throughput
- Excessive recycling may mask memory leak that should be fixed

### Alternative
Start with standard values (500 jobs, 3600 seconds) and tune based on observed memory growth. Fix memory leaks rather than working around them with aggressive recycling.

### Refactoring Strategy
1. Set `--max-jobs=500` and `--max-time=3600` as starting point
2. Monitor RSS over worker lifetime
3. Reduce limits only if RSS approaches memory limit
4. For leaky jobs, fix the leak rather than recycling more frequently

### Detection Checklist
- [ ] Recycling limits set to standard values (500/3600)
- [ ] Restart frequency is reasonable (every 15+ minutes)
- [ ] Boot overhead < 1% of total processing time
- [ ] Memory leaks investigated, not papered over

### Related Rules
Tune Limits Based on Observed Memory Growth

### Related Skills
Configure --max-jobs and --max-time for Worker Recycling

### Related Decision Trees
max-jobs Value Selection, max-time Value Selection

---

## 4. No Supervisor Autorestart — Recycling Kills Queue

### Category
Reliability

### Description
Setting recycling limits without configuring Supervisor `autorestart=true`, causing the worker to exit after reaching the limit and never restart.

### Why It Happens
The developer configures recycling flags on `queue:work` but doesn't set `autorestart=true` on the Supervisor program. Worker recycling works by exiting the process — Supervisor must detect the exit and spawn a new worker. Without autorestart, the exit is permanent.

### Warning Signs
- Worker `--max-jobs` or `--max-time` configured
- Supervisor config missing `autorestart=true`
- Workers stop processing after first recycling event
- Queue backlog grows after worker hits max-jobs

### Why Harmful
A worker processes 500 jobs, hits `--max-jobs`, and exits gracefully — as designed. Supervisor, configured without `autorestart=true`, does not restart the worker. The queue stops processing. The team doesn't notice until users report delayed emails or unprocessed webhooks hours later. The recycling mechanism designed to keep workers healthy actually caused a complete queue outage.

### Consequences
- Queue processing halts after first recycling event
- Silent backlog growth until manual intervention
- No automatic recovery from designed exits
- Recycling defeats itself without autorestart

### Alternative
Always pair `--max-jobs`/`--max-time` with Supervisor `autorestart=true` or systemd `Restart=always`.

### Refactoring Strategy
1. Add `autorestart=true` to Supervisor configuration
2. For systemd: add `Restart=always`
3. Test: start worker, wait for `--max-jobs`, verify worker restarts
4. Monitor: confirm workers recycle continuously

### Detection Checklist
- [ ] `autorestart=true` or `Restart=always` configured
- [ ] Worker restarts after recycling exit
- [ ] Queue processing continues through recycling
- [ ] No processing gaps from worker exits

### Related Rules
Ensure autorestart=true in Supervisor

### Related Skills
Configure --max-jobs and --max-time for Worker Recycling

### Related Decision Trees
max-jobs Value Selection, max-time Value Selection
