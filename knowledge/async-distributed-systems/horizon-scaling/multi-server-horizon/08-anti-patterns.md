---
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: K049 — Multi-Server Horizon Deployment
Knowledge ID: K049
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Assuming Cross-Server Auto-Balancing | Architecture | High |
| 2 | Asymmetric Config Without Documentation | Operations | Critical |
| 3 | No Capacity Monitoring After Server Failure | Operations | High |
| 4 | Skipping `horizon:terminate` on Some Servers | Operations | Critical |
| 5 | Single Redis Connection Pool Exhaustion | Operations | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Cross-Server Balancing Expectation | High — both servers scale up simultaneously | Each server balances independently, plan capacity accordingly |
| Config Drift Between Servers | Critical — some queues stop processing | CI/CD symmetric config across all servers |
| Missing Server Failure Alerts | High — capacity halved silently | Monitor per-server worker counts globally |

---

## 1. Assuming Cross-Server Auto-Balancing

### Category
Architecture

### Description
Expecting Horizon's auto-balancing to distribute workers across multiple servers. Each server's auto-balancer operates independently — both servers may scale up for the same queue simultaneously, or both may ignore a queue, but there is no coordination between them.

### Why It Happens
- "Balancing" implies global optimization across all workers
- Not reading that balancing is per-server
- Single-server Horizon experience doesn't surface this limitation
- Assuming a distributed system coordinates load across nodes
- Not testing multi-server behavior under load

### Warning Signs
- Both servers spike to `maxProcesses` simultaneously for the same queue
- Total worker count exceeds expected (2× maxProcesses)
- One server idles while the other is overloaded
- Auto-scaling group adds a server but doesn't reduce load on existing servers
- Dashboard shows per-server worker counts independently

### Why Harmful
A webhook burst hits both servers simultaneously — both auto-balancers detect high wait time and scale to `maxProcesses`. Total workers = 2× maxProcesses, potentially exhausting server resources or overwhelming downstream APIs. Each server's balancer thinks it needs 20 workers, but the system only needs 20 total — now there are 40 workers contending for resources and hammering downstream services.

### Consequences
- Server resource oversubscription (both servers at maximum)
- Downstream API rate limits hit (double the expected workers)
- No load sharing — one server handles the burst, the other remains underutilized
- Capacity planning is complex (must account for independent balancing)
- Operators confused: "I thought auto-scaling would distribute the load"

### Alternative
- Accept per-server balancing and plan capacity accordingly:
  - Total capacity = sum of all servers' maxProcesses
  - Design each server to handle peak load independently if needed
  - Use symmetric config so any server can absorb any queue's load
- Or partition queues across servers explicitly (less flexible but predictable)

### Refactoring Strategy
1. Document that balancing is per-server
2. Calculate total worker capacity as sum of all servers
3. Set `maxProcesses` per server assuming worst case: all servers scale to max
4. If downstream API limits are a concern, reduce per-server `maxProcesses`
5. Monitor per-server worker counts to verify independent behavior

### Detection Checklist
- [ ] Team understands balancing is per-server
- [ ] Total capacity calculated as sum of all servers' maxProcesses
- [ ] No expectation of cross-server load sharing
- [ ] Downstream API rate limits account for 2× maxProcesses
- [ ] Capacity planning reflects independent per-server balancing

### Related Rules
- expect-per-server-auto-balancing

### Related Skills
- Deploy Multi-Server Horizon

### Related Decision Trees
- Single-Server vs Multi-Server Horizon

---

## 2. Asymmetric Config Without Documentation

### Category
Operations

### Description
Running different supervisor configurations on different servers without documenting the asymmetry. Server A processes webhooks and emails, Server B processes reports — when Server A fails, webhooks and emails stop processing silently because only Server A had that configuration.

### Why It Happens
- Intentional optimization: "Server A is better for webhooks, Server B for reports"
- Not considering the failure scenario
- Assuming each server's config is known to the team
- No documentation of which queues run on which servers
- Config drift over time as different servers get different changes

### Warning Signs
- Different `config/horizon.php` files on different servers
- Some queues only defined on specific servers
- No documentation explaining why servers have different configs
- Server A goes down — certain queues stop processing with no alert
- On-call team doesn't know which queues are on which servers

### Why Harmful
Server A (webhooks + emails) crashes — emails still process on Server B, but webhooks stop completely. The ops team doesn't notice because Server A appears in the dashboard as "offline" but no alert fires for the stopped webhook queue. Jobs accumulate on the webhook queue for hours until someone notices Server A is down. Without documentation, the recovery steps aren't clear — should webhooks be started on Server B, or is Server A expected to come back?

### Consequences
- Server failure causes silent queue processing halt
- Hours of backlog for queues that only run on the failed server
- Emergency debugging: "why are webhooks not processing?"
- Manual intervention required to start missing queues on remaining servers
- Business impact from delayed webhook processing

### Alternative
- Use symmetric config by default:
  ```php
  // Same config on all servers — any server can handle any queue
  ```
- If asymmetric config is necessary:
  - Document which queues run on which servers
  - Add monitoring: alert if a queue has zero workers across all servers
  - Implement failover: if server A is down, start its queues on server B
  - Use orchestration (Kubernetes, HashiCorp Nomad) to manage dynamic queue assignment

### Refactoring Strategy
1. Audit current server configs for asymmetry
2. Prefer symmetric config — migrate all servers to the same config
3. If asymmetry is required, document it clearly
4. Add monitoring for per-queue processing status
5. Test server failure scenario: confirm queues continue processing
6. Add alert: any queue with zero workers for > 1 minute

### Detection Checklist
- [ ] All servers have same config (symmetric) by default
- [ ] If asymmetric, asymmetry is documented
- [ ] Server failure doesn't stop any queue entirely
- [ ] Monitoring alerts if a queue has zero workers
- [ ] Fallback plan for server failure

### Related Rules
- use-symmetric-config-across-servers

### Related Skills
- Deploy Multi-Server Horizon

### Related Decision Trees
- Single-Server vs Multi-Server Horizon

---

## 3. No Capacity Monitoring After Server Failure

### Category
Operations

### Description
Not monitoring per-server worker availability in a multi-server Horizon deployment. When one server fails, the remaining servers continue processing but with reduced capacity — the reduction goes unnoticed until the queue backlog becomes visible.

### Why It Happens
- Dashboard continues to show "queues are processing" (they are, just slower)
- Not monitoring per-server supervisor counts
- Assuming server failure would cause an obvious outage
- No alerting for "worker count dropped"
- Not tracking total available worker capacity

### Warning Signs
- Server A crashes — no alert fires
- Queue processing continues but slows down
- Wait time increases gradually over hours
- Queue backlog grows undetected until it's visible in the dashboard
- On-call discovers the failure hours later during a separate investigation

### Why Harmful
Server A crashes at 2 AM — capacity drops by 50% but processing continues on Server B. The wait time increases but not dramatically enough to trigger alerts. By morning, the queue has 2 hours of backlog. The on-call team discovers the issue during a daily standup. A 50% capacity reduction went undetected for 6 hours, causing delayed processing for all queues.

### Consequences
- 2-6 hours of undetected capacity reduction
- Queue backlog built up during the failure window
- Delayed processing affects user-facing features
- SLA violations for time-sensitive jobs
- Emergency recovery: bring up replacement server, drain backlog
- Post-mortem: "why didn't we know Server A was down?"

### Alternative
- Monitor per-server worker counts via Horizon dashboard
- Set alerts for:
  - Any server not reporting for > 5 minutes
  - Total available workers < expected count
  - Queue processing rate drops below threshold
- Use orchestration (auto-scaling group, container orchestration) to auto-replace failed servers

### Refactoring Strategy
1. Set up monitoring for per-server Horizon supervisor presence
2. Configure alert: any server missing for > 5 minutes
3. Configure alert: total worker capacity < expected (servers × minProcesses)
4. Implement auto-replacement for failed servers (auto-scaling group)
5. Test server failure: verify alert fires within 5 minutes

### Detection Checklist
- [ ] Per-server supervisor presence monitored
- [ ] Alert fires when a server fails
- [ ] Total worker capacity tracked and alerted
- [ ] Auto-replacement for failed servers
- [ ] Queue backlog recovery plan in place

### Related Rules
- use-symmetric-config-across-servers

### Related Skills
- Deploy Multi-Server Horizon

### Related Decision Trees
- Single-Server vs Multi-Server Horizon

---

## 4. Skipping `horizon:terminate` on Some Servers

### Category
Operations

### Description
During a deployment, running `horizon:terminate` on only a subset of servers. The terminated servers restart with new code, while the others continue running old code indefinitely — creating a mixed-version processing environment.

### Why It Happens
- Assuming one global termination stops all servers (there is no global command)
- Deploy script only runs `horizon:terminate` on a single server
- Not knowing multi-server deployments require per-server termination
- Rolling update scripts that miss some servers
- Manual termination: "I'll terminate Server A and B, but C can wait" — never gets to C

### Warning Signs
- Some workers show old start times after a deploy
- Inconsistent job behavior: some jobs process with new code, some with old
- Server list in Horizon dashboard shows mixed worker start times
- Deploy script iterates only over a subset of servers
- "I terminated Horizon" but only one server restarted

### Why Harmful
Only Server A is terminated — it restarts with new code. Server B and C continue running old code. Some jobs run the old logic, some run the new logic — inconsistent behavior and hard-to-debug side effects. A bug fix for a queue job is deployed but some jobs still exhibit the buggy behavior. A breaking change to job data format causes failures on old workers processing new-format jobs.

### Consequences
- Inconsistent processing: same job type runs different code on different servers
- Bug fixes partially applied — some jobs still show the bug
- Data format incompatibility: new-format jobs fail on old workers
- Debugging nightmare: "the fix is deployed but it's not working"
- Rollback is unclear: should all servers be rolled back or just the terminated ones?

### Alternative
- Run `horizon:terminate` across ALL servers during every deployment:
  ```bash
  # Rolling restart across all servers
  for server in server-a server-b server-c; do
      ssh "$server" "php artisan horizon:terminate"
      sleep 10  # Wait for restart
  done
  ```
- Use deployment orchestration that tracks all servers

### Refactoring Strategy
1. Update deployment script to iterate over ALL Horizon servers
2. Implement rolling restart: terminate one server at a time, wait for restart
3. Verify after deploy: all servers show worker start times after deploy timestamp
4. Add post-deploy check: compare worker start times across all servers
5. Document multi-server deployment procedure

### Detection Checklist
- [ ] Deployment terminates Horizon on ALL servers
- [ ] Rolling restart pattern used (sequential, not simultaneous)
- [ ] Worker start times are consistent across all servers after deploy
- [ ] Post-deploy verification confirms all servers on new code
- [ ] Deployment script tracks all servers in the cluster

### Related Rules
- rolling-restart-all-servers

### Related Skills
- Deploy Multi-Server Horizon

### Related Decision Trees
- Single-Server vs Multi-Server Horizon

---

## 5. Single Redis Connection Pool Exhaustion

### Category
Operations

### Description
Adding Horizon servers and workers without accounting for Redis `maxclients`. Each worker process maintains a Redis connection — as servers are added, the total connection count multiplies until it exceeds Redis's configured limit.

### Why It Happens
- Not knowing each worker needs a dedicated Redis connection
- Focusing on per-server resource planning without considering shared Redis
- Not monitoring Redis connection count
- Copying single-server Horizon config without adjusting for multi-server
- Adding servers reactively (scaling up) without Redis capacity check

### Warning Signs
- Redis reaches `maxclients` during peak hours
- New Horizon workers fail to connect to Redis
- Intermittent "Cannot connect to Redis" errors in Horizon logs
- Redis connection count increases linearly with servers × workers
- Horizon status shows some workers as "inactive" (failed to connect to Redis)

### Why Harmful
The 5th server's Horizon master starts, using 80 of 100 Redis connections. When workers try to connect, Redis rejects them — the server's workers start failing. Half of the new server's capacity is unavailable, but no clear error (workers silently fail to connect). The ops team thinks they've added 5 workers but only 2 are actually connected. Queue processing doesn't improve as expected, leading to more server adds — making the problem worse.

### Consequences
- Workers fail to start without clear error messages
- Added server capacity is partially available (some workers can't connect)
- Unexpected queue backlog despite adding servers
- Redis rejects legitimate connections from other services
- Debugging is confusing: "we added servers but throughput didn't increase"
- Emergency Redis restart may be needed (drops all connections, services reconnect)

### Alternative
- Calculate total connection budget:
  ```
  total_connections = (servers × workers_per_server) + servers (master) + other_services
  ```
- Set Redis `maxclients` with headroom above the budget
- Monitor Redis connection count — alert if approaching `maxclients`
- Use connection pooling or reduce per-worker connection requirements

### Refactoring Strategy
1. Calculate current and planned connection count
2. Check Redis `maxclients` (default 10,000 — may be lower in managed Redis)
3. Increase `maxclients` if needed
4. Add monitoring: Redis connection count alert at 80% of `maxclients`
5. Plan server additions with Redis connection budget

### Detection Checklist
- [ ] Redis connection budget calculated
- [ ] Redis `maxclients` set above total connection budget
- [ ] Redis connection count monitored
- [ ] Alert at 80% of `maxclients`
- [ ] Server scaling plan includes connection budget

### Related Rules
- monitor-global-redis-connections

### Related Skills
- Deploy Multi-Server Horizon

### Related Decision Trees
- Single-Server vs Multi-Server Horizon
