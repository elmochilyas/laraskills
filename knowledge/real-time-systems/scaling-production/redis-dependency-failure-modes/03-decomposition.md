# Decomposition: Redis Dependency Failure Modes

## Topic Overview
Redis is a critical dependency for Reverb horizontal scaling, presence channel state, and the queue system that powers broadcast dispatch. A Redis outage cascades into complete broadcasting failure: queue workers cannot process broadcast jobs, Reverb instances cannot coordinate cross-instance events, and presence channel state is lost. Understanding Redis failure modes—network partitions, OOM conditions, failover events, and pub/sub limitations—is essential for operating reliable real-tim...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
scaling-production-architecture/K34-redis-dependency-failure-modes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Redis Dependency Failure Modes
- **Purpose:** Redis is a critical dependency for Reverb horizontal scaling, presence channel state, and the queue system that powers broadcast dispatch. A Redis outage cascades into complete broadcasting failure: queue workers cannot process broadcast jobs, Reverb instances cannot coordinate cross-instance events, and presence channel state is lost. Understanding Redis failure modes—network partitions, OOM conditions, failover events, and pub/sub limitations—is essential for operating reliable real-tim...
- **Difficulty:** Advanced
- **Dependencies:
  - K04: Reverb Horizontal Scaling via Redis
  - K13: Presence Channels & Online User Tracking
  - K25: CVE-2026-23524 (Reverb Redis Deserialization)
  - K15: Reconnection Strategies & Storm Mitigation

## Dependency Graph
**Depends on:**
  - K04: Reverb Horizontal Scaling via Redis
  - K13: Presence Channels & Online User Tracking
  - K25: CVE-2026-23524 (Reverb Redis Deserialization)
  - K15: Reconnection Strategies & Storm Mitigation

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Redis Sentinel/Cluster for HA**: Automatic failover when the primary Redis node fails**Database scaling driver (Laravel 13)**: Removes Redis dependency for Reverb scaling in single-server deployments**Graceful degradation**: Fallback behavior when Redis is unavailable (e.g., log errors, return cached data)**Connection retry with backoff**: Reverb and queue workers should retry Redis connections with exponential backoff**Separate Redis instances**: Isolate Reverb pub/sub Redis from cache/queue Redis to limit blast radius**Redis as single point of truth for presence**: Presence state is not persisted in the database; Redis loss means state loss**Pub/sub fire-and-forget**: Redis pub/sub does not persist messages; if a Reverb instance is disconnected, it misses messages published during that window**Queue persistence via Redis**: Broadcast event queue jobs in Redis survive Redis restarts only if RDB/AOF persistence is configured**Database driver simplifies but limits**: Laravel 13's database scaling driver removes Redis dependency but prevents horizontal scaling across hosts**Redis HA adds complexity**: Sentinel/Cluster configuration requires additional infrastructure and operational expertise**Persistence vs. performance**: Redis RDB/AOF persistence adds overhead but enables queue state recovery after restart**Shared vs. dedicated Redis**: Shared Redis (one instance for cache, queue, session, pub/sub) risks cross-contention; dedicated instances add costRedis pub/sub latency: sub-millisecond in same datacenter, 1-5ms across availability zonesRedis connection limits: Each Reverb instance uses two Redis connections (subscribe + publish)Network bandwidth: High-throughput pub/sub scenarios (10k+ msg/s) consume Redis network I/OMemory usage: Presence channel membership data grows with concurrent connections; set TTLs aggressivelyQueue performance: Redis-based queue throughput depends on list operations (LPUSH/BRPOP) which are O(1)Use a dedicated Redis instance or cluster for Reverb pub/sub—separate from cache and queue RedisConfigure Redis with `maxmemory-policy allkeys-lru` or `noeviction` depending on use caseEnable Redis AOF persistence for queue data that must survive restartsMonitor Redis memory usage, connected clients, and pub/sub message rateConfigure Redis authentication (`requirepass`) and network isolation (bind to internal IP, firewall)Set connection timeouts and retry configurations in Reverb and queue worker Redis connectionsPlan for Redis failover: Reverb's connection to Redis will drop during failover; auto-reconnect should restore operationUsing the same Redis instance for cache, queue, session, and Reverb pub/sub (contention under load)Not configuring Redis persistence for queue data (all queued jobs lost on Redis restart)Running Redis without authentication and network isolation (security risk; CVE-2026-23524)Assuming Redis pub/sub is reliable (messages are lost if subscribers are disconnected)Not monitoring Redis memory usage (OOM evictions can delete queue data and presence state)Forgetting to set TTL on presence channel member keys (unbounded Redis memory growth)**Redis OOM**: `maxmemory` reached; eviction policy removes keys (potentially queue jobs, presence state)**Network partition**: Reverb loses connection to Redis; becomes an island (cannot receive events from other instances)**Sentinel failover**: Primary Redis fails; Sentinel promotes replica; brief write interruption affects queue and presence**Pub/sub subscriber disconnect**: If Reverb's subscribe connection drops, it misses all messages until it reconnects and re-subscribes**Slow Redis commands**: `SMEMBERS` on large presence channels (>10k members) blocks the event loop**RDB/disk persistence failure**: Redis fork plus dump on disk may cause latency spikes under memory pressureRequired for Reverb horizontal scaling across multiple serversStandard queue backend for broadcast event processingPrimary store for presence channel membership stateCache backend for authorization decisions (optional but recommended)Alternative: Database scaling driver (Laravel 13+) for single-server deployments without RedisK04: Reverb Horizontal Scaling via RedisK13: Presence Channels & Online User TrackingK25: CVE-2026-23524 (Reverb Redis Deserialization)K15: Reconnection Strategies & Storm Mitigation

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