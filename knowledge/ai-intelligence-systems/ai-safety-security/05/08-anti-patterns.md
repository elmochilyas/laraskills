# Anti-Patterns: Rate Limiting & Abuse Prevention

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-05 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Safety & Security |
| **Type** | Operations |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Hardcoded Rate Limits](#1-hardcoded-rate-limits)
2. [Punitive Throttling](#2-punitive-throttling)
3. [No Limit Visibility](#3-no-limit-visibility)
4. [Synchronous Blocking in Rate Limiting](#4-synchronous-blocking-in-rate-limiting)
5. [Single Rate Limiter for All Traffic](#5-single-rate-limiter-for-all-traffic)

---

## 1. Hardcoded Rate Limits

### Category
Configuration Rigidity

### Description
Embedding rate limit values directly in code rather than making them configurable per environment and per plan tier. Limits that work for development are inappropriate for production; limits for free-tier users differ from enterprise users. Hardcoded limits require code changes and deploys to adjust, making tuning impossible without downtime.

### Why It Happens
- Initial implementation speed: constants are faster than configuration
- No consideration of multi-environment deployment
- Single-plan product initially (everyone gets the same limits)
- Configuration infrastructure feels like overhead for "simple" values

### Warning Signs
- Rate limit values are defined as PHP constants or class constants
- No environment-based override mechanism exists
- Different user plans cannot have different limits
- Changing limits requires a deployment
- The same limit values exist in dev, staging, and production

### Why Harmful
- Cannot tune limits based on production traffic patterns without deploys
- Free-tier and enterprise users receive identical treatment
- Staging environment limits don't reflect production capacity
- Emergency limit adjustments (under attack) require urgent deploys
- Configuration drift when different environments need different limits

### Real-World Consequences
- DDoS attack cannot be mitigated because limit changes require deployment
- Enterprise customer's contract-specified limits are hardcoded at free-tier levels
- Production traffic reveals limits are too restrictive, but adjustments wait for next sprint
- Performance testing in staging uses development limits, giving false results

### Preferred Alternative
Store rate limit values in configuration files (config/rate-limiting.php) with environment variable overrides. Make limits configurable per plan tier and per endpoint group. Support hot-reload where possible.

```php
// config/rate-limiting.php
return [
    'plans' => [
        'free' => [
            'requests_per_minute' => env('RATE_LIMIT_FREE_RPM', 10),
            'tokens_per_hour' => env('RATE_LIMIT_FREE_TPH', 10000),
        ],
        'enterprise' => [
            'requests_per_minute' => env('RATE_LIMIT_ENTERPRISE_RPM', 1000),
            'tokens_per_hour' => env('RATE_LIMIT_ENTERPRISE_TPH', 1000000),
        ],
    ],
];
```

### Refactoring Strategy
1. Extract all hardcoded limit values into configuration files
2. Define plan tiers with per-tier limits
3. Add environment variable overrides for each limit
4. Implement a plan resolution service that maps users to their plan's limits
5. Remove hardcoded constants after migration

### Detection Checklist
- [ ] No hardcoded rate limit values in application code
- [ ] Limits are configurable per environment
- [ ] Different plans have different limit configurations
- [ ] Limit changes do not require code deployment

### Related Rules/Skills/Trees
- Skill: Implement Rate Limiting and Abuse Prevention
- Decision Tree: Performance & Optimization

---

## 2. Punitive Throttling

### Category
User Experience Failure

### Description
Implementing rate limiting that degrades user experience to unacceptably slow speeds instead of providing clear blocks with reset timing. For example, reducing a user's request rate to 1 request per minute indefinitely rather than returning a 429 and resetting after the window expires. This creates a confusing, frustrating experience where users don't know if the system is broken or rate-limited.

### Why It Happens
- Misguided "kindness": trying to let users keep using the system rather than blocking
- No understanding that degradation without explanation is worse than blocking
- Implementation simplicity: throttling is just slowing down; blocking requires proper responses
- Fear of user backlash from hard blocks

### Warning Signs
- Rate-limited users experience extreme slowness instead of clear errors
- Users report "the system is broken" when they're actually rate-limited
- No `429` status code or `Retry-After` header in rate-limited responses
- Users cannot tell if they're rate-limited or the system is malfunctioning
- Support tickets about "slow performance" are actually rate-limiting issues

### Why Harmful
- Users don't know they've exceeded limits and cannot correct behavior
- Legitimate users on shared IPs suffer alongside abusive ones
- Debugging is confusing: rate limiting looks like performance issues
- No clear signal to client applications to back off
- Abusive users don't learn the limit boundaries, so they keep probing

### Real-World Consequences
- Users abandon the platform thinking it's slow, not realizing they're rate-limited
- API clients keep retrying into degraded service, causing resource exhaustion
- Support team investigations waste time on "performance issues" that are rate limits
- No abuse deterrence: attackers don't see clear blocks, so they keep probing

### Preferred Alternative
Return clear `429 Too Many Requests` responses with `Retry-After` header and a descriptive message explaining the limit exceeded. Let the client decide how to handle the block rather than silently degrading.

```php
return response()->json([
    'error' => 'Rate limit exceeded.',
    'message' => 'You have exceeded the limit of 10 requests per minute. Please wait before making additional requests.',
    'retry_after' => $seconds,
], 429)->header('Retry-After', $seconds);
```

### Refactoring Strategy
1. Replace throttling with clear block responses (429)
2. Add `Retry-After` headers to all rate-limited responses
3. Implement progressive warnings: warn at 80%, 90%, 95% usage before blocking
4. Add rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining) to all responses
5. Remove throttling code after confirming blocks work correctly

### Detection Checklist
- [ ] Rate-limited requests return 429 status, not degraded performance
- [ ] Retry-After header is present in 429 responses
- [ ] Rate limit headers inform clients of their usage
- [ ] Progressive warnings precede hard blocks

### Related Rules/Skills/Trees
- Skill: Implement Rate Limiting and Abuse Prevention

---

## 3. No Limit Visibility

### Category
Transparency Failure

### Description
Not exposing rate limit information to users or client applications until they exceed the limit and are blocked. Users have no way to know their current usage, remaining budget, or when limits will reset. This prevents proactive consumption management and creates surprise blocks.

### Why It Happens
- Implementation oversight: focus on limit enforcement, not limit communication
- Security concern: fear that exposing rate limit state helps attackers
- No client-side rate limit handling expected
- API design: headers are considered optional, not integral

### Warning Signs
- API responses lack `X-RateLimit-*` headers
- Users discover rate limits only when they receive 429 errors
- Developer dashboard shows no rate limit usage statistics
- No API endpoint exists to query current usage
- Clients cannot implement client-side throttling because they lack data

### Why Harmful
- Users cannot pace their consumption to stay within limits
- Client applications make requests they could avoid with visibility
- Surprise blocks feel arbitrary and unfair
- No data for users to optimize their usage patterns
- Enterprises cannot audit their consumption against contracts

### Real-World Consequences
- Batch processing jobs fail mid-way due to unexpected rate limit blocks
- Integration developers complain about undocumented limit behavior
- High-value users churn after being blocked without warning
- Support team spends time explaining rate limits that should be transparent

### Preferred Alternative
Include rate limit headers in all API responses: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`. Provide a usage dashboard and an API endpoint for checking limits. Send proactive warnings approaching limits.

### Refactoring Strategy
1. Add `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers to all responses
2. Create a `/api/limits` endpoint showing current usage and limits
3. Implement progressive warning notifications (email, in-app) at 80% usage
4. Add rate limit usage to developer dashboard
5. Document rate limit policies and header meanings

### Detection Checklist
- [ ] Rate limit headers present in all API responses
- [ ] Users can check their current usage programmatically
- [ ] Proactive warnings precede hard blocks
- [ ] Rate limit usage is visible in developer dashboard

### Related Rules/Skills/Trees
- Skill: Implement Rate Limiting and Abuse Prevention

---

## 4. Synchronous Blocking in Rate Limiting

### Category
Performance Anti-Pattern

### Description
Blocking the application request thread while performing rate limit checks against a remote store (Redis, database). Each request must wait for the rate limiter's round-trip before proceeding, adding latency to every request. In high-throughput systems, the rate limiter becomes a bottleneck that reduces overall throughput.

### Why It Happens
- Sequential code patterns: check-limit-then-process is the natural pattern
- No consideration of asynchronous alternatives
- Framework conventions encourage synchronous middleware patterns
- Redis is fast enough that latency seems negligible in development

### Warning Signs
- Rate limit check is the first operation in middleware, blocking request processing
- Each request adds 1-5ms for Redis round-trip rate limit check
- Under load, the rate limiter's synchronous calls become a bottleneck
- Request throughput drops as Redis connection pool is exhausted
- No pre-check or batch-checking strategy exists

### Why Harmful
- Every request pays the latency cost of rate limiting, even within limits
- Redis connection pool can be exhausted by rate limit checks under load
- Cannot scale to high throughput without rate limiter becoming the bottleneck
- Redis latency spikes directly translate to application latency
- The rate limiter adds latency to requests that will be allowed anyway

### Real-World Consequences
- P95 latency increases due to rate limit check overhead
- Redis connection pool exhaustion during traffic spikes
- Application cannot handle expected throughput due to rate limiter bottleneck
- Team considers removing rate limiting to fix performance (dangerous tradeoff)

### Preferred Alternative
Use local in-memory counters with periodic sync to Redis, or implement pre-check middleware that reads from a local cache. For distributed systems, use batched Redis calls (pipelining) and reduce per-request Redis round-trips.

### Refactoring Strategy
1. Implement local counters as the first line of defense (fast, no network)
2. Sync local counters to Redis asynchronously at set intervals
3. Use Redis pipelining for batch operations
4. Cache rate limit policy definitions locally with TTL
5. For extreme throughput, use Redis atomic operations with optimistic concurrency

### Detection Checklist
- [ ] Rate limit check does not block request processing for Redis round-trip
- [ ] Local counters reduce Redis calls for most requests
- [ ] Redis pipelining is used where synchronous operations are required
- [ ] Rate limiter is not a bottleneck under expected load

### Related Rules/Skills/Trees
- Skill: Implement Rate Limiting and Abuse Prevention
- Decision Tree: Performance & Optimization

---

## 5. Single Rate Limiter for All Traffic

### Category
Traffic Differentiation Failure

### Description
Using a single rate limiter configuration for all types of traffic regardless of their different characteristics. Interactive chat requests (low volume, high responsiveness) and batch processing requests (high volume, latency-tolerant) receive the same rate limits and window configurations. This either over-restricts batch processing or under-protects interactive endpoints.

### Why It Happens
- Initial simplicity: one rate limiter for one API endpoint
- No traffic profiling to understand different usage patterns
- Design oversight: not considering that different features need different limits
- Technical debt: the rate limiter was designed before feature differentiation

### Warning Signs
- All API endpoints share the same rate limit configuration
- Streaming endpoints have the same limits as HTTP request endpoints
- Batch processing jobs hit the same rate limiters as interactive users
- Admin endpoints have the same limits as public endpoints
- Cannot prioritize interactive traffic over batch traffic

### Why Harmful
- Interactive users are blocked because batch processing consumed the shared budget
- Batch processing is slowed to interactive speeds, taking too long
- No traffic prioritization: critical features compete with background jobs
- Hard to tune: limits that protect interactive endpoints cripple batch processing
- Cannot offer differentiated limits per feature or per endpoint

### Real-World Consequences
- Chat users receive 429 errors during batch processing runs
- Batch processing of training data takes 10x longer than needed
- Admin dashboard reports fail because they share limits with public API
- Cannot implement priority queuing because all traffic is equal

### Preferred Alternative
Implement per-endpoint, per-feature rate limit policies. Separate interactive traffic (low limit, short window) from batch traffic (high limit, long window). Use different limit groups for different features.

### Refactoring Strategy
1. Profile traffic patterns for each endpoint or feature group
2. Define rate limit groups: interactive, batch, admin, webhook
3. Assign each endpoint to the appropriate group
4. Configure per-group limits and window durations
5. Implement priority queuing where interactive traffic preempts batch traffic

### Detection Checklist
- [ ] Different endpoints have different rate limit configurations
- [ ] Interactive traffic is separated from batch traffic
- [ ] Admin endpoints have distinct limits from public endpoints
- [ ] Rate limit groups are configurable independently

### Related Rules/Skills/Trees
- Skill: Implement Rate Limiting and Abuse Prevention
- Decision Tree: Implementation Approach
