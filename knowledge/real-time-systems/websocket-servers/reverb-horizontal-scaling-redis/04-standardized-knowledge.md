# Standardized Knowledge: Reverb Horizontal Scaling via Redis

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | WebSocket Servers |
| Knowledge Unit ID | K04 |
| Title | Reverb Horizontal Scaling via Redis |
| Difficulty | Advanced |
| Dependencies | K03, K05, K14, K34, K33 |

## Overview
Horizontal scaling for Reverb uses Redis pub/sub to coordinate multiple Reverb server instances. When one Reverb instance broadcasts an event, it publishes the message to a Redis channel. All other Reverb instances subscribed to that Redis channel receive the event and forward it to their locally connected clients. This enables an elastic pool of Reverb servers behind a load balancer.

## Core Concepts
- Reverb scaling is built on the pub/sub pattern: instances publish messages to Redis channels and subscribe to receive messages from other instances
- Redis acts as a message bus—pub/sub is fire-and-forget (no message persistence)
- Each Reverb instance maintains its own set of WebSocket connections; clients are pinned to one instance
- Configuration requires `REVERB_SCALING_ENABLED=true`, shared Redis, and sticky sessions on the load balancer

## When To Use
- Multi-server Reverb deployments beyond single-instance capacity
- Kubernetes deployments with multiple Reverb pods behind a service
- Applications requiring high availability and elastic scaling
- Any deployment where a single Reverb instance cannot handle the connection load

## When NOT To Use
- Single-server deployments (use database scaling driver in Laravel 13+)
- Deployment where Redis reliability cannot be maintained (Redis is a single point of failure)
- Applications using managed WebSocket services (Pusher, Ably)

## Best Practices (Why)
- **Use a dedicated Redis instance for Reverb scaling**: Do not share with cache/queue Redis to prevent contention and limit blast radius
- **Use `phpredis` extension over `Predis`**: `phpredis` is 2-3x faster for pub/sub operations in production
- **Deploy Redis with replication (Sentinel or Cluster)**: Provides high availability for the critical pub/sub backbone
- **Set unique `REVERB_SCALING_CHANNEL` per environment**: Prevents cross-environment message leaking (staging messages reaching production clients)
- **Configure sticky sessions on the load balancer**: Round-robin alone breaks reconnection because clients must return to their original Reverb instance

## Architecture Guidelines
- Each Reverb instance consumes a Redis connection for subscribing; monitor `maxclients`
- Pub/sub over Redis Streams: pub/sub is appropriate for ephemeral broadcast events; Streams would add persistence overhead
- No connection migration: clients are pinned to their initial instance; no cross-node connection handoff
- For Laravel 13+, evaluate the database scaling driver for simpler single-server multi-process setups

## Performance Considerations
- Redis pub/sub adds ~1-5ms latency per broadcast event in the same datacenter
- Redis throughput must accommodate peak message rates; benchmark with `redis-benchmark` pub/sub tests
- Network latency between Reverb instances and Redis is critical—deploy in the same VPC/region
- Each Reverb instance consumes a Redis connection for subscribing

## Security Considerations
- Redis must be protected with authentication and network isolation (CVE-2026-23524)
- Use a dedicated Redis instance for Reverb scaling to limit blast radius
- Redis pub/sub does not encrypt messages by default; use TLS for Redis in production
- Configure Redis `requirepass` and bind to internal network interfaces

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Shared Redis for everything | Cache, queue, session, and Reverb on same Redis | Cost-saving or simplicity | Contention, cross-failure cascades | Dedicated Redis for Reverb pub/sub |
| No sticky sessions | Reconnecting clients go to different instances | Forgetting load balancer config | Missed private channel messages | Configure sticky sessions on LB |
| REVERB_SCALING_ENABLED=false with multiple instances | Events don't cross instances | Missing env var configuration | Isolated Reverb instances | Always enable scaling for multi-instance |
| Predis in production | 2-3x slower than phpredis | Not optimizing for production | Higher latency, more CPU usage | Use phpredis extension |
| No Redis auth/network isolation | Security risk (CVE-2026-23524) | Missing security configuration | RCE vulnerability | Configure requirepass and network isolation |

## Anti-Patterns
- **Single Redis for all environments**: Staging Reverb publishing to production Redis channel can leak events
- **Not testing reconnection during instance failure**: When a Reverb instance dies, clients must reconnect to remaining instances; test this behavior
- **Adding more Reverb instances without monitoring Redis throughput**: Redis can become the bottleneck; monitor pub/sub message rate

## Examples

### Reverb environment variables for scaling
```env
REVERB_SCALING_ENABLED=true
REVERB_SCALING_DRIVER=redis
REVERB_REDIS_HOST=10.0.0.10
REVERB_REDIS_PORT=6379
REVERB_REDIS_PASSWORD=your-password
REVERB_SCALING_CHANNEL=reverb-production
```

### Nginx upstream with sticky sessions
```nginx
upstream reverb_cluster {
    ip_hash;
    server 10.0.0.1:8080;
    server 10.0.0.2:8080;
    server 10.0.0.3:8080;
}
```

## Related Topics
- K03: Reverb Installation & Configuration
- K05: Reverb Connection Lifecycle & State Management
- K14: Sticky Sessions & Load Balancing for WebSocket
- K34: Redis Dependency & Failure Modes
- K33: Dedicated Reverb Fleet Architecture

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- CVE-2026-23524 was a critical Redis deserialization vulnerability affecting scaled Reverb deployments
- Laravel 13's database scaling driver provides an alternative for single-server multi-process setups
- The bubble.ro deep-dive recommended starting with a single Reverb instance before scaling out

## Verification
- [ ] `REVERB_SCALING_ENABLED=true` configured
- [ ] Dedicated Redis instance for Reverb (separate from cache/queue)
- [ ] `phpredis` extension installed in production
- [ ] Redis authentication and network isolation configured
- [ ] Sticky sessions configured on load balancer
- [ ] Unique `REVERB_SCALING_CHANNEL` per environment
- [ ] Reverb version v1.7.0+ (CVE fix)
- [ ] Redis deployed with replication (Sentinel/Cluster) for HA
