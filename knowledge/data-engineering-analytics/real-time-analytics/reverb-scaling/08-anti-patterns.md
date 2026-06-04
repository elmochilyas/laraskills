# Anti-Patterns: Horizontal Reverb Scaling with Redis Pub/Sub Backbone

## No Sticky Sessions
Load balancer distributes WebSocket connections round-robin. The HTTP upgrade hits one instance, but after upgrade, subsequent requests hit different instances. The registry on the new instance has no connection entry.

**Solution:** Enable sticky sessions. Validate WebSocket routing end-to-end after load balancer configuration changes.

## Shared Redis With Cache
Redis pub/sub shares the same instance as Laravel cache. During cache flush (`php artisan cache:clear`), Redis CPU spikes. Reverb broadcasts are delayed by 500ms+. WebSocket clients disconnect due to missed heartbeats.

**Solution:** Dedicated Redis for Reverb pub/sub. Use a separate Redis instance or Redis database number.

## Single Large Instance
One Reverb instance handles 95% of connections. When it fails, 47,500 connections are disconnected simultaneously. Reconnection storm overwhelms remaining instances.

**Solution:** Use multiple smaller instances (2-4 CPU cores each). Limit `REVERB_MAX_CONNECTIONS` to ensure failure isolation.

## No Connection Limit
Reverb instances accept connections without limit. A marketing campaign drives 3x expected traffic. Memory usage reaches 95%. OOM killer terminates the Reverb process. All connections lost.

**Solution:** Set `REVERB_MAX_CONNECTIONS` to 80% of the instance's practical capacity. Design for graceful rejection.
