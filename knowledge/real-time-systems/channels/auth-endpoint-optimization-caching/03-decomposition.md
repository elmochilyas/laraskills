# Decomposition: Auth Endpoint Optimization Caching

## Topic Overview
The `/broadcasting/auth` endpoint is a critical performance bottleneck in Laravel's broadcasting system, especially during reconnection storms when thousands of clients simultaneously request channel authorization. Each request requires user authentication (session/token resolution) and authorization callback execution (database queries, permission checks). Without optimization, slow auth endpoints cascade into application-wide degradation. Key optimization strategies include: caching authori...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
channel-types-authorization/K36-auth-endpoint-optimization-caching/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Auth Endpoint Optimization Caching
- **Purpose:** The `/broadcasting/auth` endpoint is a critical performance bottleneck in Laravel's broadcasting system, especially during reconnection storms when thousands of clients simultaneously request channel authorization. Each request requires user authentication (session/token resolution) and authorization callback execution (database queries, permission checks). Without optimization, slow auth endpoints cascade into application-wide degradation. Key optimization strategies include: caching authori...
- **Difficulty:** Advanced
- **Dependencies:
  - K12: Channel Authorization (routes/channels.php)
  - K15: Reconnection Strategies & Storm Mitigation
  - K29: Private Channel Auth with JWT/Sanctum
  - K14: Sticky Sessions & Load Balancing for WebSocket

## Dependency Graph
**Depends on:**
  - K12: Channel Authorization (routes/channels.php)
  - K15: Reconnection Strategies & Storm Mitigation
  - K29: Private Channel Auth with JWT/Sanctum
  - K14: Sticky Sessions & Load Balancing for WebSocket

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Auth decision caching**: Cache authorization results with appropriate TTL using Laravel's cache system**Minimal callback logic**: Use simple ID comparisons where possible; avoid database queries except where necessary**Fast guard resolution**: Use token-based guards (Sanctum, JWT) over session-based for stateless, cacheable auth**Rate limiting per guard**: Apply different rate limits for web session vs. API token auth requests**Pre-warming auth cache**: On application boot, warm common authorization decisions for known channel patterns**Synchronous auth flow**: Auth is not queued—it blocks the WebSocket subscription; optimize for latency**No built-in caching**: The framework provides no caching layer for auth decisions; it's the developer's responsibility**Auth at subscription time only**: Authorization is checked once at subscription time, not per-event**Cache invalidation complexity**: Permission changes don't take effect until cache expires or is manually invalidated**Memory vs. speed**: Caching auth decisions uses memory (Redis/Memcached) to reduce database load**Granularity tradeoff**: Cache per-user or per-channel—fine-grained caching has higher hit rates but more keys**Stale permissions**: Cached auth decisions may serve stale results if user permissions change between cache writesEach auth request typically involves: middleware stack (session, CSRF), guard resolution, database query (user lookup), callback execution (additional queries)Target auth endpoint response time: <50ms at P95 under loadDatabase queries in auth callbacks are the primary bottleneck; each callback should execute at most 1 queryModel route-model binding adds a database query per auth requestRedis-based cache lookup adds ~1-3ms; database queries add 5-50ms depending on complexityDuring reconnection storms, auth endpoint throughput must match peak reconnect rateApply rate limiting middleware to `Broadcast::routes()` (e.g., `throttle:60,1` per IP)Use dedicated rate limiter configuration for auth endpoint vs. other API routesCache authorization results: `Cache::remember("auth:channel:{$channelName}:user:{$user->id}", 300, fn() => ...)`Use simple cache keys that can be invalidated in bulk when permissions changeMonitor auth endpoint metrics: request rate, P50/P95/P99 latency, error rateConsider using a dedicated route group with optimized middleware (e.g., skip CSRF for token-based auth)Set up alerting when auth endpoint P95 latency exceeds 200msLoad test auth endpoint with realistic reconnection storm patternsPerforming multiple database queries in auth callbacks (user lookup + permission query + role check)Not caching auth decisions when the authorization logic is expensiveUsing default throttle settings (60 requests/minute) which are too low for reconnection stormsForgetting that reconnection storms affect both auth endpoint and database simultaneouslyNot separating auth endpoint metrics from other application metrics in monitoring**Auth endpoint overload**: Reconnection storm overwhelms PHP-FPM workers; all applications (not just broadcasting) slow down**Database connection pool exhaustion**: Auth endpoint database queries exhaust available connections**Cache stampede**: Cache entries expire simultaneously during a reconnection storm, causing mass database queries**Rate limiting false positives**: Legitimate reconnection traffic gets rate-limited, preventing clients from reconnecting**Session store overload**: Session-based auth during storms overloads the session storage backendRequired configuration for any Laravel app with private or presence channels at scaleCritical for applications with frequent reconnection patterns (mobile apps, unstable networks)Essential for live event platforms where thousands of users join at scheduled timesImportant for chat applications with high user churnRelevant for collaborative editing platforms with auth per documentK12: Channel Authorization (routes/channels.php)K15: Reconnection Strategies & Storm MitigationK29: Private Channel Auth with JWT/SanctumK14: Sticky Sessions & Load Balancing for WebSocket

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