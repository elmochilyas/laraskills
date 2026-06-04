# Metadata
Domain: Real-Time Systems
Subdomain: Channel Types & Authorization
Knowledge Unit: Auth Endpoint Optimization & Caching
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
The `/broadcasting/auth` endpoint is a critical performance bottleneck in Laravel's broadcasting system, especially during reconnection storms when thousands of clients simultaneously request channel authorization. Each request requires user authentication (session/token resolution) and authorization callback execution (database queries, permission checks). Without optimization, slow auth endpoints cascade into application-wide degradation. Key optimization strategies include: caching authorization decisions, minimizing database queries in callbacks, using fast auth guards, implementing rate limiting, and distributing auth requests across queue workers. Monitoring auth endpoint latency and throughput is essential for maintaining real-time responsiveness at scale.

## Core Concepts
Channel authorization is a synchronous HTTP request within the WebSocket subscription flow. Every private and presence channel subscription blocks on the auth response. If the auth endpoint is slow, the client sees delayed subscription confirmation and potentially UI flickering. During reconnection storms (all clients disconnect and reconnect simultaneously), the auth endpoint receives a concentrated wave of requests. Without optimization, this wave can overwhelm the application servers, database, and queue system.

## Mental Models
The auth endpoint is the turnstile for all private/presence channel subscriptions. Each client must pass through this turnstile to enter the channel. During a rush hour (reconnection storm), the turnstile must handle its maximum throughput or clients queue up and experience delays.

## Internal Mechanics
BroadcastController::authenticate() resolves the authenticated user from the current request (via auth guards), extracts the channel name and parameters, matches against registered channel patterns, and invokes the matching callback. The callback typically performs authentication logic: comparing user IDs, querying database permissions, checking roles/gates. The entire process is synchronous within the HTTP request lifecycle. The response is a Pusher-compatible auth signature. For presence channels, the callback result (user data array) is serialized into the response.

## Patterns
- **Auth decision caching**: Cache authorization results with appropriate TTL using Laravel's cache system
- **Minimal callback logic**: Use simple ID comparisons where possible; avoid database queries except where necessary
- **Fast guard resolution**: Use token-based guards (Sanctum, JWT) over session-based for stateless, cacheable auth
- **Rate limiting per guard**: Apply different rate limits for web session vs. API token auth requests
- **Pre-warming auth cache**: On application boot, warm common authorization decisions for known channel patterns

## Architectural Decisions
- **Synchronous auth flow**: Auth is not queued—it blocks the WebSocket subscription; optimize for latency
- **No built-in caching**: The framework provides no caching layer for auth decisions; it's the developer's responsibility
- **Auth at subscription time only**: Authorization is checked once at subscription time, not per-event

## Tradeoffs
- **Cache invalidation complexity**: Permission changes don't take effect until cache expires or is manually invalidated
- **Memory vs. speed**: Caching auth decisions uses memory (Redis/Memcached) to reduce database load
- **Granularity tradeoff**: Cache per-user or per-channel—fine-grained caching has higher hit rates but more keys
- **Stale permissions**: Cached auth decisions may serve stale results if user permissions change between cache writes

## Performance Considerations
- Each auth request typically involves: middleware stack (session, CSRF), guard resolution, database query (user lookup), callback execution (additional queries)
- Target auth endpoint response time: <50ms at P95 under load
- Database queries in auth callbacks are the primary bottleneck; each callback should execute at most 1 query
- Model route-model binding adds a database query per auth request
- Redis-based cache lookup adds ~1-3ms; database queries add 5-50ms depending on complexity
- During reconnection storms, auth endpoint throughput must match peak reconnect rate

## Production Considerations
- Apply rate limiting middleware to `Broadcast::routes()` (e.g., `throttle:60,1` per IP)
- Use dedicated rate limiter configuration for auth endpoint vs. other API routes
- Cache authorization results: `Cache::remember("auth:channel:{$channelName}:user:{$user->id}", 300, fn() => ...)`
- Use simple cache keys that can be invalidated in bulk when permissions change
- Monitor auth endpoint metrics: request rate, P50/P95/P99 latency, error rate
- Consider using a dedicated route group with optimized middleware (e.g., skip CSRF for token-based auth)
- Set up alerting when auth endpoint P95 latency exceeds 200ms
- Load test auth endpoint with realistic reconnection storm patterns

## Common Mistakes
- Performing multiple database queries in auth callbacks (user lookup + permission query + role check)
- Not caching auth decisions when the authorization logic is expensive
- Using default throttle settings (60 requests/minute) which are too low for reconnection storms
- Forgetting that reconnection storms affect both auth endpoint and database simultaneously
- Not separating auth endpoint metrics from other application metrics in monitoring

## Failure Modes
- **Auth endpoint overload**: Reconnection storm overwhelms PHP-FPM workers; all applications (not just broadcasting) slow down
- **Database connection pool exhaustion**: Auth endpoint database queries exhaust available connections
- **Cache stampede**: Cache entries expire simultaneously during a reconnection storm, causing mass database queries
- **Rate limiting false positives**: Legitimate reconnection traffic gets rate-limited, preventing clients from reconnecting
- **Session store overload**: Session-based auth during storms overloads the session storage backend

## Ecosystem Usage
- Required configuration for any Laravel app with private or presence channels at scale
- Critical for applications with frequent reconnection patterns (mobile apps, unstable networks)
- Essential for live event platforms where thousands of users join at scheduled times
- Important for chat applications with high user churn
- Relevant for collaborative editing platforms with auth per document

## Related Knowledge Units
- K12: Channel Authorization (routes/channels.php)
- K15: Reconnection Strategies & Storm Mitigation
- K29: Private Channel Auth with JWT/Sanctum
- K14: Sticky Sessions & Load Balancing for WebSocket

## Research Notes
Auth endpoint optimization becomes critical above ~1000 concurrent connections. The recommendation from production Reverb deployments is to keep auth callback logic to simple ID comparisons and cache any database-backed authorization decisions. The bubble.ro deep-dive (May 2026) identified auth endpoint overload as a primary failure mode during reconnection storms. Redis-based caching provides the best balance of speed and invalidation flexibility. For extreme scale, some teams implement a dedicated auth endpoint on separate infrastructure from the main application.
