---
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: K081 — Redis Cluster Support in Horizon (v5.46+)
Knowledge ID: K081
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Using Redis Cluster Unnecessarily | Architecture | Medium |
| 2 | Cluster Without Hash Tags on Queue Keys | Configuration | Critical |
| 3 | Hash Tag Everything — Defeating Sharding | Performance | Medium |
| 4 | Not Testing Failover Behavior | Operations | Critical |
| 5 | No Fallback Plan (Cluster Only) | Architecture | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Premature Cluster Adoption | Medium — complexity for no benefit | Scale vertically first, only cluster when >10K jobs/sec |
| Missing Queue Key Hash Tags | Critical — BRPOP breaks in cluster | Always set `queue_key_hash_tag: true` |
| Untested Failover | Critical — workers hang on node failure | Test node failure in staging before production |
| No Cluster Fallback | High — stuck if Cluster has issues | Keep single Redis config as fallback |

---

## 1. Using Redis Cluster Unnecessarily

### Category
Architecture

### Description
Deploying Redis Cluster for Horizon when a single Redis instance (with replica) would suffice. Cluster adds significant complexity — `BRPOP` limitations, cross-slot constraints, configuration complexity — for applications that process <10K jobs per second.

### Why It Happens
- "Cluster sounds more production-ready"
- Assuming Cluster is the default/recommended Redis topology
- Not understanding that single Redis with replica handles most workloads
- Migrating to Cluster for HA (should use Sentinel for pure HA)
- Following a blog post about "production Redis" without evaluating needs

### Warning Signs
- Redis Cluster deployed for an application processing <1K jobs/sec
- Team struggles with `BRPOP` errors but never had throughput issues
- No performance monitoring data showing single Redis was insufficient
- "We need Redis Cluster for HA" — Sentinel would suffice
- Redis Cluster troubleshooting consumes significant engineering time

### Why Harmful
The team spends weeks debugging `BRPOP` MOVED errors, cross-slot `MULTI` failures, and failover reconnection issues — all for a system processing 100 jobs/second that a single Redis instance handles easily. Single Redis with replica provides HA, is simpler, fully compatible with Horizon, and requires no special configuration. The Cluster complexity is entirely wasted.

### Consequences
- Weeks of engineering time debugging Cluster-specific issues
- Workers hang indefinitely from `BRPOP` failures
- Emergency rollback to single Redis (if fallback exists)
- Ongoing operational complexity: more nodes to monitor, more failure modes
- Delayed feature development (team stuck on infrastructure issues)
- Increased infrastructure cost (multiple Redis nodes)

### Alternative
- Start with single Redis with replica:
  ```php
  // config/database.php
  'redis' => [
      'client' => 'phpredis',
      'default' => [
          'host' => env('REDIS_HOST', '127.0.0.1'),
          'port' => env('REDIS_PORT', 6379),
      ],
  ],
  ```
- Only migrate to Cluster when single Redis throughput is insufficient (>10K jobs/sec, >100K connections)

### Refactoring Strategy
1. Evaluate actual throughput: jobs/sec, Redis ops/sec, connection count
2. If below 10K jobs/sec, simplify: single Redis with replica
3. If HA is needed: use Redis Sentinel (not Cluster)
4. Migrate back to single Redis configuration
5. Document the decision: "Cluster only when >10K jobs/sec"

### Detection Checklist
- [ ] Throughput justifies Cluster (>10K jobs/sec)
- [ ] Single Redis with replica considered and found insufficient
- [ ] No ongoing Cluster-related issues (BRPOP, cross-slot errors)
- [ ] Team has Redis Cluster operational expertise
- [ ] Cluster adoption is justified by data, not assumption

### Related Rules
- prefer-single-redis-over-cluster

### Related Skills
- Configure Redis Cluster Support in Horizon

### Related Decision Trees
- Redis Cluster vs Single Redis for Horizon

---

## 2. Cluster Without Hash Tags on Queue Keys

### Category
Configuration

### Description
Using Redis Cluster for Horizon without setting `queue_key_hash_tag: true`. Queue keys (e.g., `queues:default`) don't have the `{horizon}` hash tag, so they may land on any cluster node — `BRPOP` connects to a single node and may not find the queue key.

### Why It Happens
- Not knowing about the `queue_key_hash_tag` configuration option
- Enabling Cluster mode but not updating Horizon config
- Assuming all Horizon keys use `{horizon}` hash tag (only internal keys do)
- Not testing `BRPOP` behavior in Cluster mode
- Missing the `queue_key_hash_tag` in the Horizon configuration documentation

### Warning Signs
- Horizon workers fail to pop jobs from the queue
- `MOVED` redirection errors in Horizon logs
- Workers hang indefinitely — no jobs processed
- Horizon starts but no workers process any jobs
- Error: "MOVED" or "Connection refused" for queue operations

### Why Harmful
`BRPOP` on `queues:default` connects to node A — but the queue key is on node B. Redis returns a `MOVED` redirection, but the phpredis/Predis driver may not handle it correctly for blocking operations, causing the worker to hang. No jobs are processed. No clear error is raised — the worker just blocks forever. The queue system appears to be running (no crashes) but nothing is happening.

### Consequences
- Complete queue processing halt — no jobs processed
- Workers hang with no error output
- Silent failure: Horizon appears running, dashboard may still load
- Emergency debugging: "nothing is being processed but no errors"
- Crisis rollback to single Redis or addition of hash tag config

### Alternative
- Always set `queue_key_hash_tag: true` when using Redis Cluster:
  ```php
  // config/horizon.php
  'queue_key_hash_tag' => true, // Wraps queue keys in {horizon}
  ```
- This wraps queue keys in `{horizon}` hash tag, ensuring they route to the same slot as Horizon internal keys
- Test `BRPOP` in staging with Cluster configuration

### Refactoring Strategy
1. Add `'queue_key_hash_tag' => true` to `config/horizon.php`
2. Restart Horizon on all servers
3. Verify workers can now pop and process jobs
4. Monitor for `MOVED` errors — should be zero
5. Test in staging: simulate Cluster config, verify BRPOP works

### Detection Checklist
- [ ] `queue_key_hash_tag: true` set in Horizon config
- [ ] Queue keys use `{horizon}` hash tag (check Redis key pattern)
- [ ] No `MOVED` errors in Horizon logs
- [ ] Workers process jobs without issues
- [ ] `BRPOP` tested with Cluster configuration

### Related Rules
- enable-queue-key-hash-tag

### Related Skills
- Configure Redis Cluster Support in Horizon

### Related Decision Trees
- Redis Cluster vs Single Redis for Horizon

---

## 3. Hash Tag Everything — Defeating Sharding

### Category
Performance

### Description
Using `{horizon}` hash tag on all Redis keys in the Cluster, concentrating all data on a single Cluster node. The hash tag forces all keys to route to the same slot — defeating the purpose of sharding across multiple Cluster nodes.

### Why It Happens
- Applying `queue_key_hash_tag: true` broadly without understanding
- Extending hash tag usage to non-Horizon keys (cache, sessions)
- Assuming hash tags are always good for consistency
- Not monitoring key distribution across Cluster nodes
- Focus on avoiding cross-slot errors without considering sharding

### Warning Signs
- All Horizon keys show `{horizon}` prefix
- One Cluster node handles 90%+ of Horizon-related requests
- Other Cluster nodes are idle for Horizon traffic
- Redis node CPU usage is asymmetric (one node at 80%, others at 10%)
- Adding Cluster nodes doesn't improve Horizon throughput

### Why Harmful
All Horizon keys (metrics, tags, queues, locks, supervisors) are concentrated on a single Cluster node. The other 5 nodes in the 6-node cluster are unused for Horizon workloads. The system has no sharding benefit — it's effectively a single-node Redis with Cluster overhead. When the overloaded node fails, Horizon loses access to all its data, not just a fraction.

### Consequences
- No performance benefit from Cluster (all load on one node)
- Asymmetric resource usage — one node overloaded, others idle
- Single node failure takes down all Horizon functionality
- Wasted infrastructure cost (paying for unused Cluster nodes)
- Horizontal scaling doesn't work for Horizon (limited by single node)

### Alternative
- Use hash tags only where necessary:
  - Horizon internal keys: use `{horizon}` (Horizon does this automatically)
  - Queue keys: use `{horizon}` (via `queue_key_hash_tag: true`)
  - Other keys: do NOT use hash tags — let Cluster distribute them
- Understand that Horizon will always be concentrated on one node (its keys share a hash tag) — this is acceptable because Horizon's data volume is small

### Refactoring Strategy
1. Audit all `{horizon}` hash tag usage
2. Limit `{horizon}` to Horizon keys only (internal + queues)
3. Remove hash tags from non-Horizon keys (cache, sessions)
4. Monitor key distribution across Cluster nodes
5. Accept that Horizon keys are concentrated — offset by small data volume

### Detection Checklist
- [ ] `{horizon}` hash tag limited to Horizon keys
- [ ] Non-Horizon keys distributed across Cluster nodes
- [ ] Cluster node load distribution is balanced (excluding Horizon keys)
- [ ] No performance issue from Horizon key concentration
- [ ] Adding Cluster nodes improves non-Horizon throughput

### Related Rules
- enable-queue-key-hash-tag

### Related Skills
- Configure Redis Cluster Support in Horizon

### Related Decision Trees
- Redis Cluster vs Single Redis for Horizon

---

## 4. Not Testing Failover Behavior

### Category
Operations

### Description
Deploying Redis Cluster for Horizon without testing what happens when a Cluster node fails. Unhandled failover can cause workers to hang, lose connections, or permanently stop processing.

### Why It Happens
- Assuming Redis Cluster handles failover transparently (it does for data, not for client connections)
- Not knowing Horizon workers use blocking `BRPOP` connections that break on failover
- No staging environment with Cluster configuration
- "We'll test it when it happens" — dangerously reactive
- Not reading Redis Cluster failover documentation

### Warning Signs
- Redis Cluster deployed to production without failover testing
- No staging environment replicating production Cluster configuration
- Team can't answer: "what happens when a Cluster node fails?"
- No runbook for Cluster node failure recovery
- Failure scenarios not included in disaster recovery plan

### Why Harmful
A Cluster node fails at 3 AM — workers connected to that node lose their `BRPOP` connection. The client library doesn't retry properly, workers hang, and queue processing stops until someone manually restarts Horizon. The data survives (replicated to other nodes), but the workers' connections are broken. Without failover testing, no one knows the manual restart procedure — the team discovers it by reading documentation while incident time ticks away.

### Consequences
- Complete queue processing halt during node failure
- Workers hang with no error output
- Extended downtime (30-60+ minutes) while team diagnoses
- Data not lost but processing stopped — backlog builds
- Manual recovery: restart Horizon on all servers
- Post-incident: "we should have tested this"

### Alternative
- Always test failover in staging:
  - Simulate node failure (restart Redis process or block network)
  - Verify workers reconnect within < 30 seconds
  - Verify no jobs lost or double-processed
  - Verify Horizon dashboard recovers
- Implement client-side reconnection handling if needed
- Document node failure recovery procedure

### Refactoring Strategy
1. Set up staging environment with Redis Cluster
2. Start Horizon workers processing test jobs
3. Kill one Redis Cluster node (SIGKILL)
4. Observe: workers should reconnect to replica or new master
5. Measure time to recover processing
6. If workers don't reconnect, fix client configuration
7. Document recovery procedure
8. Add failover test to pre-production checklist

### Detection Checklist
- [ ] Failover tested in staging before production
- [ ] Workers reconnect after node failure within 30 seconds
- [ ] No jobs lost during failover
- [ ] No jobs double-processed during failover
- [ ] Horizon dashboard recovers after failover
- [ ] Node failure recovery procedure documented

### Related Rules
- test-failover-behavior

### Related Skills
- Configure Redis Cluster Support in Horizon

### Related Decision Trees
- Redis Cluster vs Single Redis for Horizon

---

## 5. No Fallback Plan (Cluster Only)

### Category
Architecture

### Description
Deploying Redis Cluster without a fallback plan or ability to return to single Redis if Cluster encounters issues. When Cluster-specific problems arise (BRPOP hangs, cross-slot errors), there's no way to quickly restore service with single Redis.

### Why It Happens
- Full commitment to Cluster — no parallel configuration maintained
- Assuming Cluster is stable enough to never need fallback
- Not having infrastructure to run both Cluster and single Redis
- "We'll build the fallback if we need it" — never built
- Single Redis config not maintained in source control

### Warning Signs
- No single Redis configuration available in the codebase
- Switching from Cluster to single Redis requires a code change and deploy
- No documentation for how to run Horizon without Cluster
- Team doesn't know which Redis config changes are needed for single mode
- "If Cluster fails, we're stuck" — acknowledged risk accepted without mitigation

### Why Harmful
Redis Cluster encounters a critical issue (network partition, configuration error, software bug) — `BRPOP` stops working, jobs accumulate, and the queue system is down. There's no single Redis instance to fall back to. The team must:
1. Provision a single Redis instance
2. Update config files
3. Deploy new config
4. Restart Horizon
This takes 30-60 minutes during an active incident. If the single Redis config wasn't maintained, it may be out of date and require debugging.

### Consequences
- Extended downtime during Cluster issues (30-60 minutes)
- Manual recovery steps, cannot roll back
- Pressure to fix Cluster quickly (may cut corners)
- No safety valve — Cluster problems become crises
- Migrating away from Cluster requires full deployment cycle

### Alternative
- Maintain single Redis configuration alongside Cluster:
  - Keep a working single Redis instance available (or easy to provision)
  - Maintain fallback configuration in environment variables
  - Document fallback procedure step by step
  - Test fallback periodically (quarterly)
- Fallback config:
  ```php
  // config/horizon.php
  'queue_key_hash_tag' => env('HORIZON_QUEUE_HASH_TAG', false),
  
  // config/database.php — keep single Redis config too
  'redis' => [
      'client' => 'phpredis',
      'default' => [ /* single Redis config */ ],
      'clusters' => [ /* Cluster config */ ],
  ],
  ```

### Refactoring Strategy
1. Maintain a tested single Redis configuration in source control
2. Document fallback procedure: env changes → restart Horizon
3. Test fallback: run Horizon against single Redis for 1 hour in staging
4. Set up a single Redis instance (or ensure fast provisioning)
5. Schedule quarterly fallback testing

### Detection Checklist
- [ ] Single Redis fallback configuration maintained and tested
- [ ] Fallback procedure documented
- [ ] Single Redis instance available for fallback
- [ ] Fallback tested within the last 3 months
- [ ] Switching to fallback takes < 15 minutes
- [ ] Team knows the fallback procedure

### Related Rules
- prefer-single-redis-over-cluster

### Related Skills
- Configure Redis Cluster Support in Horizon

### Related Decision Trees
- Redis Cluster vs Single Redis for Horizon
