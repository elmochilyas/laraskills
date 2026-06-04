# Metadata
Domain: Real-Time Systems
Subdomain: Scaling & Production Architecture
Knowledge Unit: Redis Dependency & Failure Modes
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
Redis is a critical dependency for Reverb horizontal scaling, presence channel state, and the queue system that powers broadcast dispatch. A Redis outage cascades into complete broadcasting failure: queue workers cannot process broadcast jobs, Reverb instances cannot coordinate cross-instance events, and presence channel state is lost. Understanding Redis failure modes—network partitions, OOM conditions, failover events, and pub/sub limitations—is essential for operating reliable real-time systems. Mitigation strategies include Redis high-availability setups (Sentinel, Cluster), connection resilience in Reverb, Laravel 13's database scaling driver as a Redis alternative, and graceful degradation patterns for when Redis is unavailable.

## Core Concepts
Redis serves multiple roles in a real-time Laravel architecture: (1) **Pub/sub backbone** for Reverb horizontal scaling—messages published to Redis channels are fanned out to all Reverb instances, (2) **Presence state store**—presence channel membership data lives in Redis, (3) **Queue backend**—broadcast events are queued in Redis for worker processing, (4) **Cache**—authorization decisions and session data may be cached in Redis. Each role has different failure characteristics: pub/sub is fire-and-forget (messages lost if no subscriber), presence state can be rebuilt from active connections, queue persistence depends on Redis durability configuration, and cache misses are recoverable via database fallback.

## Mental Models
Redis is the central nervous system connecting all parts of the real-time architecture. If it stops working, the limbs (Reverb, queue workers, presence) can't communicate. Laravel 13's database driver is like a backup nervous system for Reverb specifically, but the queue and cache dependencies remain on Redis.

## Internal Mechanics
Reverb uses the `phpredis` or `Predis` library to connect to Redis. For pub/sub, it creates a persistent subscription connection (SUBSCRIBE) and a publishing connection. The subscription connection blocks on Redis responses; when a message arrives, Reverb deserializes it and distributes to locally connected clients. For presence state, Reverb writes member data to Redis with TTL and reads member lists via SMEMBERS/SCARD. Redis sentinel handles automatic failover in high-availability configurations. Laravel's queue system uses Redis lists (for queues) and pub/sub (for queue worker notifications).

## Patterns
- **Redis Sentinel/Cluster for HA**: Automatic failover when the primary Redis node fails
- **Database scaling driver (Laravel 13)**: Removes Redis dependency for Reverb scaling in single-server deployments
- **Graceful degradation**: Fallback behavior when Redis is unavailable (e.g., log errors, return cached data)
- **Connection retry with backoff**: Reverb and queue workers should retry Redis connections with exponential backoff
- **Separate Redis instances**: Isolate Reverb pub/sub Redis from cache/queue Redis to limit blast radius

## Architectural Decisions
- **Redis as single point of truth for presence**: Presence state is not persisted in the database; Redis loss means state loss
- **Pub/sub fire-and-forget**: Redis pub/sub does not persist messages; if a Reverb instance is disconnected, it misses messages published during that window
- **Queue persistence via Redis**: Broadcast event queue jobs in Redis survive Redis restarts only if RDB/AOF persistence is configured

## Tradeoffs
- **Database driver simplifies but limits**: Laravel 13's database scaling driver removes Redis dependency but prevents horizontal scaling across hosts
- **Redis HA adds complexity**: Sentinel/Cluster configuration requires additional infrastructure and operational expertise
- **Persistence vs. performance**: Redis RDB/AOF persistence adds overhead but enables queue state recovery after restart
- **Shared vs. dedicated Redis**: Shared Redis (one instance for cache, queue, session, pub/sub) risks cross-contention; dedicated instances add cost

## Performance Considerations
- Redis pub/sub latency: sub-millisecond in same datacenter, 1-5ms across availability zones
- Redis connection limits: Each Reverb instance uses two Redis connections (subscribe + publish)
- Network bandwidth: High-throughput pub/sub scenarios (10k+ msg/s) consume Redis network I/O
- Memory usage: Presence channel membership data grows with concurrent connections; set TTLs aggressively
- Queue performance: Redis-based queue throughput depends on list operations (LPUSH/BRPOP) which are O(1)

## Production Considerations
- Use a dedicated Redis instance or cluster for Reverb pub/sub—separate from cache and queue Redis
- Configure Redis with `maxmemory-policy allkeys-lru` or `noeviction` depending on use case
- Enable Redis AOF persistence for queue data that must survive restarts
- Monitor Redis memory usage, connected clients, and pub/sub message rate
- Configure Redis authentication (`requirepass`) and network isolation (bind to internal IP, firewall)
- Set connection timeouts and retry configurations in Reverb and queue worker Redis connections
- Plan for Redis failover: Reverb's connection to Redis will drop during failover; auto-reconnect should restore operation

## Common Mistakes
- Using the same Redis instance for cache, queue, session, and Reverb pub/sub (contention under load)
- Not configuring Redis persistence for queue data (all queued jobs lost on Redis restart)
- Running Redis without authentication and network isolation (security risk; CVE-2026-23524)
- Assuming Redis pub/sub is reliable (messages are lost if subscribers are disconnected)
- Not monitoring Redis memory usage (OOM evictions can delete queue data and presence state)
- Forgetting to set TTL on presence channel member keys (unbounded Redis memory growth)

## Failure Modes
- **Redis OOM**: `maxmemory` reached; eviction policy removes keys (potentially queue jobs, presence state)
- **Network partition**: Reverb loses connection to Redis; becomes an island (cannot receive events from other instances)
- **Sentinel failover**: Primary Redis fails; Sentinel promotes replica; brief write interruption affects queue and presence
- **Pub/sub subscriber disconnect**: If Reverb's subscribe connection drops, it misses all messages until it reconnects and re-subscribes
- **Slow Redis commands**: `SMEMBERS` on large presence channels (>10k members) blocks the event loop
- **RDB/disk persistence failure**: Redis fork plus dump on disk may cause latency spikes under memory pressure

## Ecosystem Usage
- Required for Reverb horizontal scaling across multiple servers
- Standard queue backend for broadcast event processing
- Primary store for presence channel membership state
- Cache backend for authorization decisions (optional but recommended)
- Alternative: Database scaling driver (Laravel 13+) for single-server deployments without Redis

## Related Knowledge Units
- K04: Reverb Horizontal Scaling via Redis
- K13: Presence Channels & Online User Tracking
- K25: CVE-2026-23524 (Reverb Redis Deserialization)
- K15: Reconnection Strategies & Storm Mitigation

## Research Notes
CVE-2026-23524 (fixed in Reverb v1.7.0) highlighted the security risks of Redis deserialization in scaled Reverb deployments. Laravel 13's database scaling driver (2026) was a direct response to the operational complexity of Redis dependency for teams that don't need horizontal scaling. The recommended production architecture uses separate Redis instances for cache/queue vs. Reverb pub/sub. Redis Sentinel provides basic HA but has known limitations (split-brain during certain partition scenarios). Redis Cluster provides better scalability but adds configuration complexity. The trend in 2026 is toward reducing Redis dependency where possible, with the database scaling driver and managed services like Laravel Cloud offering Redis-free or Redis-transparent alternatives.
