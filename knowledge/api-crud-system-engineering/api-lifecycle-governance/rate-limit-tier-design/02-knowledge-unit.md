# Rate Limit Tier Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
Rate limit tier design defines the structure of consumer tiers, per-tier limits, burst allowances, and quota management for API access. A well-designed tier system balances resource protection with consumer needs, enables monetization through tier upgrades, and provides predictable API behavior under load.

## Core Concepts
- **Consumer Tier:** A classification of API consumers with specific rate limits (e.g., Free, Pro, Enterprise).
- **Rate Limit:** Maximum number of requests per time window (e.g., 100 requests/second).
- **Burst Allowance:** Short-term spikes above the sustained rate limit (e.g., 200 requests burst for 10 seconds).
- **Quota:** Total number of requests allowed per billing period (e.g., 1M requests/month).
- **Throttle Window:** The time window over which the rate is measured (e.g., sliding 1-minute window).
- **429 Too Many Requests:** HTTP response returned when a rate limit is exceeded.
- **Rate Limit Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` informed to consumers.

## Mental Models
- **Highway Lanes:** Free tier is the local road (slow, shared); Pro tier is the express lane (faster, toll); Enterprise tier is a dedicated lane (guaranteed throughput). Each lane has a speed limit (rate) and a distance limit (quota).
- **Water Tower:** Each consumer has a water tower (bucket) that refills at a certain rate (leaky bucket algorithm). Burst allowance is the tower's overflow capacity — you can use more than the refill rate temporarily.

## Internal Mechanics
1. **Tier Assignment:** Each API key is associated with a tier (Free / Pro / Enterprise) at creation time.
2. **Rate Limit Tracking:** The rate limiter tracks request counts per consumer per time window using Redis sorted sets (sliding window) or counters (fixed window).
3. **Algorithm Application:** Token bucket (for bursts) or sliding window (for sustained rates) enforces limits.
4. **Header Injection:** After each request, the middleware injects `X-RateLimit-*` headers into the response.
5. **Limit Exceeded:** If the limit is exceeded, a `429 Too Many Requests` response is returned with `Retry-After` header.
6. **Quota Tracking:** A separate counter tracks monthly quota usage; reset at the billing cycle boundary.
7. **Tier Override:** Admins can temporarily override a consumer's tier for testing or incident response.

## Patterns
- **Sliding Window Log:** Maintain a sorted set of timestamps per consumer — accurate but memory-intensive.
- **Token Bucket:** Maintain a token count that refills at a fixed rate — allows bursts, simple to implement.
- **Hybrid Approach:** Sliding window for sustained limits; token bucket for burst allowance.
- **Tiered Header Feedback:** Include not just remaining count but also time-to-reset and tier name.
- **Graceful Degradation:** When approaching limits, slow down (increase latency) rather than hard-rejecting.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Algorithm | Fixed window / Sliding log / Token bucket | Hybrid (sliding window + token bucket) | Accurate sustained limits + burst support |
| Storage backend | In-memory / Redis / Database | Redis | Fast, scalable, supports atomic operations |
| Burst vs sustained | Burst allowed / Sustained only | Both (burst = 2x sustained for 10s) | Handles traffic spikes without false positives |
| Quota reset | Calendar / Rolling / Per-billing | Per-billing cycle (monthly) | Aligns with billing; predictable for consumers |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Fixed vs sliding window | Fixed window is simple but allows spikes at boundaries; sliding window is accurate but more complex |
| Burst vs no burst | Burst allows natural traffic patterns but can be abused; no burst is safe but rigid |
| Hard vs soft limits | Hard limits are predictable but frustrating; soft limits (warning + gradual slowdown) are flexible but less clear |

## Performance Considerations
- Redis rate limit check is ~2ms per request (INCR + EXPIRE for fixed window).
- Sliding window log uses O(window size) memory per consumer — for 1000 req/s per consumer, this adds up.
- Token bucket requires periodic refill — use Redis Lua scripts for atomic refill + consumption.
- Rate limit header computation is negligible — just reading the current counter.

## Production Considerations
- **Monitoring:** Alert on global rate limit hit rate > 1% (indicates consumers need higher tiers).
- **Logging:** Log rate limit hits (429) with consumer ID, tier, and endpoint for abuse analysis.
- **Backup:** Redis persistence ensures rate limit state survives restarts.
- **Rollback:** Tier limit changes should be gradual (new limits applied at 50% for 1 week, then 100%).
- **Testing:** Load test each tier to verify limits are enforced correctly; test both sustained and burst scenarios.

## Common Mistakes
- Using fixed-window rate limiting without considering boundary spikes (consumer gets 2x requests at window edges).
- Setting burst allowances too high (effectively no rate limit for short periods).
- Not providing `Retry-After` headers (consumers cannot implement proper backoff).
- Using the same limits for all endpoints (read endpoints should have higher limits than write).
- Resetting monthly quotas on the 1st of every month (all consumers hit at once — thundering herd).

## Failure Modes
- **Redis Outage:** Rate limiter data unavailable → all requests pass (no enforcement) or all requests fail (overly strict). Mitigation: circuit breaker falls back to local in-memory limiting.
- **Tier Misconfiguration:** A consumer accidentally assigned the wrong tier → too restrictive or too permissive. Mitigation: tier change audit trail and automated verification.
- **Quota Reset Storm:** All consumers' quotas reset simultaneously → everyone bursts at once. Mitigation: stagger quota resets by consumer ID hash.
- **Distributed Rate Limit Skew:** Rate limit counters across regions are not synchronized → consumers get 2x limits. Mitigation: use a global Redis cluster.

## Ecosystem Usage
- **Stripe:** Per-second rate limits with clear tier definitions and `Retry-After` headers.
- **GitHub API:** Per-hour rate limits differentiated by authentication (unauthenticated: 60/hr; authenticated: 5000/hr).
- **Twilio:** Per-second rate limits with burst allowances; tier upgrades available via support.

## Related Knowledge Units

### Prerequisites
- [Backward Compatibility Policy](ku-04-backward-compatibility-policy)
- [API Usage Tracking](ku-16-api-usage-tracking)

### Related Topics
- [Idempotency Key Design](ku-10-idempotency-key-design)
- [Request Size Limits](ku-14-request-size-limits)

### Advanced Follow-up Topics
- Distributed rate limiting with Redis Cluster
- Rate limit analytics and consumer behavior heatmaps
- Adaptive rate limiting (dynamic limits based on system load)

## Research Notes

### Source Analysis
The IETF standard `RateLimit` header fields (RFC draft) are becoming the industry standard. Stripe and GitHub use similar header formats with `Limit`, `Remaining`, and `Reset` fields.

### Key Insight
The most common rate limiting failure is not about the algorithm — it is about **consumer communication**. A rate limit that is well-documented and communicated via clear headers plus useful error messages causes far less friction than one that returns a generic `429` with no additional information.

### Version-Specific Notes
- Laravel 11.x: Use `RateLimiter` facade with Redis; define named limiters in `App\Http\Kernel`.
- PHP 8.4: Redis `INCR` and `EXPIRE` provide atomic rate limit operations; Lua scripting enables complex token bucket logic.
