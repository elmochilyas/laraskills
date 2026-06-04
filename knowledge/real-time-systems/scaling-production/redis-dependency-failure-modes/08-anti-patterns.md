# ECC Anti-Patterns — Redis Dependency & Failure Modes

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Scaling & Production Architecture |
| **Knowledge Unit** | Redis Dependency & Failure Modes |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Single Shared Redis Instance for Everything
2. No Redis Authentication or Network Isolation
3. No TTL on Presence Channel Keys
4. No AOF Persistence for Queue Redis
5. Wrong `maxmemory-policy` for Redis Role

---

## Repository-Wide Anti-Patterns

- God Services
- Hidden Database Queries

---

## Anti-Pattern 1: Single Shared Redis Instance for Everything

### Category
Reliability

### Description
Using a single Redis instance for cache, queue, sessions, and Reverb pub/sub simultaneously, creating a single point of failure where any component's load can starve all others.

### Warning Signs
- One Redis instance serves cache, queue, session, and Reverb
- A cache stampede causes broadcast delays
- Queue backlog increases Reverb pub/sub latency
- All real-time features fail when Redis goes down
- No dedicated Redis configuration for Reverb

### Why It Is Harmful
A shared Redis instance means contention across all components. A cache stampede from application traffic increases Redis CPU and memory usage, which increases latency for Reverb pub/sub. A queue backlog consumes Redis memory, potentially triggering eviction of presence channel or cache data. When Redis goes down (OOM, failover, restart), every component fails simultaneously — the application goes down entirely rather than degrading selectively.

### Real-World Consequences
A marketing campaign causes a cache stampede. Redis CPU spikes to 95%. Reverb pub/sub latency increases from 1ms to 200ms. Broadcast events are delayed by seconds. Users report "live notifications are stuck." The queue Redis (same instance) also experiences latency, delaying all job processing. Everything is affected by one campaign.

### Preferred Alternative
Provision a dedicated Redis instance for Reverb pub/sub, separate from cache, queue, and session storage.

### Refactoring Strategy
1. Provision a new Redis instance (or use a separate database index)
2. Configure Reverb to use the dedicated Redis: `REVERB_REDIS_HOST`, `REVERB_REDIS_PORT`
3. Keep cache and queue on the original Redis instance
4. Monitor each Redis instance independently for contention

### Detection Checklist
- [ ] Single Redis instance for cache, queue, session, and Reverb
- [ ] Cross-component latency correlation
- [ ] Reverb pub/sub performance affected by cache activity

### Related Rules
- (Rule: Always use a dedicated Redis instance for Reverb pub/sub)

---

## Anti-Pattern 2: No Redis Authentication or Network Isolation

### Category
Security

### Description
Running Redis without `requirepass` or binding to `0.0.0.0`, exposing an unauthenticated Redis instance to the network and creating a remote code execution vulnerability.

### Warning Signs
- Redis bound to `0.0.0.0` or accessible from public network
- No `requirepass` in Redis config
- Redis accessible without authentication
- Reverb version < 1.7.0 (CVE-2026-23524)

### Why It Is Harmful
Redis without authentication allows anyone on the network to run arbitrary commands. CVE-2026-23524 demonstrated that insecure Redis deserialization in Reverb enables remote code execution. An attacker can publish malicious messages to Reverb's Redis channel, inject unauthorized broadcast events, or exfiltrate data from the Redis instance. Redis is also a vector for data breaches if it stores cached sensitive data.

### Real-World Consequences
An attacker scans a subnet and finds an unauthenticated Redis instance on port 6379. They connect and run `PUBLISH reverb-production '{"event":"App\\Events\\AdminCommand","data":{"cmd":"whoami"}}'`. The malicious broadcast event is dispatched to all connected admin clients. The attacker uses this to explore further injection vectors.

### Preferred Alternative
Bind Redis to `127.0.0.1` or internal IP, enable `requirepass`, and update Reverb to v1.7.0+.

### Refactoring Strategy
1. Set `bind 127.0.0.1` in Redis config
2. Set `requirepass your-strong-password`
3. Configure Reverb to use the password: `REVERB_REDIS_PASSWORD=your-strong-password`
4. Update Reverb to v1.7.0+ for CVE-2026-23524 fix
5. Verify unauthenticated Redis connection attempts are rejected

### Detection Checklist
- [ ] Redis bound to public interface
- [ ] No `requirepass` configured
- [ ] Reverb version < 1.7.0

### Related Rules
- (Rule: Always configure Redis authentication and network isolation)

---

## Anti-Pattern 3: No TTL on Presence Channel Keys

### Category
Performance

### Description
Not configuring TTL for Redis presence channel member keys, causing stale entries from disconnected clients to accumulate indefinitely and consume unbounded memory.

### Warning Signs
- Redis memory usage grows over time without corresponding traffic increase
- Online user counts include users who disconnected hours ago
- Presence channel member list shows stale entries
- No TTL configured on presence-related Redis keys

### Why It Is Harmful
Each WebSocket connection creates a presence channel member entry in Redis. When a client disconnects abruptly (network loss, browser crash), the cleanup event may not fire. Without TTL, these stale member entries persist forever. Over weeks of operation, stale entries accumulate, inflating online user counts and consuming Redis memory. The `maxmemory` limit is eventually reached, causing eviction of other data (cache, queue jobs) or OOM failures.

### Real-World Consequences
An application with 1000 daily active users has been running for 6 months. 30% of disconnections are unclean (browser crashes, network drops). After 6 months, 5400 stale presence entries exist in Redis. The online user counter shows 6400 "online" users — but only 1000 are actually connected. Redis memory is 40% higher than necessary.

### Preferred Alternative
Configure appropriate TTL on all presence channel member keys. Reverb's `activity_timeout` setting automatically manages TTL for connected clients.

### Refactoring Strategy
1. Set `REVERB_ACTIVITY_TIMEOUT=30` in Reverb config
2. Verify Redis keys have TTL matching the timeout
3. Implement a periodic cleanup script for any residual stale entries
4. Monitor Redis memory stabilization

### Detection Checklist
- [ ] No TTL on presence channel keys
- [ ] Redis memory grows without active user increase
- [ ] Stale entries appear in online user counts

### Related Rules
- (Rule: Always set TTL on presence channel keys)

---

## Anti-Pattern 4: No AOF Persistence for Queue Redis

### Category
Reliability

### Description
Running the Redis instance used for queue storage without AOF persistence, causing all queued broadcast events to be lost on Redis restart.

### Warning Signs
- `save ""` in Redis config for queue Redis
- `appendonly no` for queue Redis
- Redis restarts lose queued broadcast jobs
- No persistence mechanism for queued events

### Why It Is Harmful
Redis is primarily an in-memory store. Without AOF persistence, all data is lost on restart. Broadcast events that have been dispatched (queued as `BroadcastEvent` jobs) but not yet processed are permanently lost. These events include time-sensitive notifications, order updates, and other real-time data. The loss is silent — no error is logged, and the application continues running without the events.

### Real-World Consequences
Redis runs out of memory and restarts. All queued broadcast jobs (5000 events) are lost. Users who should have received order shipping notifications never see them. The team discovers the issue hours later when users complain. No error was logged — the events were simply never dispatched.

### Preferred Alternative
Enable AOF persistence with `appendonly yes` and `appendfsync everysec` on the Redis instance used for queue storage.

### Refactoring Strategy
1. Enable AOF: `appendonly yes` in Redis config
2. Set sync frequency: `appendfsync everysec`
3. Restart Redis with the new config
4. Verify that queued jobs survive a test restart
5. Monitor disk I/O from AOF writes

### Detection Checklist
- [ ] AOF persistence not enabled for queue Redis
- [ ] Queued broadcast events lost on Redis restart
- [ ] `save ""` or `appendonly no` configured

### Related Rules
- (Rule: Always enable AOF persistence for queue Redis)

---

## Anti-Pattern 5: Wrong `maxmemory-policy` for Redis Role

### Category
Reliability

### Description
Using the same eviction policy across all Redis instances without consideration for their role, causing silent event loss or write failures under memory pressure.

### Warning Signs
- Queue Redis uses `allkeys-lru` eviction
- Cache Redis uses `noeviction`
- Queued broadcast jobs disappear under memory pressure
- Cache writes fail with OOM errors
- Same `maxmemory-policy` on all Redis instances

### Why It Is Harmful
Different Redis roles require different eviction policies. Queue Redis must use `noeviction` — queued jobs must never be evicted to make room for other data. Cache Redis should use `allkeys-lru` — cache data can be safely evicted under memory pressure. Using `allkeys-lru` on queue Redis silently removes queued broadcast events. Using `noeviction` on cache Redis causes all cache writes to fail when `maxmemory` is reached.

### Real-World Consequences
A queue Redis with `allkeys-lru` hits `maxmemory`. Redis evicts the oldest queued broadcast events. 2000 unprocessed notifications are silently deleted. The application logs show no error. Users never receive the notifications. Meanwhile, the cache Redis with `noeviction` hits `maxmemory` and refuses all writes. The application's cache-dependent features start returning stale data.

### Preferred Alternative
Configure `maxmemory-policy` per Redis instance based on role: `noeviction` for queue and Reverb pub/sub, `allkeys-lru` for cache.

### Refactoring Strategy
1. Set `maxmemory-policy noeviction` on queue Redis
2. Set `maxmemory-policy allkeys-lru` on cache Redis
3. Set `maxmemory-policy noeviction` on Reverb pub/sub Redis
4. Monitor eviction counts on each instance
5. Test behavior under memory pressure

### Detection Checklist
- [ ] Same eviction policy on all Redis instances
- [ ] Queue events silently evicted under memory pressure
- [ ] Cache writes fail with OOM errors

### Related Rules
- (Rule: Always configure maxmemory-policy per Redis role)
