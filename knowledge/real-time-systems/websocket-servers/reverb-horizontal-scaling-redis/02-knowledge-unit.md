# Metadata
Domain: Real-Time Systems
Subdomain: WebSocket Servers
Knowledge Unit: Reverb Horizontal Scaling via Redis
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
Horizontal scaling for Reverb uses Redis pub/sub to coordinate multiple Reverb server instances. When one Reverb instance broadcasts an event, it publishes the message to a Redis channel. All other Reverb instances subscribed to that Redis channel receive the event and forward it to their locally connected clients. This enables an elastic pool of Reverb servers behind a load balancer. Configuration requires `REVERB_SCALING_ENABLED=true`, a shared Redis server accessible to all Reverb instances, and sticky sessions on the load balancer. Laravel 13 introduced a database-based scaling driver as an alternative for single-server multi-process coordination, but Redis remains the standard for true horizontal scaling across hosts.

## Core Concepts
Reverb scaling is built on the pub/sub pattern: Reverb instances publish messages to Redis channels and subscribe to receive messages from other instances. The Redis server acts as a message bus—it does not store messages (pub/sub is fire-and-forget). Each Reverb instance maintains its own set of WebSocket connections. A client connects to one Reverb instance and stays pinned to it. When a broadcast event occurs, it reaches Reverb through the queue worker (running on the app server), is published to Redis, and fanned out to all Reverb instances.

## Mental Models
Redis pub/sub is a loudspeaker: one Reverb instance speaks, all other instances hear it simultaneously. Each instance then repeats the message to its own audience of connected clients. The load balancer is a receptionist that directs each WebSocket client to a specific instance and remembers where it sent them (sticky sessions).

## Internal Mechanics
Reverb uses the `Predis` or `phpredis` client to connect to Redis. When scaling is enabled, the Reverb `Server` instance creates a `RedisPublishSubscribeListener` that subscribes to the configured Redis channel (default: `reverb`). When a broadcast event arrives at one Reverb instance (either from a Laravel queue worker or a client-triggered event), the instance publishes the serialized message to Redis. Redis fans out the message to all subscribers. Each subscriber deserializes the message and writes it to the corresponding WebSocket connection if the client is subscribed to that channel. The `REVERB_SCALING_CHANNEL` env var controls the Redis channel name, allowing multiple Reverb clusters to share a single Redis instance without collision.

## Patterns
- **Pub/sub fan-out**: One publisher, many receivers—the standard horizontal scaling pattern
- **Stateless Reverb nodes**: Each instance holds only local connection state; shared state lives in Redis
- **Load balancer with sticky sessions**: Ensures client reconnects land on the same Reverb instance
- **Dedicated Redis instance**: Production scaling requires a dedicated (not shared) Redis server for pub/sub to avoid queue competition

## Architectural Decisions
- **Redis pub/sub over Redis Streams**: Pub/sub is fire-and-forget, matching the ephemeral nature of broadcast events; Streams would add persistence overhead
- **No connection migration**: Clients are pinned to their initial Reverb instance; no cross-node connection handoff
- **Separate scaling channel**: The configurable channel name prevents cross-environment message leaking (staging vs production)
- **Synchronous fan-out**: Reverb blocks on Redis publish—this is acceptable because the fan-out is fast (<1ms)

## Tradeoffs
- **Redis dependency**: Horizontal scaling cannot work without Redis; if Redis goes down, cross-instance broadcasting stops
- **Sticky session requirement**: Load balancers must support session affinity (IP hash, cookie-based); round-robin alone breaks reconnection
- **No message persistence**: Redis pub/sub drops messages if a subscriber is temporarily disconnected; new or reconnecting instances miss messages published during downtime
- **Increased latency**: Each broadcast event incurs a Redis round-trip (typically 1-5ms) before reaching remote clients
- **Configuration complexity**: More moving parts than a single-server setup—Redis, load balancer, multiple Reverb processes

## Performance Considerations
- Redis pub/sub adds ~1-5ms latency per broadcast event in the same datacenter
- Redis throughput must accommodate peak message rates; benchmark with `redis-benchmark` pub/sub tests
- Network latency between Reverb instances and Redis is critical—deploy in the same VPC/region
- `phpredis` extension is 2-3x faster than `Predis` for pub/sub; use it in production
- Each Reverb instance consumes a Redis connection for subscribing—monitor Redis maxclients

## Production Considerations
- Use a dedicated Redis instance or cluster for Reverb scaling (do not share with cache/queue Redis)
- Deploy Redis with replication (sentinel or cluster) for high availability
- Set `REVERB_SCALING_CHANNEL` to a unique value per environment
- Configure load balancer with `ip_hash` or cookie-based sticky sessions (Nginx, HAProxy, AWS ALB)
- Monitor Redis memory, connections, and pub/sub message rate
- Test reconnection behavior during a Reverb instance failure—clients should reconnect to remaining instances
- For Laravel 13+, evaluate the database scaling driver for simpler single-server multi-process setups

## Common Mistakes
- Using the same Redis instance for queue, cache, session, and Reverb pub/sub (contention and memory pressure)
- Forgetting sticky sessions on the load balancer (reconnecting clients go to different instances and miss private channel messages)
- Setting `REVERB_SCALING_ENABLED=false` while running multiple Reverb instances (events don't cross instances)
- Using `Predis` in production when `phpredis` would provide better performance
- Not configuring Redis authentication and network isolation (security risk, CVE-2026-23524)

## Failure Modes
- **Redis pub/sub disconnect**: A network blip disconnects a Reverb instance from Redis; it becomes isolated, missing all cross-instance events
- **Reconnection storm**: Multiple Reverb instances restart simultaneously, each reconnecting to Redis and triggering thundering herd
- **Redis OOM**: Redis reaches `maxmemory` and evicts keys or rejects connections, disrupting scaling
- **Load balancer session loss**: Sticky session cookie expires or is dropped, client reconnects to wrong instance
- **Split-brain**: Network partition separates Reverb instances; each group only receives events published within its partition

## Ecosystem Usage
- Required for multi-server Reverb deployments beyond single-instance capacity
- Used in Kubernetes deployments with multiple Reverb pods behind a service
- Common in Laravel Cloud's managed Reverb infrastructure (auto-scaling clusters)
- Integration with Redis Sentinel or ElastiCache for production Redis HA

## Related Knowledge Units
- K03: Reverb Installation & Configuration
- K05: Reverb Connection Lifecycle & State Management
- K14: Sticky Sessions & Load Balancing for WebSocket
- K34: Redis Dependency & Failure Modes
- K33: Dedicated Reverb Fleet Architecture

## Research Notes
CVE-2026-23524 (fixed in Reverb v1.7.0) was a critical Redis deserialization vulnerability affecting scaled Reverb deployments—always update to the latest Reverb version. Laravel 13's database scaling driver (2026) provides an alternative for single-server multi-process setups but explicitly does not support horizontal scaling across hosts. The bubble.ro deep-dive (May 2026) noted that horizontal scaling remains non-trivial and recommends starting with a single Reverb instance before scaling out.
