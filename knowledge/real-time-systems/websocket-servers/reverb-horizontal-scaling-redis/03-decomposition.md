# Decomposition: Reverb Horizontal Scaling Redis

## Topic Overview
Horizontal scaling for Reverb uses Redis pub/sub to coordinate multiple Reverb server instances. When one Reverb instance broadcasts an event, it publishes the message to a Redis channel. All other Reverb instances subscribed to that Redis channel receive the event and forward it to their locally connected clients. This enables an elastic pool of Reverb servers behind a load balancer. Configuration requires `REVERB_SCALING_ENABLED=true`, a shared Redis server accessible to all Reverb instance...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
websocket-servers/K04-reverb-horizontal-scaling-redis/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Reverb Horizontal Scaling Redis
- **Purpose:** Horizontal scaling for Reverb uses Redis pub/sub to coordinate multiple Reverb server instances. When one Reverb instance broadcasts an event, it publishes the message to a Redis channel. All other Reverb instances subscribed to that Redis channel receive the event and forward it to their locally connected clients. This enables an elastic pool of Reverb servers behind a load balancer. Configuration requires `REVERB_SCALING_ENABLED=true`, a shared Redis server accessible to all Reverb instance...
- **Difficulty:** Advanced
- **Dependencies:
  - K03: Reverb Installation & Configuration
  - K05: Reverb Connection Lifecycle & State Management
  - K14: Sticky Sessions & Load Balancing for WebSocket
  - K34: Redis Dependency & Failure Modes
  - K33: Dedicated Reverb Fleet Architecture

## Dependency Graph
**Depends on:**
  - K03: Reverb Installation & Configuration
  - K05: Reverb Connection Lifecycle & State Management
  - K14: Sticky Sessions & Load Balancing for WebSocket
  - K34: Redis Dependency & Failure Modes
  - K33: Dedicated Reverb Fleet Architecture

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Pub/sub fan-out**: One publisher, many receivers—the standard horizontal scaling pattern**Stateless Reverb nodes**: Each instance holds only local connection state; shared state lives in Redis**Load balancer with sticky sessions**: Ensures client reconnects land on the same Reverb instance**Dedicated Redis instance**: Production scaling requires a dedicated (not shared) Redis server for pub/sub to avoid queue competition**Redis pub/sub over Redis Streams**: Pub/sub is fire-and-forget, matching the ephemeral nature of broadcast events; Streams would add persistence overhead**No connection migration**: Clients are pinned to their initial Reverb instance; no cross-node connection handoff**Separate scaling channel**: The configurable channel name prevents cross-environment message leaking (staging vs production)**Synchronous fan-out**: Reverb blocks on Redis publish—this is acceptable because the fan-out is fast (<1ms)**Redis dependency**: Horizontal scaling cannot work without Redis; if Redis goes down, cross-instance broadcasting stops**Sticky session requirement**: Load balancers must support session affinity (IP hash, cookie-based); round-robin alone breaks reconnection**No message persistence**: Redis pub/sub drops messages if a subscriber is temporarily disconnected; new or reconnecting instances miss messages published during downtime**Increased latency**: Each broadcast event incurs a Redis round-trip (typically 1-5ms) before reaching remote clients**Configuration complexity**: More moving parts than a single-server setup—Redis, load balancer, multiple Reverb processesRedis pub/sub adds ~1-5ms latency per broadcast event in the same datacenterRedis throughput must accommodate peak message rates; benchmark with `redis-benchmark` pub/sub testsNetwork latency between Reverb instances and Redis is critical—deploy in the same VPC/region`phpredis` extension is 2-3x faster than `Predis` for pub/sub; use it in productionEach Reverb instance consumes a Redis connection for subscribing—monitor Redis maxclientsUse a dedicated Redis instance or cluster for Reverb scaling (do not share with cache/queue Redis)Deploy Redis with replication (sentinel or cluster) for high availabilitySet `REVERB_SCALING_CHANNEL` to a unique value per environmentConfigure load balancer with `ip_hash` or cookie-based sticky sessions (Nginx, HAProxy, AWS ALB)Monitor Redis memory, connections, and pub/sub message rateTest reconnection behavior during a Reverb instance failure—clients should reconnect to remaining instancesFor Laravel 13+, evaluate the database scaling driver for simpler single-server multi-process setupsUsing the same Redis instance for queue, cache, session, and Reverb pub/sub (contention and memory pressure)Forgetting sticky sessions on the load balancer (reconnecting clients go to different instances and miss private channel messages)Setting `REVERB_SCALING_ENABLED=false` while running multiple Reverb instances (events don't cross instances)Using `Predis` in production when `phpredis` would provide better performanceNot configuring Redis authentication and network isolation (security risk, CVE-2026-23524)**Redis pub/sub disconnect**: A network blip disconnects a Reverb instance from Redis; it becomes isolated, missing all cross-instance events**Reconnection storm**: Multiple Reverb instances restart simultaneously, each reconnecting to Redis and triggering thundering herd**Redis OOM**: Redis reaches `maxmemory` and evicts keys or rejects connections, disrupting scaling**Load balancer session loss**: Sticky session cookie expires or is dropped, client reconnects to wrong instance**Split-brain**: Network partition separates Reverb instances; each group only receives events published within its partitionRequired for multi-server Reverb deployments beyond single-instance capacityUsed in Kubernetes deployments with multiple Reverb pods behind a serviceCommon in Laravel Cloud's managed Reverb infrastructure (auto-scaling clusters)Integration with Redis Sentinel or ElastiCache for production Redis HAK03: Reverb Installation & ConfigurationK05: Reverb Connection Lifecycle & State ManagementK14: Sticky Sessions & Load Balancing for WebSocketK34: Redis Dependency & Failure ModesK33: Dedicated Reverb Fleet Architecture

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization