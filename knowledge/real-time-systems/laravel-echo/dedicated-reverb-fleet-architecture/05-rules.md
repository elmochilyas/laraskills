## Always Configure Sticky Sessions on the Load Balancer
---
## Scalability
---
Always use sticky sessions (cookie-based or IP hash) when deploying a dedicated Reverb fleet behind a load balancer.
---
WebSocket connections are pinned to the instance that handled the upgrade. Without stickiness, reconnecting clients land on different instances with no subscription state.
---
```nginx
upstream reverb {
    server 10.0.0.1:8080;
    server 10.0.0.2:8080; # No ip_hash — clients bounce
}
```
---
```nginx
upstream reverb {
    ip_hash;
    server 10.0.0.1:8080;
    server 10.0.0.2:8080;
}
```
---
Single-instance Reverb deployments. No common exceptions for multi-instance.
---
Lost subscriptions; broken private channels; mass reconnections on every reconnect.

## Always Use a Dedicated Redis Instance for Fleet Pub/Sub
---
## Reliability
---
Always provision a separate Redis instance for the Reverb fleet pub/sub, isolated from cache and queue Redis.
---
Shared Redis creates cross-component contention and a single point of failure. A cache stampede or queue backlog can starve Reverb's pub/sub, dropping broadcast events.
---
```env
# Single Redis for everything
REDIS_HOST=127.0.0.1
```
---
```env
# Dedicated Reverb Redis
REVERB_REDIS_HOST=10.0.0.10
REVERB_REDIS_PORT=6380
```
---
Small deployments where a single Redis instance has ample headroom. No common exceptions at scale.
---
Cross-component failures; undetected broadcast drops under load.

## Always Implement Connection Draining on Deployment
---
## Reliability
---
Always configure connection draining (`stopwaitsecs`) during rolling deployments to allow existing WebSocket connections to complete gracefully.
---
Immediate Reverb process termination drops all WebSocket connections simultaneously, triggering a reconnection storm as thousands of clients reconnect at once.
---
```ini
stopwaitsecs=10  # Too short — kills active connections
```
---
```ini
stopwaitsecs=60  # Matches 2x activity_timeout — graceful drain
```
---
Single-instance deployments where brief downtime is acceptable. No common exceptions for fleet architectures.
---
Reconnection storms; auth endpoint overload; degraded UX.

## Always Set File Descriptor Limits Adequately
---
## Scalability
---
Always configure `ulimit -n` to exceed the expected maximum concurrent connections by at least 25%.
---
Each WebSocket connection consumes a file descriptor. Default ulimits (1024) cap connections far below production requirements, causing silent connection rejections.
---
```bash
# Default ulimit — 1024 connections max
```
---
```bash
# Supervisor config
minfds=65536  # Adequate for 50k connections + overhead
```
---
Development environments with minimal concurrent connections. No common exceptions for production.
---
Connection limits below target; rejected WebSocket handshakes.

## Always Monitor Connection Distribution Across Fleet Instances
---
## Maintainability
---
Always monitor per-instance connection counts to detect uneven load balancing distribution.
---
IP hash with many clients behind NAT gateways can route traffic to a single instance, overloading it while others sit idle.
---
```bash
# No per-instance connection monitoring
```
---
```bash
# Monitor each instance's /apps/{appId}/connections
curl https://ws1.internal/apps/123/connections
curl https://ws2.internal/apps/123/connections
```
---
Single-instance deployments. No common exceptions for multi-instance fleets.
---
Uneven load; instance overload; capacity planning blind spots.

## Never Share Fleet Credentials Across Environments
---
## Security
---
Always use unique Reverb app credentials per environment in a dedicated fleet setup.
---
Staging and production sharing the same app credentials means staging events can reach production clients and vice versa, causing data leakage and confusion.
---
```env
# Same credentials in .env and .env.staging
REVERB_APP_KEY=shared-key
```
---
```env
# Unique per environment
REVERB_APP_KEY=prod-key-123
```
---
No common exceptions; credentials must be unique per environment.
---
Cross-environment data leakage; security audit failures.
