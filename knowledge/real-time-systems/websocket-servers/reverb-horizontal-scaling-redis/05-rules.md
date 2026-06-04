## Always Enable `REVERB_SCALING_ENABLED=true` for Multi-Instance Setups
---
## Framework Usage
---
Always set `REVERB_SCALING_ENABLED=true` when running multiple Reverb instances behind a load balancer.
---
Without scaling enabled, each Reverb instance operates in isolation. Events broadcast on one instance never reach clients connected to other instances.
---
```env
# Multi-instance without scaling — isolated instances
REVERB_SCALING_ENABLED=false
```
---
```env
REVERB_SCALING_ENABLED=true
REVERB_SCALING_DRIVER=redis
```
---
Single-instance deployments. No common exceptions for multi-instance.
---
Events only reach clients on the originating instance; broken multi-server broadcasting.

## Always Use a Dedicated Redis Instance for Reverb Scaling
---
## Reliability
---
Always provision a separate Redis instance for Reverb pub/sub, isolated from cache and queue Redis.
---
Shared Redis creates contention and a single point of failure. A cache stampede or queue backlog can starve Reverb's pub/sub, causing cross-instance event loss.
---
```env
# Single Redis for everything — contention risk
REDIS_HOST=127.0.0.1
```
---
```env
# Dedicated Reverb Redis — no contention
REVERB_REDIS_HOST=10.0.0.10
REVERB_REDIS_PORT=6380
```
---
Single-server deployments using database scaling driver. No common exceptions for multi-instance.
---
Broadcast drops under load; cross-component failure cascades.

## Always Use `phpredis` in Production Over Predis
---
## Performance
---
Always use the `phpredis` PHP extension instead of the `predis` library for production Reverb Redis connections.
---
`phpredis` is 2-3x faster than `predis` for pub/sub operations because it's a native C extension rather than a PHP implementation. This directly impacts broadcast latency at scale.
---
```php
// config/broadcasting.php
'redis' => ['client' => 'predis'], // 2-3x slower
```
---
```php
'redis' => ['client' => 'phpredis'], // Native C extension — fastest
```
---
Development environments. No common exceptions for production.
---
Higher broadcast latency; increased CPU usage; reduced throughput.

## Always Configure Sticky Sessions on the Load Balancer
---
## Scalability
---
Always configure sticky sessions when running multiple Reverb instances with Redis scaling.
---
Even with Redis pub/sub, connection subscription state is local to each Reverb instance. Redis only handles event fan-out, not subscription state migration. A reconnecting client must return to its original instance.
---
```nginx
upstream reverb_cluster {
    server 10.0.0.1:8080;
    server 10.0.0.2:8080; // No sticky — clients bounce, lose subscriptions
}
```
---
```nginx
upstream reverb_cluster {
    ip_hash;
    server 10.0.0.1:8080;
    server 10.0.0.2:8080;
}
```
---
Single-instance deployments. No common exceptions for multi-instance.
---
Lost channel subscriptions; broken private channels on reconnect.

## Always Use a Unique Scaling Channel Per Environment
---
## Reliability
---
Always set a unique `REVERB_SCALING_CHANNEL` value per deployment environment.
---
Staging and production sharing the same scaling channel causes staging broadcasts to reach production clients and vice versa, creating data leakage and confusion.
---
```env
# Same channel — cross-environment bleeding
REVERB_SCALING_CHANNEL=reverb-default
```
---
```env
# Staging
REVERB_SCALING_CHANNEL=reverb-staging
# Production
REVERB_SCALING_CHANNEL=reverb-production
```
---
No common exceptions; each environment must have a unique channel name.
---
Cross-environment message leakage; production data contamination.
