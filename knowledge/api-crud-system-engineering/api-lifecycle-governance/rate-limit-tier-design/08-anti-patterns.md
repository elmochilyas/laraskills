# Anti-Patterns: Rate Limit Tier Design

## AP-1: Fixed-Window Rate Limiting Without Burst Handling
**Category**: Reliability

**Description**: Using a fixed-window counter alone (e.g., 100 requests per minute) without sliding window or burst allowance. Consumers experience 2x traffic at window boundaries and legitimate traffic spikes are rejected as bursts.

**Warning Signs**:
- Rate limit resets at fixed intervals (top of minute, top of hour)
- Consumers report rate limit errors at predictable times (boundaries)
- Traffic patterns show spikes at rate limit window edges
- Legitimate traffic bursts rejected even though average rate is within limits
- Rate limit uses simple `INCR` + fixed TTL without sliding window logic

**Harms**:
- Consumers get 2x effective rate at window boundaries (double-spike)
- Legitimate burst traffic incorrectly rejected
- Poor consumer experience for bursty traffic patterns
- Rate limiting feels arbitrary and unfair to consumers
- No accommodation for natural traffic patterns

**Real-World Consequence**: A 100 req/s fixed-window rate limit resets at each second. A consumer sends 100 requests in the first 500ms of the second, then 100 more in the next second. Average rate is 100 req/s, but the fixed window allows 200 in a 1-second boundary crossing (last 500ms of second 1 + first 500ms of second 2). Another consumer with the same average sends 101 requests in the first second — all 101 are rejected even though the average is exactly 100 req/s.

**Preferred Alternative**: Use hybrid sliding window (for sustained rate accuracy) + token bucket (for burst handling). Sliding window smooths boundary effects. Token bucket allows 2x burst for maximum 10 seconds.

**Refactoring Strategy**: Replace fixed-window counter with Redis sorted set sliding window implementation, add token bucket for burst allowance, configure burst = 2x sustained for max 10 seconds, test with boundary-crossing and burst scenarios.

**Detection Checklist**:
- `[ ]` Is rate limiting based on fixed windows?
- `[ ]` Are there rate limit boundary spikes in traffic patterns?
- `[ ]` Is burst traffic incorrectly rejected?
- `[ ]` Does the algorithm use sliding window or token bucket?

**Related**: 05-rules.md (Rule 2: Use Hybrid Sliding Window + Token Bucket), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-2: No Rate Limit Headers on Success Responses
**Category**: Design

**Description**: Including rate limit headers only on 429 Too Many Requests responses and omitting them on successful responses. Consumers cannot track their remaining capacity and are surprised by unexpected 429 errors.

**Warning Signs**:
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` only on 429 responses
- Successful responses have no rate limit information
- Consumers report "unexpected" 429 errors
- No proactive consumer throttling possible
- Support tickets about rate limit status

**Harms**:
- Consumers cannot track remaining capacity
- Unexpected 429 errors disrupt integrations
- Consumers must use trial-and-error to find their limits
- No proactive backoff possible
- Increased support tickets for rate limit questions

**Real-World Consequence**: A consumer integration sends requests at 95 req/s against a 100 req/s limit. They have no rate limit headers on success responses. A traffic spike pushes them to 105 req/s and they receive a 429. They didn't know they were at 95% capacity. They must implement reactive backoff instead of proactive throttling, causing latency spikes.

**Preferred Alternative**: Include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` on every API response, not just when throttled.

**Refactoring Strategy**: Add rate limit header middleware that attaches headers after every response, compute remaining capacity on every request (not just when limit exceeded), ensure header computation is negligible (< 0.1ms), test headers on both success and failure responses.

**Detection Checklist**:
- `[ ]` Do successful responses include rate limit headers?
- `[ ]` Are `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` always present?
- `[ ]` Can consumers proactively avoid rate limits?
- `[ ]` Are there support tickets asking about rate limit status?

**Related**: 05-rules.md (Rule 3: Include Rate Limit Headers on All Responses), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-3: 429 Responses Without Retry-After Header
**Category**: Reliability

**Description**: Returning HTTP 429 Too Many Requests without a `Retry-After` header. Consumers have no guidance on when to retry and either retry immediately (creating retry storms) or wait excessively long.

**Warning Signs**:
- 429 responses have no `Retry-After` header
- Consumers retry immediately on 429
- Retry storm causes cascading rate limiting
- Same consumer generates many 429 responses in rapid succession
- API load increases during rate limit events (retry traffic)

**Harms**:
- Immediate retry exacerbates rate limiting (retry storm)
- No consumer coordination — multiple consumers retry simultaneously
- API load increases from retry traffic during already-stressed periods
- Consumer retry logic cannot be optimized without retry guidance
- Worse overall API availability during traffic spikes

**Real-World Consequence**: An API returns 429 without `Retry-After`. Consumer A hits the rate limit and retries immediately — 5 more times in the next second. Each retry is also rate limited. Consumer A is stuck in a retry loop, generating 6x the load of a single compliant consumer, making the rate limit situation worse.

**Preferred Alternative**: Always include a `Retry-After` header (in seconds) on every 429 response. This coordinates consumer backoff and prevents retry storms.

**Refactoring Strategy**: Add `Retry-After` header to all 429 response generation paths, base retry time on rate limit window reset or exponential backoff, document retry behavior in API reference, monitor retry-after effectiveness.

**Detection Checklist**:
- `[ ]` Do 429 responses include `Retry-After` header?
- `[ ]` Are there retry storms during rate limiting events?
- `[ ]` Do consumers respect the retry-after guidance?
- `[ ]` Is API load increasing during rate limit events?

**Related**: 05-rules.md (Rule 4: Return Retry-After on Every 429 Response), 04-standardized-knowledge.md, 06-skills.md

---

## AP-4: No Consumer Tier Differentiation (Single Tier)
**Category**: Architecture

**Description**: Exposing a single-tier API where all consumers have the same rate limits. Hobby projects and enterprise applications compete for the same resource allocation. Small consumers abuse resources meant for paying customers, while enterprise use cases outgrow the API.

**Warning Signs**:
- All consumers have the same rate limit
- No premium/paid tier options
- Enterprise customers complain about rate limits
- Small-scale consumers consume disproportionate resources
- No upgrade path for growing consumers
- Rate limit is either too low for enterprise or too high for free

**Harms**:
- Free consumers abuse resources intended for paying customers
- Enterprise customers outgrow the API and churn
- No monetization path through tier upgrades
- Single limit is wrong for multiple consumer segments
- Competitive disadvantage against tiered APIs

**Real-World Consequence**: A single-tier API has 100 req/s for all consumers. A free-tier hobby project runs a loop calling the API at 100 req/s, consuming the same resources as an enterprise customer running a production system. The enterprise customer needs 200 req/s for their use case. There's no upgrade path. The enterprise customer switches to a competitor with enterprise tiers.

**Preferred Alternative**: Define minimum three consumer tiers (Free, Pro, Enterprise) with documented rate limits, monthly quotas, and clear upgrade paths.

**Refactoring Strategy**: Define tier structure (Free=10 req/s, Pro=100 req/s, Enterprise=1000 req/s), implement tier identification in auth middleware, configure per-tier rate limit enforcement, create documentation and developer portal showing tier differences, implement upgrade workflow.

**Detection Checklist**:
- `[ ]` Are there multiple consumer tiers with different limits?
- `[ ]` Is there a free tier and an enterprise tier?
- `[ ]` Can enterprise customers get higher limits?
- `[ ]` Is there a documented upgrade path?

**Related**: 05-rules.md (Rule 1: Define Minimum Three Consumer Tiers), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-5: Monthly Quota Reset Thundering Herd
**Category**: Scalability

**Description**: Resetting all consumer monthly quotas at the same moment (e.g., midnight on the 1st). All consumers who hit their quota resume simultaneously, creating a traffic spike that overwhelms the system.

**Warning Signs**:
- Monthly quota resets at a single fixed time for all consumers
- Traffic spikes at the beginning of each month
- System performance degrades during the first hours of each month
- Rate limit errors spike immediately after quota resets
- Database/cache load spikes at reset time

**Harms**:
- Traffic spike overwhelms system capacity
- Degraded performance for all consumers during reset
- Cascading failures from sudden load increase
- Unnecessary infrastructure costs (provisioning for peak)
- Thundering herd effect amplifies at scale

**Real-World Consequence**: All 10,000 consumers have monthly quotas reset at midnight UTC on the 1st. 3,000 consumers had reached their quota and were idle. At midnight, all 3,000 resume simultaneously, generating 50,000 req/s — 3x normal traffic. The database cannot handle the spike and latency increases from 50ms to 5 seconds. Consumers time out and retry, making the situation worse.

**Preferred Alternative**: Stagger monthly quota resets by distributing reset times based on consumer ID hash across a 24-hour window.

**Refactoring Strategy**: Implement consumer hash-based reset distribution (crc32($consumerId) % 24 hours), migrate from fixed reset time to staggered, ensure billing can still align cycles, document reset time per consumer in dashboard.

**Detection Checklist**:
- `[ ]` Do all consumer quotas reset at the same time?
- `[ ]` Are there traffic spikes at the beginning of each month?
- `[ ]` Is there a thundering herd at quota reset?
- `[ ]` Are resets distributed across time?

**Related**: 05-rules.md (Rule 6: Stagger Quota Resets by Consumer Hash), 04-standardized-knowledge.md, 06-skills.md

---

## AP-6: Redis Outage Causes Complete API Failure
**Category**: Reliability

**Description**: Making rate limiting a critical path dependency — if Redis is unavailable, the rate limit check throws an exception and all API requests fail. A Redis incident causes a complete API outage, even though rate limiting is a protective mechanism, not a functional requirement.

**Warning Signs**:
- Redis failure causes 500 errors on all API requests
- No fallback behavior when rate limit store is unavailable
- Rate limit exception is not caught gracefully
- PagerDuty alerts for Redis also block all API traffic
- Clients report full API outage during Redis maintenance

**Harms**:
- Complete API outage during Redis incidents
- Cascading failure — Redis down → API down → consumers retry → more load
- Violation of availability SLA due to non-critical dependency
- Emergency workarounds require deployment changes
- MongoDB/Redis maintenance windows require full API downtime

**Real-World Consequence**: Redis experiences a 2-minute network partition. All API requests return 500 errors because the rate limiter middleware throws `ConnectionException` when it cannot connect to Redis. A 2-minute Redis blip causes a 15-minute API outage as the team investigates. No requests were served during the entire period.

**Preferred Alternative**: Implement a circuit breaker that falls back to local in-memory rate limiting when Redis is unavailable. Rate limit accuracy degrades (approximate vs exact) but API remains available.

**Refactoring Strategy**: Wrap rate limit check in try/catch, implement in-memory rate limiter as fallback, add circuit breaker with automatic recovery, log warnings when operating in degraded mode, alert on degraded mode (not total failure).

**Detection Checklist**:
- `[ ]` Does Redis failure block all API requests?
- `[ ]` Is there a fallback rate limiter (in-memory) when Redis is down?
- `[ ]` Are rate limit exceptions caught gracefully?
- `[ ]` Is there monitoring distinguishing degraded mode from full failure?

**Related**: 05-rules.md (Rule 7: Implement Redis Circuit Breaker with Local Fallback), 04-standardized-knowledge.md, 06-skills.md

---

## AP-7: No Per-Endpoint Sub-Limits
**Category**: Architecture

**Description**: Applying the same rate limit to all endpoints within a consumer tier. Expensive operations (data exports, batch processing, complex searches) consume the entire rate budget, blocking lightweight operations on other endpoints.

**Warning Signs**:
- Expensive endpoints (export, search, batch) have the same limit as lightweight endpoints
- A single expensive operation blocks all other API usage
- Consumers report "slow" endpoints that actually hit rate limits
- No differentiation between read, write, and expensive operations
- Rate limit is consumed by a few expensive operations, starving others

**Harms**:
- Expensive operation consumes entire rate budget
- Other operations blocked until budget resets
- Poor consumer experience — "why can't I call GET /users when I'm exporting?"
- No incentive to optimize expensive endpoints
- Rate limit design doesn't reflect actual resource cost

**Real-World Consequence**: A Pro tier has 100 req/s. The `POST /export` endpoint generates a 30-second report consuming significant DB resources. A consumer calls export 5 times — 5 seconds of export calls consumed 100 req/s rate limit but only used 5% of the export capacity. However, all other API calls are blocked for the rest of the second.

**Preferred Alternative**: Configure per-endpoint sub-limits within tier caps. Expensive operations get a fraction of the tier limit (e.g., export = 10% of tier rate, search = 20%, default = 100%).

**Refactoring Strategy**: Add endpoint-specific rate limit configuration, implement multi-key rate limiting (tier + endpoint-sub-limit), document per-endpoint limits in API reference, monitor endpoint-specific rate limit hit rates.

**Detection Checklist**:
- `[ ]` Are expensive endpoints rate limited differently from lightweight ones?
- `[ ]` Can a single expensive operation block other API usage?
- `[ ]` Are there per-endpoint sub-limits configured?
- `[ ]` Do consumers complain about rate limits on specific endpoints only?

**Related**: 05-rules.md (Rule 5: Implement Per-Endpoint Sub-Limits), 04-standardized-knowledge.md, 06-skills.md
