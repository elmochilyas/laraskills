# Anti-Patterns: block_for Redis Option for Worker Polling

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering |
| Knowledge Unit | K080 — block_for Redis Option for Worker Polling |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | No block_for on Idle Queues | Performance | High |
| 2 | block_for with Redis Cluster | Reliability | Critical |
| 3 | block_for > 10 with Predis | Operational | High |
| 4 | block_for with --sleep Both Set | Configuration | Medium |
| 5 | Connection Pool Smaller Than Worker Count | Performance | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Ignoring Connection Pool Sizing with Blocking Workers | block-for-redis-polling, horizon-scaling | High |
| Predis Used in Production Environments | block-for-redis-polling, queue-driver-architecture | Medium |
| Missing block_for Configuration Entirely | block-for-redis-polling, queue-connections-vs-queues | Medium |

---

## Anti-Pattern 1: No block_for on Idle Queues

### Category
Performance — Wasted Redis Round-Trips

### Description
Leaving `block_for` at the default (null) on low-volume queues, causing workers to poll Redis in a tight loop when the queue is empty. Each worker executes ~20 Redis round-trips per minute at `--sleep=3` — 50 workers = 1000 wasted round-trips per minute.

### Why It Happens
The default configuration is `block_for=null`. Developers are unaware of the option or do not consider the polling overhead of idle workers. Low-volume queues rarely appear as performance problems in monitoring, so the wasted traffic goes unnoticed.

### Warning Signs
- `block_for` not set in `config/queue.php` (defaults to null)
- Redis CPU usage is significant even when no jobs are being processed
- `MONITOR` shows continuous `BRPOP` calls from workers with empty queues
- High number of Redis connections relative to active job processing
- Worker logs show back-to-back "nothing to process" and "sleeping" messages

### Why Harmful
At scale, idle polling consumes significant Redis CPU and network bandwidth. With 100 workers polling every 3 seconds, that's 33 Redis round-trips per second — all returning "no job" — generating Redis CPU overhead and network traffic for zero productive work.

### Real-World Consequences
A team deploys 50 queue workers on a Redis instance shared with cache. Queue workers poll every 3 seconds with `block_for=null` — 16,000 idle Redis round-trips per minute. Redis CPU is at 40% during idle periods. Cache hit ratio drops because Redis spends CPU on polling instead of cache operations. After setting `block_for=5`, Redis CPU drops to 5% during idle.

### Preferred Alternative
Set `block_for=5-10` for low-volume queues to eliminate polling traffic during idle periods.

### Refactoring Strategy
1. Add `'block_for' => 5` to each Redis queue connection in `config/queue.php`
2. Set `--sleep=0` on worker commands (redundant with block_for)
3. Ensure Redis connection pool size >= max worker count
4. Deploy and verify Redis CPU drops during idle periods
5. Monitor that job pickup latency is acceptable

### Detection Checklist
- [ ] `block_for` not set in queue.php (defaults to null)
- [ ] Redis CPU elevated during idle periods
- [ ] MONITOR/RMON shows continuous BRPOP with timeout 0
- [ ] Workers log many "nothing to process" cycles per minute

### Related Rules/Skills/Decision Trees
- **Rule 1**: set-block-for-low-volume (`05-rules.md`)
- **Decision 1**: Blocking Poll vs Sleep Poll Strategy (`07-decision-trees.md`)
- **Decision 2**: block_for Value Selection (`07-decision-trees.md`)

---

## Anti-Pattern 2: block_for with Redis Cluster

### Category
Reliability — Missed Jobs

### Description
Setting `block_for` to a positive value when using Redis Cluster. `BRPOP` blocking across cluster nodes is unreliable — it only blocks on the connection's node. Jobs dispatched to other cluster nodes may not trigger the block release, causing workers to miss jobs until the block timeout expires.

### Why It Happens
Teams use the same configuration template for all Redis deployments, including Cluster. The `block_for` option works on single-node Redis, so developers assume it works identically on Cluster.

### Warning Signs
- Redis Cluster deployment with `block_for > 0` in queue config
- Workers delay picking up jobs for up to `block_for` seconds
- Intermittent job pickup latency spikes with no corresponding queue load
- Jobs accumulate even though workers show "waiting for jobs" status
- Message delays correlate with cluster node topology

### Why Harmful
Jobs dispatched to a node different from the blocked connection are not picked up until the block timeout expires. A 5-second `block_for` means jobs may be delayed by up to 5 seconds. At high volume, the cumulative delay creates a persistent backlog.

### Real-World Consequences
An e-commerce platform uses Redis Cluster with `block_for=5`. Orders dispatch to node A, but the blocked worker is connected to node B. The order sits for 5 seconds until `BRPOP` returns, then the worker polls again and picks it up. During Black Friday, the 5-second delay compounds — workers never catch up, and order confirmation emails are delayed by 15+ minutes.

### Preferred Alternative
Always set `block_for=null` when using Redis Cluster. Use polling with `--sleep` instead.

### Refactoring Strategy
1. Set `'block_for' => null` in the Redis connection config
2. Ensure `--sleep` is configured on workers (e.g., `--sleep=3`)
3. Test job pickup latency under cluster conditions
4. Monitor for consistent job pickup times
5. Consider moving to single-node Redis with replica if blocking is critical

### Detection Checklist
- [ ] Redis Cluster deployment with `block_for > 0`
- [ ] Job pickup latency shows periodic spikes matching `block_for` value
- [ ] No monitoring on per-node job distribution
- [ ] Workers idle while jobs accumulate

### Related Rules/Skills/Decision Trees
- **Rule 2**: no-block-for-redis-cluster (`05-rules.md`)
- **Decision 1**: Blocking Poll vs Sleep Poll Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 3: block_for > 10 with Predis

### Category
Operational — Signal Unresponsiveness

### Description
Setting `block_for` to a value greater than 10 when using the Predis driver. Predis uses blocking PHP I/O — a 30-second `BRPOP` block makes the worker unresponsive to SIGTERM for the entire block duration, preventing graceful shutdown during deployments.

### Why It Happens
Developers increase `block_for` for maximum idle efficiency without considering Predis's blocking I/O limitations. The configuration change is made after switching to phpredis is forgotten.

### Warning Signs
- Predis driver with `block_for > 10`
- Worker processes take >10 seconds to respond to `SIGTERM`
- Deployment restarts timeout, leaving old worker processes running
- Supervisor reports `FATAL` because workers don't stop in time
- Graceful shutdown logs show "Waiting for workers to finish..." for excessive duration

### Why Harmful
Deployments take longer as workers refuse to stop. If the deployment system kills workers forcefully, currently processing jobs are lost. The deployment pipeline backs up, and rollback windows are missed.

### Real-World Consequences
A team uses Predis with `block_for=30`. During a hotfix deployment, workers must restart. Each worker blocks for up to 30 seconds before responding to SIGTERM. With 20 workers, the deployment takes 60+ seconds to fully drain. The deployment system's health check fails, auto-rollback triggers, and the hotfix is delayed by 20 minutes.

### Preferred Alternative
Keep `block_for <= 10` with Predis, or switch to phpredis (which supports non-blocking I/O).

### Refactoring Strategy
1. Set `'block_for' => 5` (or lower) when using Predis
2. Alternatively, switch from `predis` to `phpredis` in `config/database.php`
3. Test worker SIGTERM responsiveness after change
4. Verify deployment restart time decreases
5. Monitor for successful graceful shutdowns in deployment logs

### Detection Checklist
- [ ] Predis driver with `block_for > 10`
- [ ] Worker shutdown takes >10 seconds during deployments
- [ ] Deployment system reports worker timeout
- [ ] Supervisor logs show force-killed workers

### Related Rules/Skills/Decision Trees
- **Rule 3**: avoid-long-block-with-predis (`05-rules.md`)
- **Decision 2**: block_for Value Selection (`07-decision-trees.md`)

---

## Anti-Pattern 4: block_for with --sleep Both Set

### Category
Configuration — Redundant Delay

### Description
Configuring both `block_for` (in config) and `--sleep` (on the worker command). When `block_for` is active, the worker already waits at the Redis level during idle — `--sleep` adds a redundant delay on top, doubling the worst-case idle time and increasing job pickup latency.

### Why It Happens
Default worker commands include `--sleep=3`. Teams add `block_for` to the config but don't update the worker command. Both configurations coexist without an obvious error — the worker still works, just slower during idle periods.

### Warning Signs
- Worker command includes `--sleep=3` (or similar) alongside `block_for=5` in config
- Worst-case job pickup latency = `block_for + sleep` (e.g., 5 + 3 = 8 seconds)
- Worker logs show "sleeping" after "waiting for jobs" even with block_for active
- Job pickup latency doubles when queue transitions from idle to active

### Why Harmful
Job pickup latency increases unnecessarily. A newly dispatched job may wait `block_for + sleep` seconds before processing — 8 seconds instead of 5, or 13 seconds instead of 10. For user-facing jobs (password resets, payment callbacks), this delay is directly visible.

### Real-World Consequences
A team sets `block_for=10` on their Redis queue but keeps the default `--sleep=3`. When a user requests a password reset just after the worker enters the block phase, the job waits 10 seconds (block) + 3 seconds (sleep) = 13 seconds before pickup. The password reset email arrives 13 seconds late — the user hits "send again" twice, generating duplicate reset emails.

### Preferred Alternative
Set `--sleep=0` when `block_for` is configured. The worker blocks at the Redis level — no additional sleep needed.

### Refactoring Strategy
1. Update worker commands: replace `--sleep=3` with `--sleep=0`
2. Verify `block_for` is configured in `config/queue.php`
3. Test job pickup latency from idle state
4. Monitor for reduced latency during idle-to-active transitions

### Detection Checklist
- [ ] Worker has `--sleep` > 0 and `block_for` > 0 in config
- [ ] Job pickup latency = `block_for + sleep` during idle transitions
- [ ] Worker logs show both "blocking" and "sleeping" cycles
- [ ] User-facing jobs have intermittent delay spikes

### Related Rules/Skills/Decision Trees
- **Rule 5**: remove-sleep-with-block-for (`05-rules.md`)

---

## Anti-Pattern 5: Connection Pool Smaller Than Worker Count

### Category
Performance — Connection Starvation

### Description
Configuring a Redis connection pool smaller than the number of worker processes when `block_for` is active. Each blocking worker occupies a Redis connection for the entire block duration — workers beyond the pool size block waiting for connections, causing other Redis operations (cache, sessions) to queue up.

### Why It Happens
Default connection pool sizes are small (5-10). Teams add workers without reviewing connection pool configuration. The problem only manifests under specific conditions (all workers idle simultaneously), making it hard to reproduce.

### Warning Signs
- `phpredis` connection pool size < number of workers
- Cache operations slow down when all workers are idle
- "Connection pool exhausted" warnings in Redis logs
- Session reads time out during low queue activity
- Application latency increases when queue workers are idle (paradoxical)

### Why Harmful
Other Redis-dependent features degrade when queue workers block. Cache reads, session lookups, and rate limiter checks queue up behind blocked worker connections. The application becomes slower when the queue is idle — the opposite of expected behavior.

### Real-World Consequences
A team has 20 workers with `block_for=5` and a phpredis pool of 5. When all workers block, 15 workers wait for connections. Cache reads that normally take 1ms now wait up to 5 seconds for a connection. Application response time increases from 200ms to 3 seconds during idle queue periods. The team is confused because the degradation correlates with low traffic.

### Preferred Alternative
Ensure phpredis connection pool is at least equal to the maximum number of worker processes, plus headroom for other Redis operations.

### Refactoring Strategy
1. Calculate total concurrent Redis connections needed: max workers + cache connections + sessions
2. Set phpredis pool to that value (e.g., `'pool' => ['min' => 10, 'max' => 30]`)
3. Monitor Redis connection usage to validate sizing
4. Consider moving cache/sessions to a separate Redis instance
5. Test application latency during idle queue periods

### Detection Checklist
- [ ] `block_for > 0` with phpredis pool < worker count
- [ ] Application latency increases when workers block
- [ ] Cache/session operations time out intermittently
- [ ] Redis connection pool warnings in logs

### Related Rules/Skills/Decision Trees
- **Rule 4**: account-for-blocking-connections (`05-rules.md`)
- **Decision 1**: Blocking Poll vs Sleep Poll Strategy (`07-decision-trees.md`)
