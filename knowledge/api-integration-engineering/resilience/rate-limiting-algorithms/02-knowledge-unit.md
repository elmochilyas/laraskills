# Metadata
Domain: API Integration Engineering
Subdomain: Resilience & Reliability Patterns
Knowledge Unit: Rate Limiting Algorithms (Token Bucket, Sliding Window, Fixed Window)
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
Rate limiting algorithms control the rate of outbound API requests to respect upstream service limits and prevent 429 responses. The three fundamental algorithms—token bucket, sliding window, and fixed window—offer different trade-offs between accuracy, memory usage, and burst behavior. Token bucket allows controlled bursts, sliding window provides precise rate tracking, and fixed window is simplest but allows edge bursts at window boundaries. Production Laravel integrations implement rate limiting at multiple layers: HTTP client, queue, and dedicated middleware.

## Core Concepts
- **Token Bucket**: Tokens refill at a fixed rate (e.g., 10 tokens/second); each request consumes a token; burst capacity equals bucket size
- **Sliding Window Log**: Timestamped request log within a sliding window; count requests in the window to enforce limit
- **Sliding Window Counter**: Coarser approach using sub-windows (e.g., 1/10th of window) for approximate counting
- **Fixed Window**: Reset counter at window boundaries (e.g., 1000 requests per hour); simple but allows edge spikes
- **Rate Limit Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`
- **429 Too Many Requests**: Standard HTTP response indicating rate limit exceeded; includes `Retry-After` header

## Mental Models
- **Token Bucket as Bank Account**: Tokens are money deposited at a regular salary (refill rate); you can save up to a maximum balance (burst)
- **Sliding Window as Conveyor Belt**: Requests enter on one side, exit after window duration; count what's on the belt
- **Fixed Window as Hourglass**: Flip the hourglass every window; all requests within that interval count toward the limit

## Internal Mechanics
- Token Bucket: `$tokens = min($capacity, $tokens + $elapsed * $refillRate); $tokens >= 1` → allow
- Sliding Window Log: Store timestamps in a sorted set; count `ZCOUNT(log, now - window, now)` → compare
- Sliding Window Counter: Two counters (current and previous sub-window); weighted estimate: `$previous * ($window - $elapsed) / $window + $current`
- Fixed Window: `INCR counters:service:window` → if result > limit, reject
- Redis `CL.THROTTLE` implements token bucket natively with Lua scripting
- Laravel `Cache::lock()` combined with atomic increments implements distributed rate counts

## Patterns
- **Redis-Backed Rate Limiter**: Use Redis sorted sets (sliding window) or atomic counters (fixed window) for distributed limiting
- **Per-Service Buckets**: Separate rate limiters per upstream API, each calibrated to that service's limits
- **Rate Limit Retry**: On 429 response, pause all requests for that service for `Retry-After` duration
- **Backpressure Propagation**: Queue jobs check rate limit before processing; if exceeded, release back with delay
- **Rate Limit Headroom Monitoring**: Track `X-RateLimit-Remaining` and alert when below threshold
- **Gradual Backoff**: Preemptively slow request rate when approaching the limit (before hitting 429)

## Architectural Decisions
- Use token bucket for APIs with documented capacity (allows bursts within capacity)
- Use sliding window for precise enforcement where bursts must be strictly limited
- Use fixed window only for simple or internal rate limits where edge spikes are acceptable
- Prefer Redis-backed implementations over file/database for distributed and performant rate limiting
- Implement rate limiting at both the HTTP client layer (Saloon plugin) and queue layer (job middleware)
- Set local safety margin: limit to 80% of upstream limit to avoid hitting 429 at traffic peaks

## Tradeoffs
- Token bucket allows bursts but may exceed window-based limits on upstream
- Sliding window is most accurate but uses more memory (timestamp per request)
- Fixed window is memory-efficient but allows 2x traffic at boundaries
- Server-side rate limiting (controlling outgoing rate) vs client-side (reacting to 429) serve different purposes
- Redis-backed limiters add network round-trip; local in-memory limiters are faster but not distributed

## Performance Considerations
- Token bucket operations: 2 Redis calls (check + consume) per request ~2-5ms
- Sliding window log: `ZADD` + `ZREMRANGEBYSCORE` + `ZCARD` = 3 Redis calls, O(log n) for sorted set operations
- Fixed window: single `INCR` with TTL = 1 Redis call, fastest option
- Redis `CL.THROTTLE` executes as Lua script atomically, single round trip
- In-memory rate limiters (array counters) are sub-microsecond but not shared across workers

## Production Considerations
- Use Redis for all production rate limiters (file/database are too slow and not distributed)
- Monitor 429 response rates from upstream as a lagging indicator of rate limit configuration
- Set up headroom alerts: warn when `X-RateLimit-Remaining` drops below 10% of limit
- Implement graceful degradation: reduce request concurrency when approaching limits
- Use different rate limit configurations per environment (staging has lower limits on test accounts)
- Log rate limit state periodically for capacity planning and incident analysis

## Common Mistakes
- Implementing rate limiting only client-side (reacting to 429) without proactive server-side limiting
- Using a single global rate limit counter when each API key/token has its own limit
- Not resetting rate limit counters when API credentials change
- Forgetting to handle `Retry-After` header in custom rate limiter implementations
- Relying on `sleep()` between requests in queue jobs (blocks the worker; use `release()` with delay instead)
- Over-engineering rate limiting before the upstream actually enforces limits

## Failure Modes
- Rate limiter cache outage: all requests pass with no limit, causing potential upstream ban
- Clock skew: window-based limiters misbehave when server time jumps
- Token bucket overflow: `$tokens` calculation exceeds PHP float precision on long idle periods
- Redis memory exhaustion: sliding window log stores timestamps for every request (can grow unbounded)
- Race condition: distributed increments may exceed limit by a few requests (usually acceptable)

## Ecosystem Usage
- Redis `CL.THROTTLE` command (Redis Stack) implements token bucket natively
- Kong, AWS API Gateway, and Envoy proxy all implement rate limiting at the gateway level
- SaloonPHP rate limit plugin provides Laravel-native token bucket rate limiting per connector
- Laravel's `Cache::lock()` pattern is commonly used for distributed throttling in queue jobs
- Token bucket and sliding window are the dominant algorithms used by major API providers (GitHub, Stripe, Twitter)

## Related Knowledge Units
- K025: Rate Limit Plugin for SaloonPHP (Laravel implementation)
- K005: Retry Strategies (429 handling integrates with retry)
- K007: Circuit Breaker Pattern (rate limits should not trip circuit breaker)
- K017: Concurrency Pools (concurrency must respect rate limits)
- K008: Rate Limiting Algorithms (this document)

## Research Notes
- Redis blog "API Throttling: Algorithms, Patterns & Mistakes" provides detailed comparison of algorithms
- Token bucket is recommended by AWS and Google for client-side rate limiting
- Sliding window counter (weighted estimate) is a good compromise: accurate within ~3% with 1/10th sub-windows
- The IETF draft "Rate Limit Header Fields for HTTP" standardizes `RateLimit-*` headers
- Most upstream APIs use token bucket internally; client-side token bucket harmonizes well
