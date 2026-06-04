# Metadata
Domain: Real-Time Systems
Subdomain: Scaling & Production Architecture
Knowledge Unit: Reconnection Strategies & Storm Mitigation
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
Reconnection storms occur when a large number of WebSocket clients disconnect and attempt to reconnect simultaneously, overwhelming the server, auth endpoint, and infrastructure. This typically happens after server restarts, network partitions, or deployment rollouts. Mitigation strategies operate at two levels: **client-side** (jitter, exponential backoff, staggered reconnection) and **server-side** (connection rate limiting, auth endpoint throttling, connection draining). The Echo client uses exponential backoff by default, but additional jitter must be configured. The server-side approach involves rate limiting the auth endpoint, implementing connection caps, using rolling deployments with connection draining, and pre-warming caches to absorb the auth storm.

## Core Concepts
A reconnection storm is a positive feedback loop: all clients disconnect → all immediately try to reconnect → server overload → connections fail → clients retry immediately → server overload persists. Breaking the loop requires clients to randomize their reconnection timing and servers to reject/re-queue excess connection attempts gracefully without cascading failure. The combination of exponential backoff (clients wait longer between attempts) and jitter (randomize the wait time) spreads the reconnection wave across a time window, reducing peak load.

## Mental Models
A reconnection storm is like a stadium emptying after a game with everyone trying to exit through the same door. Jitter makes people leave at random intervals. Exponential backoff makes people wait longer if the door is stuck. The server implementing rate limiting is like security opening more doors to spread the load.

## Internal Mechanics
Echo's underlying connector (pusher-js) implements reconnection with `activity_timeout` and `pong_timeout` timers. When a disconnection is detected, it enters `unavailable` state and begins reconnect attempts. The default reconnection strategy uses exponential backoff capped at a maximum interval. To add jitter, the random factor multiplies the backoff by a random value between 0 and the configured maximum jitter. The WebSocket server (Reverb) processes incoming connections sequentially; without rate limiting, it accepts connections as fast as the event loop can handle them. The auth endpoint processes POST requests; without throttling, it can be overwhelmed by the storm's peak load.

## Patterns
- **Exponential backoff**: Double wait time after each failed attempt (1s, 2s, 4s, 8s, max 30s)
- **Full jitter**: Randomize wait time between 0 and current backoff value: `sleep(random(0, min(cap, base * 2^n)))`
- **Staggered reconnection**: Fixed random delay (0-5s) before initial reconnection attempt
- **Server-side connection rate limiting**: Configurable max connections per IP or per second
- **Auth endpoint throttling**: Apply rate limiters to `/broadcasting/auth` with different thresholds per IP
- **Connection draining**: Allow existing connections to complete before shutting down a server

## Architectural Decisions
- **Client-led reconnection**: Echo/pusher-js manages reconnection; the server does not reconnect to clients
- **Server-side protection**: Reverb's `max_connections_per_ip` and `max_messages_per_second` settings limit storm impact
- **Auth endpoint as choke point**: Rate limiting here protects the entire application infrastructure
- **Rolling deployments with drain**: Prevents storms by never disconnecting all clients at once

## Tradeoffs
- **Jitter vs. reconnection speed**: More jitter spreads load better but increases time-to-reconnect for individual clients
- **Backoff cap vs. user experience**: High cap (60s) protects servers but users wait longer for real-time updates
- **Rate limiting vs. false positives**: Aggressive rate limiting may reject legitimate reconnect attempts
- **Connection draining vs. deployment speed**: Draining takes time (up to `stopwaitsecs`); slows down deployments

## Performance Considerations
- Auth endpoint throughput determines maximum sustainable reconnect rate
- PHP-FPM process pool must be sized to handle auth storm + normal HTTP traffic
- Queue workers must handle broadcast event backlog accumulated during outage
- Database connection pool must accommodate auth callback queries during storm
- Redis pub/sub buffering: Events published during the reconnection window may queue up

## Production Considerations
- Configure Echo with explicit reconnection options: `activityTimeout`, `pongTimeout`, `unavailableTimeout`
- Implement jitter in the client: `Math.random() * backoffValue` before reconnection attempt
- Set `max_connections_per_ip` in Reverb config to prevent individual IP abuse
- Rate limit `/broadcasting/auth` with `throttle` middleware (e.g., 60 requests per minute per IP)
- Pre-warm cache entries for authorization decisions before planned deployments
- Implement a circuit breaker pattern: if auth endpoint returns 429/503, clients increase backoff multiplier
- Use rolling deployments: restart Reverb instances one at a time, not all at once
- Set Supervisor `stopwaitsecs` to allow in-flight connections to drain (should match `activity_timeout`)

## Common Mistakes
- Relying solely on Expoential backoff without jitter (clients still reconnect in synchronized waves)
- Not configuring any rate limiting on the auth endpoint (first sign of trouble in production)
- Restarting all Reverb instances simultaneously during deployment (causes full reconnection storm)
- Setting `stopwaitsecs` too low (abruptly kills connections without drain)
- Not pre-warming authorization caches before planned maintenance (auth endpoint hit with full database load)

## Failure Modes
- **Auth endpoint meltdown**: Storm overwhelms PHP-FPM; auth requests queue up, time out, and cascade to downstream systems
- **Database connection pool exhaustion**: Auth callbacks consume all DB connections; application goes down
- **Redis pub/sub storm**: Reconnection storm generates broadcast events for presence join/leave, overwhelming Redis
- **Thundering herd at auth**: Cached auth decisions expire simultaneously during storm, causing mass database queries (cache stampede)
- **Infinite reconnect loop**: Auth endpoint returns 5xx; clients retry with backoff; server never recovers because it's still handling retries
- **Load balancer snowball**: Health checks fail on overloaded Reverb instances; load balancer removes them, routing traffic to remaining instances, which then also overload

## Ecosystem Usage
- Essential for any application with more than a few hundred concurrent WebSocket connections
- Critical for mobile applications where network connectivity is unreliable (frequent reconnections)
- Required for live event platforms that anticipate mass join/leave patterns
- Standard consideration for chat applications with high user churn
- Important for deployment pipelines that restart Reverb instances

## Related Knowledge Units
- K14: Sticky Sessions & Load Balancing for WebSocket
- K36: Auth Endpoint Optimization & Caching
- K27: Supervisor & Production Process Management
- K05: Reverb Connection Lifecycle & State Management

## Research Notes
The reconnection storm problem is well-documented in the WebSocket operations literature. Pusher's documentation recommends jitter + exponential backoff as the minimum client-side protection. Reverb's `max_connections_per_ip` default is 100. The bubble.ro deep-dive (May 2026) identified reconnection storms as one of the top three production failure modes for Reverb deployments. Rolling deployments with connection draining are the single most effective server-side mitigation. The combination of client jitter, server rate limiting, and rolling deployments provides defense in depth against reconnection storms.
