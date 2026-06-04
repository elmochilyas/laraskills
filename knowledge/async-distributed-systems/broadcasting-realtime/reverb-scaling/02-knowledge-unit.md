# Metadata
Domain: Async & Distributed Systems
Subdomain: Broadcasting & Real-Time
Knowledge Unit: Reverb Scaling via Multiple Processes
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Reverb scales horizontally by running multiple independent processes, typically one per CPU core, behind a load balancer. Each process handles a subset of WebSocket connections. Inter-process communication for broadcasting and presence state is achieved via Redis pub/sub — when one process receives a broadcast event, it publishes to Redis, and all other subscribed processes receive and forward to their clients. This architecture enables near-linear scaling: doubling the processes doubles the concurrent connection capacity.

# Core Concepts
- **Process-per-core**: Each Reverb process is a single-threaded event loop. Optimal scaling is one process per CPU core.
- **Connection affinity**: A WebSocket client connects to one Reverb process and stays there. No connection migration.
- **Redis pub/sub**: Cross-process communication channel. When process A broadcasts, it pushes to Redis → Redis fan-outs to all subscribed processes → each forwards to its clients.
- **Sticky sessions**: Load balancer must route a client's WebSocket connections to the same Reverb process (sticky sessions / IP hash).
- **Linear scaling**: Connection capacity scales linearly with process count. Broadcast message capacity scales sub-linearly due to Redis pub/sub overhead.

# Mental Models
- **Restaurant with multiple waiters**: Each waiter (Reverb process) handles their own tables (WebSocket connections). When the kitchen (broadcast) sends a dish, the head chef (Redis pub/sub) tells all waiters, who deliver to their tables.
- **Concert hall with multiple speakers**: Each speaker covers a section of the audience. The sound system (Redis) sends the music to all speakers simultaneously. If one speaker goes out, only its section loses audio.

# Internal Mechanics
- Reverb processes subscribe to Redis channels on startup: `reverb:message` (broadcasts) and `reverb:presence` (presence state).
- When a broadcast event is dispatched from Laravel: HTTP request to Reverb's REST endpoint → receiving process broadcasts to its connections AND publishes to Redis.
- Other Reverb processes receive via Redis pub/sub → broadcast to their connections.
- Presence state: Join/leave events are also published to Redis so all processes maintain consistent presence state.
- For load balancing: Nginx with `ip_hash` or AWS ALB with stickiness ensures client affinity. Without stickiness, a client may reconnect to a different process and miss state.

# Patterns
## Nginx Round-Robin with IP Hash
- **Purpose**: Distribute connections across Reverb processes with client affinity.
- **Benefit**: Simple, no external load balancer needed.
- **Tradeoff**: IP hash may be uneven for users behind large NAT.

## Supervisor Multi-Process
- **Purpose**: Run multiple Reverb processes on the same server.
- **Benefit**: Uses all CPU cores; simple deployment.
- **Tradeoff**: Inter-process coordination via Redis required.

## Multi-Server Reverb
- **Purpose**: Scale across multiple machines.
- **Benefit**: Beyond single-server connection limits.
- **Tradeoff**: Higher latency for cross-server messages; more Redis traffic.

# Architectural Decisions
- **Scale up (single server, more processes) first**: Up to ~10K connections, a single server with multiple processes is simpler and cost-effective.
- **Scale out (multi-server) for >10K connections**: Multiple servers with load balancer. More complex but enables >100K connections.
- **Redis as the scaling bottleneck**: Redis pub/sub performance degrades with many subscribers (O(n) per message). Monitor Redis throughput.
- **Consider sticky-session-free design**: Use a shared state backend (Redis Cluster) instead of sticky sessions for simpler load balancer config.

# Tradeoffs
Single-process | Simple, no Redis needed | ~1K connection limit; no HA
Multi-process, single server | ~10K connections, uses all cores | Redis dependency; process coordination overhead
Multi-server | >10K connections, HA, fault tolerance | Complex; Redis pub/sub at scale; load balancer config

# Performance Considerations
- Each Redis pub/sub message is delivered to ALL processes. At 100 processes and 10K messages/sec, Redis handles 1M message deliveries/sec.
- Connection affinity means idle connections still occupy a process slot. With sticky load balancing, connections distribute but occupy per-process resources.
- Memory per-process scales with connections. A 4-server setup with 2000 connections each uses less per-server memory than 1 server with 8000 connections.
- Redis pub/sub is fire-and-forget. If a process is slow (event loop blocked), it may miss messages. There is no message replay.

# Production Considerations
- Supervisor `numprocs` = CPU cores. For a 4-core server, start 4 Reverb processes.
- Set Redis `maxclients` high enough for all Reverb processes + regular Redis usage.
- Monitor Redis pub/sub throughput. If Redis becomes a bottleneck, reduce process count or upgrade Redis.
- Load balancer health checks should check Reverb's internal health endpoint, not just TCP port.
- On process crash, clients on that process disconnect. Load balancer routes them to another process (if sticky) or any process (if non-sticky).
- Graceful scaling: To reduce processes, stop Reverb gradually. Clients reconnect to remaining processes.

# Common Mistakes
- **Not configuring sticky sessions**: Without stickiness, clients randomly reconnect to different processes on each page load. Presence state fragments.
- **Running more processes than CPU cores**: Each process is single-threaded. More processes than cores causes context switching overhead without throughput gain.
- **Not monitoring Redis pub/sub load**: At scale, Redis pub/sub can become the bottleneck. Monitor Redis CPU and message rate.
- **Assuming messages are durable**: Redis pub/sub is fire-and-forget. If a process is disconnected from Redis briefly, it misses messages.
- **Using Redis for both queue and Reverb pub/sub without monitoring**: Shared Redis instance — queue operations compete with Reverb pub/sub for Redis CPU and connections.

# Failure Modes
- **Redis pub/sub message loss**: If a Reverb process is disconnected from Redis during a broadcast, it never receives the message. Clients on that process don't see the event.
- **Uneven connection distribution**: With sticky sessions, some processes may accumulate more connections than others. Monitor connection counts per process.
- **Load balancer health check removing process**: If health check fails (even briefly), the process is removed from rotation. Clients on that process reconnect.
- **Redis queue blocks Reverb pub/sub**: If the same Redis instance handles both queue operations and Reverb pub/sub, queue operations can delay pub/sub delivery.
- **Network partition between Redis and some processes**: Some clients see events, others don't. Inconsistent state across connections.

# Ecosystem Usage
- **Laravel framework**: Reverb scaling documentation covers Supervisor multi-process and multi-server setups.
- **Laravel Forge**: Forge supports auto-scaling Reverb via worker daemon configuration.
- **FrankenPHP**: The underlying engine handles the event loop. Scaling is at the process level, not FrankenPHP level.

# Related Knowledge Units
- K031 Laravel Reverb (core architecture) | K034 Reverb Production Deployment (baseline)

## Research Notes
- Laravel Reverb (first-party WebSocket server) uses a custom protocol over PHP sockets, bypassing the need for Node.js or Pusher — it maintains persistent connections via the eact/promise async library.
- Reverb scales horizontally via a Redis pub/sub backend — each Reverb instance subscribes to all channels, and messages are broadcast across instances through Redis channels.
- Laravel Echo is the client-side JavaScript library that subscribes to channels and listens for events — v2 added native TypeScript support and a composable API for Vue/React integration.
- Channel types in Laravel Broadcasting (public, private, presence) each have distinct authorization approaches — private channels call an authorization callback, presence channels additionally broadcast a here and joining/leaving event.
- Reverb production deployment requires proper process management (Supervisor), SSL termination (Nginx/Caddy), and connection limits — each WebSocket connection consumes ~8KB of memory on the server.
- The broadcasting system overview from Laravel's perspective is a simple event-to-channel mapping — shouldBroadcast interface events are serialized and pushed to the configured broadcaster driver.
- Reverb's scaling characteristics depend on Redis throughput — a single Redis instance can support approximately 10,000 concurrent Reverb connections before saturation.
- Community benchmarks show Reverb outperforming Pusher for self-hosted deployments, with sub-50ms latency for message delivery across 2000+ concurrent connections on modest hardware.
