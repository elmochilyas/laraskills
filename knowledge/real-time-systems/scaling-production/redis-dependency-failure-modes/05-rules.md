## Always Use a Dedicated Redis Instance for Reverb Pub/Sub
---
## Reliability
---
Always provision a separate Redis instance for Reverb horizontal scaling, isolated from cache and queue Redis.
---
Shared Redis creates a single point of failure where a cache stampede, queue backlog, or session surge can starve Reverb's pub/sub, causing broadcast drops.
---
```env
# Single Redis for everything — cross-component failure risk
REDIS_HOST=127.0.0.1
```
---
```env
# Dedicated Reverb Redis — limited blast radius
REVERB_REDIS_HOST=10.0.0.10
REVERB_REDIS_PORT=6380
```
---
Single-server deployments using Laravel 13's database scaling driver. No common exceptions for multi-instance.
---
Cross-component failure cascades; undetected broadcast drops.

## Always Configure Redis Authentication and Network Isolation
---
## Security
---
Always set `requirepass` and bind Redis to internal network interfaces.
---
Redis exposed without authentication or network isolation is vulnerable to CVE-2026-23524 and other attacks. An attacker with network access can publish malicious messages to the Reverb Redis channel.
---
```bash
# /etc/redis/redis.conf — no auth, public bind
bind 0.0.0.0
# requirepass not set
```
---
```bash
bind 127.0.0.1
requirepass your-strong-password
port 6380
```
---
Development environments on isolated machines. No common exceptions for production.
---
Remote code execution; unauthorized broadcast injection; data breaches.

## Always Set TTL on Presence Channel Keys
---
## Performance
---
Always configure TTL for Redis presence channel member keys to prevent unbounded memory growth.
---
Without TTL, stale presence entries from disconnected clients accumulate indefinitely in Redis, consuming memory and inflating online user counts.
---
```env
# No TTL — presence keys persist forever
```
---
```env
REVERB_ACTIVITY_TIMEOUT=30  # Reverb sets TTL automatically
```
---
Database scaling driver (separate cleanup mechanism). No common exceptions for Redis driver.
---
Unbounded Redis memory growth; OOM kills; inflated online counts.

## Always Enable AOF Persistence for Queue Redis
---
## Reliability
---
Always enable AOF persistence on the Redis instance used for queue storage to prevent queued broadcast job loss.
---
Without persistence, a Redis restart loses all queued broadcast events. Events that were dispatched but not yet processed are permanently lost.
---
```bash
# No persistence — events lost on restart
save ""
```
---
```bash
# AOF persistence
appendonly yes
appendfsync everysec
```
---
Cache-only Redis where data loss is acceptable. No common exceptions for queue Redis.
---
Queued broadcast event loss; silent delivery failures after restarts.

## Always Use Redis Sentinel or Cluster for High Availability
---
## Reliability
---
Always deploy Redis with replication (Sentinel or Cluster) for production Reverb deployments.
---
A single Redis instance is a single point of failure. If it goes down, Reverb instances cannot coordinate, presence state is lost, and queue processing stops.
---
```bash
# Single Redis — full broadcasting outage on failure
```
---
```bash
# Redis Sentinel for automatic failover
sentinel monitor reverb-master 10.0.0.10 6379 2
sentinel down-after-milliseconds reverb-master 5000
```
---
Development and staging environments. No common exceptions for production.
---
Complete broadcasting failure during Redis outage; extended downtime.

## Never Use Default Redis `maxmemory-policy` Without Consideration
---
## Reliability
---
Always explicitly configure Redis `maxmemory-policy` based on the instance's role (noeviction for queue, allkeys-lru for cache).
---
Wrong eviction policy can silently drop broadcast events. `allkeys-lru` on a queue Redis evicts queued broadcast events under memory pressure. `noeviction` on a cache Redis causes write failures.
---
```bash
# Default policy on all instances — inappropriate for queue
maxmemory-policy noeviction  # On cache Redis — write failures
# Or
maxmemory-policy allkeys-lru  # On queue Redis — event loss
```
---
```bash
# Per-instance policy
# Cache Redis: maxmemory-policy allkeys-lru
# Queue Redis: maxmemory-policy noeviction
# Reverb Redis: maxmemory-policy noeviction
```
---
No common exceptions; each Redis role requires the correct eviction policy.
---
Silent event loss; write failures; unpredictable behavior under memory pressure.
