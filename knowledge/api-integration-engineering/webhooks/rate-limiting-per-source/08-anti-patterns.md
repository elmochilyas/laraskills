# Anti-Patterns — Rate Limiting Per Source

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit | Rate Limiting Per Source |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Global Rate Limit Uniformity
2. Blind Rate Limit Tuning
3. Non-Standard Rate Limit Response
4. In-Memory Rate Limit State
5. Queue Job Rate Limit Mishandling

---

## 1. Global Rate Limit Uniformity

### Category
Security

### Description
Applying a single global rate limit to all webhook endpoints regardless of provider volume, causing legitimate high-volume providers to be throttled while low-volume providers consume unused capacity.

### Why It Happens
Developers apply `throttle:100,1` middleware to the webhook route group as a simple security measure. The uniform limit seems reasonable — 100 requests per minute should be enough for any provider. The differentiation by provider volume is not considered during initial implementation.

### Warning Signs
- Webhook route group uses a single `throttle` middleware with the same limit for all routes
- High-volume provider (Stripe, payment gateway) frequently triggers 429 responses
- Low-volume provider (GitHub) barely registers in rate limit counters
- Logs show disproportionate rate limit hits from specific providers while others are well within limits

### Why Harmful
A single limit creates a race to the bottom: the limit must be set low enough to protect against the worst-case provider, which means high-volume providers are constantly throttled. Alternatively, the limit is set high enough for the loudest provider, which leaves the endpoint vulnerable to floods from a single misconfigured source.

### Consequences
- Legitimate webhook traffic from high-volume providers rejected
- Processing gaps from throttled providers
- Capacity planning impossible — single limit masks per-provider patterns
- One provider's misconfiguration affects all providers

### Alternative
Configure named rate limiters per provider with provider-specific limits based on their documented or observed delivery rates.

### Refactoring Strategy
1. Identify each provider's expected webhook volume from documentation or monitoring
2. Create named rate limiters in `RouteServiceProvider` using `RateLimiter::for()`
3. Apply provider-specific `throttle:webhooks:provider_name` middleware per route
4. Set limits with 20% headroom above expected peak
5. Monitor per-provider rate limit hit rates and adjust thresholds

### Detection Checklist
- [ ] Per-provider named rate limiters configured
- [ ] Provider-specific limits match their documented delivery rates
- [ ] No single global throttle middleware on webhook group
- [ ] Rate limit hit logs show per-provider granularity

### Related Rules
Configure Per-Provider Named Rate Limiters

### Related Skills
Rate-Limit Incoming Webhooks Per Source

### Related Decision Trees
Rate Limiting Strategy (Global vs Per-Provider)

---

## 2. Blind Rate Limit Tuning

### Category
Reliability

### Description
Setting rate limits based on guesswork rather than observed traffic patterns, with no monitoring or logging of rate limit hits to inform threshold adjustments.

### Why It Happens
Rate limits are configured during initial setup when no traffic data exists. The limits are set based on provider documentation estimates or arbitrary round numbers. After deployment, no mechanism exists to track rate limit hit rates, so thresholds are never adjusted based on actual traffic patterns.

### Warning Signs
- No logging of rate limit hits
- Rate limit thresholds have never been adjusted since initial configuration
- No dashboard or alert for rate limit saturation
- Teams don't know what percentage of capacity is actually used

### Why Harmful
Without data on rate limit hits, teams cannot distinguish between appropriate limits and problematic ones. A limit that is too low silently rejects legitimate traffic. A limit that is too high provides no protection. The rate limit configuration becomes a security theater — it appears protective but offers no real guard.

### Consequences
- Frequent 429 errors from limits set too low
- No visibility into rate limit effectiveness
- Capacity planning based on assumptions, not data
- Incident response delayed because rate limit data is unavailable

### Alternative
Log every rate limit hit with provider name and timestamp. Monitor hit rates per provider and alert on sustained saturation. Adjust thresholds based on observed patterns.

### Refactoring Strategy
1. Add logging to each named rate limiter to record hits with provider and timestamp
2. Create a dashboard showing rate limit utilization per provider
3. Set up alerts when any provider exceeds 80% of its rate limit
4. Review rate limit hit data weekly and adjust thresholds
5. Include headroom adjustments for traffic growth

### Detection Checklist
- [ ] Rate limit hits logged per provider with timestamp
- [ ] Dashboard shows rate limit utilization
- [ ] Alerts configured for sustained rate limit hits
- [ ] Thresholds reviewed and adjusted based on observed data

### Related Rules
Log Rate Limit Hits Per Provider

### Related Skills
Rate-Limit Incoming Webhooks Per Source

### Related Decision Trees
Rate Limiting Strategy (Global vs Per-Provider)

---

## 3. Non-Standard Rate Limit Response

### Category
Reliability

### Description
Returning a non-standard HTTP response when rate limits are exceeded (e.g., 503, 500, or a custom error code) instead of the standard 429 with Retry-After header.

### Why It Happens
Developers may not know the standard 429 response code, or they use a custom error response that fits their API's error format. The Retry-After header is seen as optional or unnecessary. The response is designed for the application's error handling, not for the webhook provider's rate limit interpretation.

### Warning Signs
- Rate-limited requests return 503, 500, or 200 with error body
- No `Retry-After` header in rate limit responses
- Provider dashboard shows continued retry attempts after rate limiting
- Webhook provider's documentation mentions 429 specifically

### Why Harmful
Webhook providers implement standard HTTP rate limit handling: parsing the 429 status code and respecting the Retry-After header. A non-standard response is ignored — the provider treats it as a regular error and continues retrying at full speed, defeating the purpose of rate limiting.

### Consequences
- Provider does not back off, continuing to send requests at full rate
- Rate limiter ineffective — provider behavior unchanged
- Wasted Redis/memory resources tracking rate limit state that providers ignore
- Escalation to full queue backlog as requests continue unabated

### Alternative
Return HTTP 429 status code with a `Retry-After` header specifying the wait time in seconds.

### Refactoring Strategy
1. Identify all custom rate limit response handlers
2. Replace with standard 429 status code
3. Add `Retry-After` header with calculated wait time
4. Verify provider dashboard shows 429 responses and respects them
5. Remove custom error response logic for rate limit scenarios

### Detection Checklist
- [ ] Rate limit response uses 429 status code
- [ ] `Retry-After` header present in rate limit responses
- [ ] Providers back off after receiving rate limit response
- [ ] No custom non-standard rate limit responses in codebase

### Related Rules
Return 429 with Retry-After Header

### Related Skills
Rate-Limit Incoming Webhooks Per Source

### Related Decision Trees
Rate Limit Response Strategy

---

## 4. In-Memory Rate Limit State

### Category
Scalability

### Description
Using file-based or in-memory rate limit stores that are not shared across servers, causing each server to independently track rate limits and collectively exceed the intended limit.

### Why It Happens
Default Laravel configuration uses the file cache driver in many environments. Rate limit state is naturally stored in the cache. Developers don't explicitly configure the cache driver for rate limiting, so it inherits the application's default — often file or database in lower environments.

### Warning Signs
- Cache driver configured as `file` in production
- Rate limit violations spike after scaling to multiple servers
- Same provider rate-limited at different times on different servers
- Per-server rate limit counters show different values for the same time window

### Why Harmful
Each server maintains its own rate limit counter. With N servers, each allows the full rate limit independently. A limit of 100 requests/minute per provider allows 100 × N requests/minute in aggregate. This defeats the purpose of rate limiting entirely.

### Consequences
- Effective rate limit multiplied by server count
- No real protection against provider floods
- Inconsistent rate limit enforcement across requests
- Debugging confusion — same provider rate-limited on one server but not another

### Alternative
Use Redis-backed cache store for rate limit counters, ensuring shared state across all servers.

### Refactoring Strategy
1. Configure Redis cache driver in `config/cache.php`
2. Ensure `CACHE_DRIVER=redis` in production environment
3. Verify rate limit counters are stored in Redis using `redis-cli keys *rate*`
4. Test by verifying rate limit state is consistent across server restarts

### Detection Checklist
- [ ] Redis cache driver configured for rate limiting
- [ ] Rate limit state shared across all application servers
- [ ] No file-based rate limit counters in production
- [ ] Rate limit enforcement consistent across server restarts

### Related Rules
Use Redis-Backed Rate Limit Counters

### Related Skills
Rate-Limit Incoming Webhooks Per Source

### Related Decision Trees
Rate Limit Algorithm Selection

---

## 5. Queue Job Rate Limit Mishandling

### Category
Reliability

### Description
Failing or discarding queued webhook processing jobs when a rate limit is hit, instead of releasing the job back to the queue with a delay, exhausting retry attempts unnecessarily.

### Why It Happens
Rate limiting at the queue level is handled differently from HTTP rate limiting. When a queued job encounters a rate limit error, the natural response is to throw an exception, which Laravel handles as a job failure. The distinction between a permanent failure and a rate limit transient error is not made in the job's error handling.

### Warning Signs
- Queued webhook jobs fail with rate limit errors
- Failed jobs table shows rate limit errors at high frequency
- Same webhook retried multiple times with same rate limit error
- No distinction between rate limit errors and other transient failures

### Why Harmful
Rate-limited queue jobs that fail consume retry attempts for a condition that is transient by nature. A job might exhaust all 10 retry attempts within minutes of rate limits, permanently failing on a condition that would have resolved with a longer delay. The retry budget is wasted on rate limiting rather than actual processing issues.

### Consequences
- Jobs permanently fail from rate limiting that could have been resolved
- Retry budget consumed by rate limit errors
- Legitimate webhook processing lost due to rate limit exhaustion
- Increased failed job volume and operational noise

### Alternative
When a queued job encounters a rate limit, release it back to the queue with a calculated delay instead of failing it. Use job middleware to handle rate limit responses.

### Refactoring Strategy
1. Identify rate limit errors in job processing (specific exception types or response codes)
2. Replace `throw $e` with `$this->release($delay)` on rate limit errors
3. Implement rate limit middleware on the job class for centralized handling
4. Ensure rate limit delays are proportional to the Retry-After value
5. Monitor rate limit release patterns to verify the strategy works

### Detection Checklist
- [ ] Rate-limited queue jobs are released with delay, not failed
- [ ] No rate limit errors in failed jobs table
- [ ] Rate limit middleware handles queue-level rate limiting
- [ ] Release delays proportional to Retry-After values

### Related Rules
Configure Per-Provider Named Rate Limiters

### Related Skills
Rate-Limit Incoming Webhooks Per Source

### Related Decision Trees
Rate Limit Response Strategy
