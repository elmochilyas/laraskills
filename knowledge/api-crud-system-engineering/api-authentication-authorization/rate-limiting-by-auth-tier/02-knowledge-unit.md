# Rate Limiting by Auth Tier

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
Rate limiting by authentication tier assigns different API rate limits based on the client's authentication status and subscription level. Unauthenticated (guest) requests get the most restrictive limits, authenticated users get moderate limits, premium subscribers get higher limits, and internal services/machine-to-machine clients get the highest limits. This tiered approach incentivizes authentication, enables API monetization, protects infrastructure, and ensures fair resource allocation across different client types.

## Core Concepts
- **Auth tier**: The authentication/subscription level of the requester: guest, authenticated user, premium user, internal service.
- **Rate limit scope**: The granularity at which limits are applied: per IP, per user ID, per API key, per token.
- **Tier multiplier**: A multiplier applied to a base rate limit. Guest: 1x, User: 10x, Premium: 100x, Service: 1000x.
- **Burst vs sustained limits**: Short-term burst limits (per minute) vs long-term sustained limits (per hour/day).
- **Over-limit behavior**: HTTP 429 response with `Retry-After` header. Optionally, queue the request for later processing.

## Mental Models
- **Auth tiers as highway lanes**: Guests are in the local road (slow, many stops). Users are in the express lane (faster). Premium is in the HOV lane (fastest). Services get a dedicated lane.
- **Rate limit as budget**: Each tier has a daily budget of API calls. When exhausted, the client must wait for the budget to reset.
- **Tier as capacity allocation**: You have a fixed server capacity. Auth tiers divide this capacity among different client classes proportionally.

## Internal Mechanics
- Laravel's `RateLimiter` facade provides the core rate limiting engine, backed by the cache (Redis recommended).
- A rate limiter named by the developer maps to a closure that returns a `Limit` instance.
- The `Limit::perMinute($maxAttempts)->by($key)` method defines the limit and the key that identifies the consumer.
- For tiered limiting, the `$maxAttempts` varies by tier, and the `$key` includes the user ID or IP.
- `RateLimiter::hit()` increments the counter; `RateLimiter::attempts()` checks remaining; `RateLimiter::availableIn()` returns retry-after seconds.

## Patterns
- **Tier resolver middleware**: Middleware that identifies the tier and injects it into the rate limiter configuration:
  ```php
  $tier = match(true) {
      $request->user()?->isPremium() => 'premium',
      $request->user() => 'user',
      default => 'guest',
  };
  ```
- **Named rate limiters per tier**: Define multiple rate limiters:
  ```php
  RateLimiter::for('api-guest', fn() => Limit::perMinute(30)->by('guest:'.$request->ip()));
  RateLimiter::for('api-user', fn() => Limit::perMinute(300)->by('user:'.$request->user()->id));
  RateLimiter::for('api-premium', fn() => Limit::perMinute(3000)->by('premium:'.$request->user()->id));
  ```
- **Dynamic limit based on user**: Single rate limiter with dynamic limit:
  ```php
  RateLimiter::for('api', function ($request) {
      $limits = [
          'guest' => Limit::perMinute(30),
          'user' => Limit::perMinute(300),
          'premium' => Limit::perMinute(3000),
      ];
      $tier = resolveTier($request);
      return $limits[$tier];
  });
  ```
- **Multiple limit buckets**: Apply both per-minute AND per-hour limits:
  ```php
  return [
      Limit::perMinute(300),
      Limit::perHour(5000),
  ];
  ```
- **Concurrent request limiting**: Limit the number of in-flight requests (not just rate):
  ```php
  Limit::concurrent(10)->by($key);
  ```

## Architectural Decisions
1. **IP vs User vs Token scoping**: Guest limits scope by IP. Authenticated limits scope by user ID. Service limits scope by API key. IP-based guest limits prevent one user from exhausting the guest pool.
2. **Tier detection point**: Detect tier at middleware layer, not in the controller. This keeps rate limiting transparent to business logic.
3. **Response headers**: Include `X-RateLimit-Limit` (tier max), `X-RateLimit-Remaining` (tier remaining), and `X-RateLimit-Tier` (current tier) for transparency.
4. **Fallback on auth failure**: If authentication fails mid-request, fall back to guest tier limits. Do not bypass rate limiting.

## Tradeoffs (table)
| Aspect | IP-based (guest) | User ID-based (authenticated) | API Key-based (service) |
|--------|-----------------|------------------------------|------------------------|
| Identity reliability | Low (NAT, shared IPs) | High (unique per user) | High (unique per service) |
| Evasion difficulty | Easy (VPN, IP rotation) | Hard (requires credentials) | Hard (requires key compromise) |
| Fairness | Poor (one user can consume many IPs) | Good (per-user limit) | Excellent (per-service limit) |
| Granularity | Coarse | Fine | Fine |
| Bypass via spoofing | Easy (IP spoofing) | Difficult | Difficult |

## Performance Considerations
- Each rate-limited request performs a cache (Redis) INCR operation — very fast (sub-millisecond).
- Redis-backed rate limiting handles millions of requests per day on modest hardware.
- For multi-bucket limits (per-minute + per-hour), each bucket generates a separate cache call. Batch pipeline calls in high-throughput scenarios.
- The rate limiter key should include a timestamp window to avoid unbounded key growth in Redis: `api:rate:user:123:2026-06-02:11`.
- Use Redis TTL to auto-expire old rate limit keys. Set TTL equal to the window duration + 1 minute.

## Production Considerations
- **Tier limits documentation**: Publish the exact rate limits for each tier in the API documentation. Include formulas for how limits scale.
- **Graceful degradation**: When a tier's rate limit is exceeded, return 429 with a clear error message, the retry-after time, and a link to upgrade.
- **Rate limit monitoring**: Track 429 response rates per tier. A spike in guest 429s may indicate an attack; a spike in premium 429s may indicate a need for tier limit adjustment.
- **Tier limit overrides**: Allow per-customer limit overrides (e.g., enterprise customers get custom limits). Store overrides in the database and load them in the rate limiter.
- **Burstable limits**: Allow short bursts above the limit (e.g., 30 requests in 1 minute with a 1-second refill rate) using the token bucket algorithm.
- **Rate limit exemption**: Internal services (monitoring, health checks) should be exempt from rate limits. Identify via API key prefix or IP whitelist.

## Common Mistakes
- Rate limiting health check/readiness endpoints (they should always respond).
- Using IP-based limiting for authenticated users when user ID is available (unfair to users behind NAT).
- Not distinguishing between GET (read) and POST (write) rate limits — writes should typically have lower limits.
- Applying the same limit to all tiers — defeats the purpose of tiered limiting.
- Not including the tier in the rate limit response headers, leaving clients confused about their limit.
- Rate limit key collisions (e.g., user ID 1 and service ID 1 share the same key).
- Implementing rate limiting after resource-intensive operations (rate limiting should be early in the middleware stack).

## Failure Modes
1. **Cache outage**: Redis goes down and rate limiting stops working → unlimited requests hit the API. Solution: Implement a circuit breaker or fallback to file-based limiting.
2. **Tier misclassification**: A premium user is misclassified as a guest due to token validation failure. Solution: Validate authentication before rate limiting, or default to the lower tier.
3. **Rate limit key collision**: Different services using the same API key ID produce the same rate limit key. Solution: Prefix rate limit keys with the key type (user:, service:, ip:).
4. **Shared IP abuse**: Multiple legitimate users behind a corporate NAT share one IP. All are rate-limited as a single guest. Solution: Encourage authentication; authenticate via other means (SSO headers).
5. **Distributed denial of service via guest tier**: Attackers use millions of IPs to exhaust guest tier resources. Solution: Implement additional DDoS protection (WAF, challenge) beyond rate limiting.

## Ecosystem Usage
- **GitHub API**: Tiered rate limits — unauthenticated: 60/hr; authenticated: 5,000/hr; GitHub App: up to 15,000/hr.
- **Twitter/X API**: Free, Basic, Pro, Enterprise tiers with progressively higher limits.
- **Stripe API**: No published tiered limits but uses API key-based rate limiting with different thresholds for live and test keys.

## Related Knowledge Units
### Prerequisites
- Laravel RateLimiter facade
- Cache drivers (Redis)

### Related Topics
- [rate-limiter-definition](./phase-2/10-rate-limiter-definition.md)
- [rate-limit-headers](./phase-2/11-rate-limit-headers.md)
- [ip-based-rate-limiting](./phase-2/14-ip-based-rate-limiting.md)

### Advanced Follow-up Topics
- Token bucket vs Leaky bucket algorithm comparison
- Distributed rate limiting with Redis Cluster
- API monetization strategies based on rate tiers

## Research Notes
### Source Analysis
Laravel `Illuminate\Cache\RateLimiter` and `Illuminate\Routing\Middleware\ThrottleRequests` are the core implementations. The `throttle` middleware can accept multiple named limiters.

### Key Insight
The most effective tiered rate limiting strategy combines IP-based limits for guests with user-ID-based limits for authenticated users. This provides a baseline defense (IP limits) while rewarding authentication (higher limits per user ID). Premium tiers should use user-ID limits with higher thresholds — not IP limits, as premium users may access from multiple IPs.

### Version-Specific Notes
- **Laravel 8+**: `RateLimiter::for()` with named limiters. The `throttle` middleware accepts limiter names.
- **Laravel 10+**: Support for returning an array of `Limit` instances from a rate limiter definition (multiple buckets).
- **Laravel 11**: The `RateLimiter` facade remains unchanged. New cache backends may improve performance.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.