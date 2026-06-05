# Standardized Knowledge: Reconnection Strategies & Storm Mitigation

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | Scaling & Production Architecture |
| Knowledge Unit ID | K15 |
| Title | Reconnection Strategies & Storm Mitigation |
| Difficulty | Advanced |
| Dependencies | K36, K27, K05 |
| Related KUs | Sticky sessions load balancing WebSocket |

## Overview
Reconnection storms occur when a large number of WebSocket clients disconnect and attempt to reconnect simultaneously, overwhelming the server, auth endpoint, and infrastructure. This typically happens after server restarts, network partitions, or deployment rollouts. Mitigation strategies operate at two levels: client-side (jitter, exponential backoff, staggered reconnection) and server-side (connection rate limiting, auth endpoint throttling, connection draining).

## Core Concepts
- A reconnection storm is a positive feedback loop: all disconnect → all reconnect simultaneously → server overload → connections fail → immediate retry → server overload persists
- Breaking the loop requires clients to randomize reconnection timing and servers to reject/re-queue excess connection attempts gracefully
- Exponential backoff (clients wait longer between attempts) combined with jitter (randomized wait times) spreads the reconnection wave across a time window, reducing peak load

## When To Use
- Any application with more than a few hundred concurrent WebSocket connections
- Mobile applications where network connectivity is unreliable (frequent reconnections)
- Live event platforms that anticipate mass join/leave patterns
- Deployment pipelines that restart Reverb instances
- Chat applications with high user churn

## When NOT To Use
- Low-traffic applications with fewer than 50 concurrent connections (storm unlikely)
- Applications using managed WebSocket services (Pusher, Ably) that handle this server-side
- Local development environments

## Best Practices (Why)
- **Implement jitter with exponential backoff**: `sleep(random(0, min(cap, base * 2^n)))`—exponential backoff alone causes synchronized retry waves; jitter breaks synchronization
- **Rate limit the auth endpoint**: `/broadcasting/auth` is the choke point; apply `throttle` middleware (e.g., 60 requests per minute per IP) to protect the entire application
- **Use rolling deployments with connection draining**: Never restart all Reverb instances simultaneously—drain existing connections via Supervisor's `stopwaitsecs` before shutdown
- **Pre-warm authorization caches**: Before planned deployments, pre-populate auth caches to prevent a cache stampede during the reconnection storm

## Architecture Guidelines
- Configure Echo with explicit reconnection options: `activityTimeout`, `pongTimeout`, `unavailableTimeout`
- Set `max_connections_per_ip` in Reverb config to prevent individual IP abuse
- Implement a circuit breaker pattern: if the auth endpoint returns 429/503, increase the client's backoff multiplier
- Configure Supervisor `stopwaitsecs` to allow in-flight connections to drain (should match `activity_timeout`)

## Performance Considerations
- Auth endpoint throughput determines maximum sustainable reconnect rate
- PHP-FPM process pool must be sized to handle auth storm plus normal HTTP traffic
- Queue workers must handle the broadcast event backlog accumulated during the outage
- Database connection pool must accommodate auth callback queries during the storm
- Redis pub/sub may buffer events published during the reconnection window

## Security Considerations
- Rate limiting on the auth endpoint prevents DoS during reconnection storms
- `max_connections_per_ip` prevents individual IP abuse and limits storm impact from a single source
- Circuit breaker patterns prevent auth endpoint from being overwhelmed by retries
- Aggressive rate limiting may reject legitimate reconnect attempts—tune thresholds carefully

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Backoff without jitter | Clients still reconnect in synchronized waves | Not understanding that exponential backoff alone produces wave patterns | Peak load still overwhelms the server | Add full jitter: `random(0, backoffValue)` |
| No rate limiting on auth | Auth endpoint is first to fail under storm | Missing middleware configuration | Entire auth pipeline collapses | Apply `throttle` middleware to `/broadcasting/auth` |
| Restarting all instances simultaneously | Full reconnection storm on every deployment | Not configuring rolling restarts | Production downtime during deployments | Use rolling deployments with connection draining |
| stopwaitsecs too low | Connections killed abruptly without drain | Default Supervisor config not tuned | Clients cannot reconnect gracefully | Set stopwaitsecs to at least 2x activity_timeout |
| No cache pre-warming | Auth cache stampede during reconnection | Cache entries expire during maintenance window | Database overload from auth queries | Pre-warm auth caches before planned deployments |

## Anti-Patterns
- **Infinite reconnect loop**: Auth endpoint returns 5xx, clients retry with backoff, server never recovers because it's still handling retries—implement a circuit breaker
- **Thundering herd at auth**: Cached auth decisions expire simultaneously during storm, causing mass database queries—use cache stampede prevention (mutex, early recomputation)
- **Load balancer snowball**: Health checks fail on overloaded Reverb instances, load balancer removes them, routing traffic to remaining instances which then also overload

## Examples

### Client-side jitter implementation
```javascript
// Echo reconnection configuration
const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    activityTimeout: 30000,
    pongTimeout: 5000,
    unavailableTimeout: 10000,
});

// Custom reconnection with jitter (if using pusher-js directly)
function reconnectWithJitter(attempt) {
    const base = 1000; // 1 second base
    const cap = 30000; // 30 second cap
    const backoff = Math.min(cap, base * Math.pow(2, attempt));
    const jitter = Math.random() * backoff;
    return jitter;
}
```

### Server-side rate limiting for auth
```php
// In routes/api.php or routes/channels.php
Route::post('/broadcasting/auth', function (Request $request) {
    return Broadcast::auth($request);
})->middleware('throttle:60,1');
```

## Related Topics
- K14: Sticky Sessions & Load Balancing for WebSocket
- K36: Auth Endpoint Optimization & Caching
- K27: Supervisor & Production Process Management
- K05: Reverb Connection Lifecycle & State Management

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- Reconnection storms are one of the top three production failure modes for Reverb deployments
- Rolling deployments with connection draining are the single most effective server-side mitigation
- The combination of client jitter, server rate limiting, and rolling deployments provides defense in depth

## Verification
- [ ] Echo configured with explicit reconnection options (activityTimeout, pongTimeout, unavailableTimeout)
- [ ] Jitter implemented on client side (`Math.random() * backoffValue`)
- [ ] `max_connections_per_ip` set in Reverb config
- [ ] `/broadcasting/auth` rate limited with throttle middleware
- [ ] Auth caches pre-warmed before planned deployments
- [ ] Circuit breaker pattern implemented for auth endpoint 429/503 responses
- [ ] Rolling deployments configured with connection draining
- [ ] Supervisor `stopwaitsecs` matches `activity_timeout`
