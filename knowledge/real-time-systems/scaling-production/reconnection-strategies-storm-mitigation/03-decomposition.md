# Decomposition: Reconnection Strategies Storm Mitigation

## Topic Overview
Reconnection storms occur when a large number of WebSocket clients disconnect and attempt to reconnect simultaneously, overwhelming the server, auth endpoint, and infrastructure. This typically happens after server restarts, network partitions, or deployment rollouts. Mitigation strategies operate at two levels: **client-side** (jitter, exponential backoff, staggered reconnection) and **server-side** (connection rate limiting, auth endpoint throttling, connection draining). The Echo client us...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
scaling-production-architecture/K15-reconnection-strategies-storm-mitigation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Reconnection Strategies Storm Mitigation
- **Purpose:** Reconnection storms occur when a large number of WebSocket clients disconnect and attempt to reconnect simultaneously, overwhelming the server, auth endpoint, and infrastructure. This typically happens after server restarts, network partitions, or deployment rollouts. Mitigation strategies operate at two levels: **client-side** (jitter, exponential backoff, staggered reconnection) and **server-side** (connection rate limiting, auth endpoint throttling, connection draining). The Echo client us...
- **Difficulty:** Advanced
- **Dependencies:
  - K14: Sticky Sessions & Load Balancing for WebSocket
  - K36: Auth Endpoint Optimization & Caching
  - K27: Supervisor & Production Process Management
  - K05: Reverb Connection Lifecycle & State Management

## Dependency Graph
**Depends on:**
  - K14: Sticky Sessions & Load Balancing for WebSocket
  - K36: Auth Endpoint Optimization & Caching
  - K27: Supervisor & Production Process Management
  - K05: Reverb Connection Lifecycle & State Management

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Exponential backoff**: Double wait time after each failed attempt (1s, 2s, 4s, 8s, max 30s)**Full jitter**: Randomize wait time between 0 and current backoff value: `sleep(random(0, min(cap, base * 2^n)))`**Staggered reconnection**: Fixed random delay (0-5s) before initial reconnection attempt**Server-side connection rate limiting**: Configurable max connections per IP or per second**Auth endpoint throttling**: Apply rate limiters to `/broadcasting/auth` with different thresholds per IP**Connection draining**: Allow existing connections to complete before shutting down a server**Client-led reconnection**: Echo/pusher-js manages reconnection; the server does not reconnect to clients**Server-side protection**: Reverb's `max_connections_per_ip` and `max_messages_per_second` settings limit storm impact**Auth endpoint as choke point**: Rate limiting here protects the entire application infrastructure**Rolling deployments with drain**: Prevents storms by never disconnecting all clients at once**Jitter vs. reconnection speed**: More jitter spreads load better but increases time-to-reconnect for individual clients**Backoff cap vs. user experience**: High cap (60s) protects servers but users wait longer for real-time updates**Rate limiting vs. false positives**: Aggressive rate limiting may reject legitimate reconnect attempts**Connection draining vs. deployment speed**: Draining takes time (up to `stopwaitsecs`); slows down deploymentsAuth endpoint throughput determines maximum sustainable reconnect ratePHP-FPM process pool must be sized to handle auth storm + normal HTTP trafficQueue workers must handle broadcast event backlog accumulated during outageDatabase connection pool must accommodate auth callback queries during stormRedis pub/sub buffering: Events published during the reconnection window may queue upConfigure Echo with explicit reconnection options: `activityTimeout`, `pongTimeout`, `unavailableTimeout`Implement jitter in the client: `Math.random() * backoffValue` before reconnection attemptSet `max_connections_per_ip` in Reverb config to prevent individual IP abuseRate limit `/broadcasting/auth` with `throttle` middleware (e.g., 60 requests per minute per IP)Pre-warm cache entries for authorization decisions before planned deploymentsImplement a circuit breaker pattern: if auth endpoint returns 429/503, clients increase backoff multiplierUse rolling deployments: restart Reverb instances one at a time, not all at onceSet Supervisor `stopwaitsecs` to allow in-flight connections to drain (should match `activity_timeout`)Relying solely on Expoential backoff without jitter (clients still reconnect in synchronized waves)Not configuring any rate limiting on the auth endpoint (first sign of trouble in production)Restarting all Reverb instances simultaneously during deployment (causes full reconnection storm)Setting `stopwaitsecs` too low (abruptly kills connections without drain)Not pre-warming authorization caches before planned maintenance (auth endpoint hit with full database load)**Auth endpoint meltdown**: Storm overwhelms PHP-FPM; auth requests queue up, time out, and cascade to downstream systems**Database connection pool exhaustion**: Auth callbacks consume all DB connections; application goes down**Redis pub/sub storm**: Reconnection storm generates broadcast events for presence join/leave, overwhelming Redis**Thundering herd at auth**: Cached auth decisions expire simultaneously during storm, causing mass database queries (cache stampede)**Infinite reconnect loop**: Auth endpoint returns 5xx; clients retry with backoff; server never recovers because it's still handling retries**Load balancer snowball**: Health checks fail on overloaded Reverb instances; load balancer removes them, routing traffic to remaining instances, which then also overloadEssential for any application with more than a few hundred concurrent WebSocket connectionsCritical for mobile applications where network connectivity is unreliable (frequent reconnections)Required for live event platforms that anticipate mass join/leave patternsStandard consideration for chat applications with high user churnImportant for deployment pipelines that restart Reverb instancesK14: Sticky Sessions & Load Balancing for WebSocketK36: Auth Endpoint Optimization & CachingK27: Supervisor & Production Process ManagementK05: Reverb Connection Lifecycle & State Management

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization