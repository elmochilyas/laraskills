# Standardized Knowledge: Redis Dependency & Failure Modes

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | Scaling & Production Architecture |
| Knowledge Unit ID | K34 |
| Title | Redis Dependency & Failure Modes |
| Difficulty | Advanced |
| Dependencies | K04, K13 |
| Related KUs | CVE-2026-23524 Reverb Redis deserialization, Reconnection strategies storm mitigation |

## Overview
Redis is a critical dependency for Reverb horizontal scaling, presence channel state, and the queue system powering broadcast dispatch. A Redis outage cascades into complete broadcasting failure: queue workers cannot process broadcast jobs, Reverb instances cannot coordinate cross-instance events, and presence channel state is lost. Understanding Redis failure modes—network partitions, OOM conditions, failover events, and pub/sub limitations—is essential for operating reliable real-time systems.

## Core Concepts
Redis serves multiple roles in a real-time Laravel architecture: (1) Pub/sub backbone for Reverb horizontal scaling, (2) Presence state store, (3) Queue backend for broadcast events, (4) Cache for authorization decisions. Each role has different failure characteristics: pub/sub is fire-and-forget, presence state can be rebuilt from active connections, queue persistence depends on Redis durability configuration, and cache misses are recoverable via database fallback.

## When To Use
- Multi-server Reverb deployments requiring horizontal scaling
- Presence channel state management across instances
- Queue backend for broadcast event processing
- Cache backend for authorization decisions

## When NOT To Use
- Single-server deployments (Laravel 13's database scaling driver is simpler)
- Applications already using a managed WebSocket service (Pusher, Ably) that handles scaling
- Environments where Redis cannot be operated reliably

## Best Practices (Why)
- **Use a dedicated Redis instance for Reverb pub/sub**: Separate from cache and queue Redis to limit blast radius and prevent cross-contention
- **Configure Redis authentication and network isolation**: `requirepass` and bind to internal IP with firewall—prevents unauthorized access (CVE-2026-23524)
- **Set TTL on presence channel member keys**: Prevents unbounded Redis memory growth from stale presence data
- **Enable Redis AOF persistence for queue data**: Ensures queued broadcast events survive Redis restarts
- **Use Redis Sentinel or Cluster for HA**: Automatic failover when the primary Redis node fails

## Architecture Guidelines
- Run separate Redis instances for cache/queue vs. Reverb pub/sub
- Configure Redis `maxmemory-policy` (allkeys-lru for cache, noeviction for queue)
- Plan for Redis failover: Reverb's connection to Redis drops during failover; auto-reconnect should restore operation
- Consider the database scaling driver (Laravel 13+) for single-server deployments without Redis

## Performance Considerations
- Redis pub/sub latency: sub-millisecond in same datacenter, 1-5ms across availability zones
- Each Reverb instance uses two Redis connections (subscribe + publish)
- High-throughput pub/sub (10k+ msg/s) consumes Redis network I/O
- Presence channel membership data grows with concurrent connections; set TTLs aggressively
- Redis-based queue throughput depends on list operations (LPUSH/BRPOP) which are O(1)

## Security Considerations
- Redis must not be exposed to the public internet—bind to internal IP and use firewalls
- Enable `requirepass` for authentication
- Use a separate Redis instance for Reverb scaling (not shared with cache/queue)
- CVE-2026-23524 (RCE via insecure deserialization) was fixed in Reverb v1.7.0—always update

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Shared Redis instance | Cache, queue, session, and Reverb pub/sub on same Redis | Cost-saving or simplicity | Contention under load, cross-component failure cascades | Use dedicated Redis for Reverb pub/sub |
| No persistence for queue | All queued broadcast jobs lost on Redis restart | Not enabling RDB/AOF | Event loss during maintenance | Enable AOF persistence for queue Redis |
| No Redis auth | Unauthenticated Redis accessible on network | Misconfiguration or oversight | CVE-2026-23524 vulnerability | Always set requirepass and bind to internal IP |
| No TTL on presence keys | Stale presence data accumulates indefinitely | Missing TTL configuration | Unbounded Redis memory growth | Set TTL on all presence channel member keys |
| Assuming pub/sub is reliable | Messages lost when subscribers disconnect | Not understanding pub/sub semantics | Missed events during network blips | Design for fire-and-forget semantics |

## Anti-Patterns
- **Single massive Redis instance for everything**: One Redis for cache, queue, session, and Reverb creates a single point of failure with cross-contention
- **No Redis monitoring**: Without monitoring memory, connected clients, and pub/sub message rate, failures are discovered only by user complaints
- **Assigning more memory than needed without eviction policy**: Causes OOM errors when `maxmemory` is reached without proper eviction configuration

## Examples

### Dedicated Redis config for Reverb
```bash
# /etc/redis/reverb.conf (separate instance)
port 6380
bind 127.0.0.1
requirepass your-strong-password
maxmemory 1gb
maxmemory-policy noeviction
save ""
```

### Laravel Reverb Redis configuration
```env
REVERB_SCALING_ENABLED=true
REVERB_REDIS_HOST=127.0.0.1
REVERB_REDIS_PORT=6380
REVERB_REDIS_PASSWORD=your-strong-password
REVERB_SCALING_CHANNEL=reverb-production
```

## Related Topics
- K04: Reverb Horizontal Scaling via Redis
- K13: Presence Channels & Online User Tracking
- K25: CVE-2026-23524 (Reverb Redis Deserialization)
- K15: Reconnection Strategies & Storm Mitigation

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- CVE-2026-23524 highlighted the security risks of Redis deserialization
- Laravel 13's database scaling driver was a direct response to Redis dependency complexity
- Trend in 2026: reducing Redis dependency where possible (database driver, managed services)

## Verification
- [ ] Dedicated Redis instance for Reverb pub/sub (separate from cache/queue)
- [ ] Redis authentication configured (`requirepass`)
- [ ] Redis bound to internal IP with firewall
- [ ] TTL set on presence channel member keys
- [ ] AOF persistence enabled for queue Redis
- [ ] Redis memory usage monitored
- [ ] Reverb updated to v1.7.0+ for CVE fix
- [ ] Connection retry with backoff configured in Reverb
