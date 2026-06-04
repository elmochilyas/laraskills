---
Domain: Async & Distributed Systems
Subdomain: Broadcasting & Real-Time
Knowledge Unit: K035 — Reverb Scaling via Multiple Processes
Knowledge ID: K035
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Scaling Reverb Without Redis Pub/Sub | Architecture | Critical |
| 2 | Over-Provisioning Processes Beyond CPU Cores | Performance | Medium |
| 3 | Ignoring Connection Distribution Imbalance | Operations | Medium |
| 4 | No Health Checks on Reverb Processes | Reliability | High |
| 5 | Assuming Durable Message Delivery via Redis Pub/Sub | Architecture | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Isolated Process State (no pub/sub) | Critical — multi-process deployment functionally broken for presence/broadcasting | Mandatory Redis pub/sub config for >1 process |
| Over-Provisioned Processes | Medium — context switching reduces per-process throughput | Enforce `numprocs` <= CPU cores in deployment |
| No Health Checks | High — load balancer routes traffic to frozen processes | Implement application-level health endpoint |

---

## 1. Scaling Reverb Without Redis Pub/Sub

### Category
Architecture

### Description
Running multiple Reverb processes without configuring Redis pub/sub for cross-process state sharing. Each process maintains its own in-memory state — clients on different processes cannot see each other's presence state, and broadcast events from one process never reach clients on another.

### Why It Happens
- Developer adds `numprocs=4` to Supervisor but doesn't configure `scaling` in `reverb.php`
- Not understanding that each Reverb process has isolated in-memory state
- Assuming Reverb automatically coordinates across processes
- Redis infrastructure isn't available, so pub/sub is skipped
- Testing only with single process — scaling issue not discovered until production

### Warning Signs
- Presence channels show incomplete user lists (only users on the same process)
- Broadcast events delivered to some clients but not others
- User A sends a message — User B on a different process never receives it
- `php artisan reverb:status` shows multiple processes but pub/sub not configured
- "Works for me" — developer tests on process 1 while QA is on process 2

### Why Harmful
- Multi-process deployment is functionally broken — presence and broadcasting don't work across processes
- The application appears to work for some users but not others
- Users cannot see each other's online status if on different processes
- Real-time features are unreliable — messages may or may not arrive
- Scaling by adding processes actually degrades the user experience

### Consequences
- Incomplete presence data — users appear offline to each other
- Missed broadcast events — "I sent a message but they didn't receive it"
- Hard to reproduce — depends on which process the client connected to
- User confusion — "why can't I see my friend online?"
- Emergency scaling reconsideration — must add Redis

### Alternative
- Always configure Redis pub/sub when running multiple processes:
  ```php
  'scaling' => [
      'enabled' => true,
      'channel' => 'reverb',
      'server' => [
          'host' => env('REDIS_HOST'),
          'port' => env('REDIS_PORT', 6379),
      ],
  ],
  ```
- Single-process deployments don't need pub/sub

### Refactoring Strategy
1. Configure `scaling.enabled = true` in `config/reverb.php`
2. Set up Redis connection details
3. Restart all Reverb processes
4. Verify cross-process broadcast works (client on process A receives events from process B)
5. Verify presence channels show complete user lists
6. Remove any workarounds for missing cross-process state

### Detection Checklist
- [ ] `scaling.enabled = true` in multi-process deployments
- [ ] Redis pub/sub configured with reachable host
- [ ] Broadcast events delivered to all clients regardless of process
- [ ] Presence channels show complete user lists
- [ ] Single-process deployments can skip — but document the limitation

### Related Rules
- enable-redis-pubsub-for-multi-process

### Related Skills
- Scale Reverb via Multiple Processes

### Related Decision Trees
- Vertical vs Horizontal Scaling for Reverb

---

## 2. Over-Provisioning Processes Beyond CPU Cores

### Category
Performance

### Description
Setting Supervisor `numprocs` higher than the number of CPU cores. Each Reverb process is single-threaded — more processes than cores causes context switching overhead without throughput gain, and may reduce per-process performance.

### Why It Happens
- "More processes = better" assumption
- Copying from queue worker scaling where more processes than cores can be beneficial (I/O-bound workers)
- Not knowing Reverb is CPU-bound (event loop processing)
- Server has burstable CPU (e.g., AWS T-series) and processes multiply during burst
- No performance testing to validate optimal process count

### Warning Signs
- CPU shows high context switching rate
- Per-process throughput is lower than expected
- Adding processes doesn't increase connection capacity
- Server load average is higher than expected for the process count
- `vmstat` shows high `cs` (context switches) column

### Why Harmful
- Processes compete for CPU time — more scheduling overhead
- Each process context switch reduces available CPU for actual work
- No additional connection capacity — the CPU is the bottleneck, not process count
- Memory waste — each process allocates memory for its state
- Misleading dashboard — "12 processes running" suggests more capacity than exists

### Consequences
- Higher CPU usage for the same throughput
- No connection capacity increase despite more processes
- Increased memory usage without benefit
- Harder to debug — "we have 8 processes, why is performance poor?"
- Wasted infrastructure costs for no gain

### Alternative
- Set `numprocs` equal to CPU core count (or 1 for single core)
- Profile at different process counts: 1, 2, 4 per core ratio
- Monitor per-process connection metrics to validate scaling

### Refactoring Strategy
1. Determine server CPU core count: `nproc` or `lscpu`
2. Set `numprocs` to CPU core count in Supervisor config
3. Reload Supervisor (may cause brief connection drop — plan accordingly)
4. Verify per-process connection capacity improves
5. Monitor CPU utilization — should show balanced load across cores

### Detection Checklist
- [ ] `numprocs` <= CPU core count
- [ ] No performance degradation after adjusting process count
- [ ] CPU load balanced across cores (not one saturated, others idle)
- [ ] Context switching rate is normal for the process count
- [ ] Connection capacity scales linearly with process count

### Related Rules
- scale-reverb-via-process-count

### Related Skills
- Scale Reverb via Multiple Processes

### Related Decision Trees
- Vertical vs Horizontal Scaling for Reverb

---

## 3. Ignoring Connection Distribution Imbalance

### Category
Operations

### Description
Running multiple Reverb processes without monitoring connection distribution across them. Uneven distribution (some processes handling 5K connections while others handle 500) causes resource waste and process overload.

### Why It Happens
- Not monitoring per-process connection counts
- Load balancer algorithm (sticky sessions based on IP hash) distributes unevenly
- Some processes handle burst traffic (popular channels) while others don't
- Process restarts reset connection counts — connections flood the first available process
- No alerting for connection imbalance

### Warning Signs
- One process has 80% of connections while others are underutilized
- Process A OOM-killed while Process B uses 20% memory
- Load balancer logs show uneven distribution
- Users on one process experience poor performance while others are fine
- Per-process metrics show large variance

### Why Harmful
- Some processes are overloaded while others sit idle — wasted capacity
- Overloaded processes crash, causing mass disconnection of their users
- Uneven load makes capacity planning impossible
- Cannot increase overall capacity without monitoring distribution
- Each overloaded process becomes a single point of failure for its users

### Consequences
- Inconsistent user experience (some slow, others fast)
- Process crashes from overloaded processes
- Reconnection storms when overloaded processes crash
- Wasted infrastructure (idle processes)
- Hard to diagnose — average metrics look fine while individual processes are crashing

### Alternative
- Monitor per-process connection count
- Use a more balanced distribution algorithm (least connections, random)
- Restart processes gradually (not all at once) to avoid reconnection storms
- Set per-process `max_connections` in `reverb.php`:
  ```php
  'max_connections' => 2000,
  ```

### Refactoring Strategy
1. Add per-process connection monitoring (Prometheus metrics or log parsing)
2. Identify distribution pattern — is it IP hash bias or process restarts?
3. Switch load balancer to least-connections algorithm if possible
4. Set `max_connections` per process to prevent overload
5. Implement gradual process restart: stop one process at a time
6. Alert when any process exceeds 80% of configured max connections

### Detection Checklist
- [ ] Per-process connection count monitored
- [ ] Connection distribution within 20% variance across processes
- [ ] No single process handles >80% of total connections
- [ ] `max_connections` set per process
- [ ] Process restarts done gradually (one at a time)
- [ ] Alert on per-process connection imbalance

### Related Rules
- scale-reverb-via-process-count

### Related Skills
- Scale Reverb via Multiple Processes

### Related Decision Trees
- Vertical vs Horizontal Scaling for Reverb

---

## 4. No Health Checks on Reverb Processes

### Category
Reliability

### Description
Using only TCP port checks for Reverb health monitoring. A Reverb process may have its TCP port open (accepting connections) while its event loop is frozen or processing is degraded. The load balancer continues routing traffic to the unhealthy process.

### Why It Happens
- Default load balancer health checks use TCP port only
- Not implementing a Reverb-specific health endpoint
- Assuming TCP port up = process healthy
- No budget for building custom health check logic
- Not experiencing event loop freezes in development

### Warning Signs
- Users connected to a process report frozen real-time features
- Process TCP port responds but event handling is stalled
- Load balancer shows "healthy" for a frozen process
- Process must be manually restarted to recover
- Event loop monitoring shows stalled processing

### Why Harmful
- Frozen processes continue accepting new connections
- Users connect to a broken process and immediately experience issues
- Load balancer keeps routing traffic to the broken process
- No alert fires — process appears healthy on all standard metrics
- Manual intervention required (operator must check event loop manually)

### Consequences
- Users connected to frozen process experience complete real-time blackout
- New users randomly routed to the broken process
- Support tickets: "real-time works for some users but not others"
- Delayed recovery — won't be detected until operator investigates
- Process crash (from another issue) would actually be better — it triggers restart

### Alternative
- Implement application-level health check:
  ```php
  // Custom health check endpoint for Reverb
  // Returns 200 if event loop is responsive, 503 if frozen
  ```
- Ping the event loop: send a test message and verify processing
- Use WebSocket-level ping/pong as health indicator
- Configure load balancer to use HTTP health checks instead of TCP

### Refactoring Strategy
1. Implement Reverb health check endpoint (check event loop responsiveness)
2. Configure load balancer to use HTTP health check (not TCP port)
3. Set health check interval and failure threshold
4. Add alerting on health check failures
5. Test: simulate event loop freeze — verify load balancer marks process unhealthy
6. Document health check expectations for operations team

### Detection Checklist
- [ ] Application-level health check implemented for Reverb
- [ ] Load balancer uses HTTP health check (not TCP port)
- [ ] Frozen process is marked unhealthy within 3 check intervals
- [ ] No traffic routed to unhealthy processes
- [ ] Alert on health check failures
- [ ] Health check response time indicates event loop health

### Related Rules
- enable-redis-pubsub-for-multi-process

### Related Skills
- Scale Reverb via Multiple Processes

### Related Decision Trees
- Vertical vs Horizontal Scaling for Reverb

---

## 5. Assuming Durable Message Delivery via Redis Pub/Sub

### Category
Architecture

### Description
Designing application features that depend on Redis pub/sub as a durable, persistent message channel for Reverb cross-process communication. Redis pub/sub is fire-and-forget — if a process briefly disconnects from Redis, it misses all messages during that window with no replay mechanism.

### Why It Happens
- Misunderstanding the difference between Redis pub/sub and Redis streams (persistent)
- Assuming pub/sub has message persistence like queues
- Not reading Redis documentation about pub/sub semantics
- Developing features that require guaranteed delivery without considering the infrastructure
- Copying patterns from queue systems (RabbitMQ, Kafka) to Reverb's pub/sub

### Warning Signs
- Application features depend on every broadcast event being delivered
- Users report missed events after brief Reverb process disconnections
- Redis pub/sub subscribers that disconnect briefly miss messages silently
- No compensating logic for missed events (e.g., periodic state refresh)
- Load balancer health checks that remove and re-add processes cause message gaps

### Why Harmful
- Redis pub/sub does NOT persist messages — if no subscriber is connected, the message is lost
- Reverb process restart (deploy, crash, scaling event) = missed messages during restart window
- Brief Redis network issues = missed messages for the affected processes
- Messages have no sequence numbers or ordering guarantees
- No way to replay missed messages — they're gone forever

### Consequences
- Clients receive incomplete event streams
- Presence channel state gets out of sync (users appear offline)
- Broadcast events missed during process restart window
- Data inconsistency between clients on different processes
- Production incidents from "missing" data that cannot be recovered

### Alternative
- Design clients to handle missed events gracefully (refresh state periodically)
- Use Redis streams instead of pub/sub if persistence is needed
- Implement periodic state reconciliation (e.g., presence heartbeat)
- Accept that pub/sub is best-effort delivery — don't depend on it for critical data
- For guaranteed delivery, use queue systems (not broadcasting)

### Refactoring Strategy
1. Identify features that depend on every pub/sub message being delivered
2. Add periodic state refresh (HTTP API calls) to recover missed events
3. For presence: implement heartbeat/keepalive that re-syncs state periodically
4. For events: use Redis streams with consumer groups if persistence is critical
5. Document pub/sub limitations for the team
6. Test with process restart — verify clients recover state within acceptable time

### Detection Checklist
- [ ] No feature depends on 100% delivery of pub/sub messages
- [ ] Clients have periodic state refresh to recover missed events
- [ ] Presence state includes heartbeat/reconciliation mechanism
- [ ] Documentation notes pub/sub fire-and-forget semantics
- [ ] Process restart test shows graceful recovery (no data loss incidents)
- [ ] Redis streams used instead of pub/sub if persistence is required

### Related Rules
- enable-redis-pubsub-for-multi-process

### Related Skills
- Scale Reverb via Multiple Processes

### Related Decision Trees
- Vertical vs Horizontal Scaling for Reverb
