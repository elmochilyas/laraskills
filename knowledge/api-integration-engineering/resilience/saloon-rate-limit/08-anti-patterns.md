# ECC Anti-Patterns — Saloon Rate Limiting Plugin

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 04-resilience |
| **Knowledge Unit** | Saloon Rate Limiting Plugin |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. No Rate Limiter on Connector (Manual Throttling Needed)
2. File/Database Cache for Rate Limit State (Per-Server Counters)
3. Shared Rate Limiter Across Multiple Connectors
4. Auto-Delay Enabled for User-Facing Requests
5. No Rate Limit Hit Monitoring

## Repository-Wide Anti-Patterns

- Hidden Configuration
- Silent Failure

---

## Anti-Pattern 1: No Rate Limiter on Connector (Manual Throttling Needed)

### Category
Reliability

### Description
Not attaching the Saloon rate limiter plugin to connectors that call rate-limited upstream APIs.

### Why It Happens
Developers don't know the plugin exists. Or they think "we'll add it later."

### Warning Signs
- Connector class without `defaultLimiter()` method
- Manual `sleep()` calls between requests
- 429 errors from upstream in production

### Why It Is Harmful
A connector sends 100 requests in 5 seconds to an API with a 60 req/min limit. The API returns 429 for 40 requests. Each 429 requires handling. The connector must implement manual throttling. Without the plugin, every integration needs its own rate limit logic.

### Preferred Alternative
Attach `TokenBucketLimiter` via `defaultLimiter()` on every connector.

### Refactoring Strategy
1. Add `use \Saloon\RateLimitPlugin\Traits\HasRateLimiter;` to connector
2. Implement `defaultLimiter()` returning `TokenBucketLimiter`
3. Configure limits matching upstream documentation

### Related Rules
Use Saloon's Built-in Rate Limiter Plugin on Every Connector (05-rules.md)

### Related Skills
Use SaloonPHP Rate Limit Plugin for Automated Throttling (06-skills.md)

### Related Decision Trees
Rate Limiter Configuration (07-decision-trees.md)

---

## Anti-Pattern 2: File/Database Cache for Rate Limit State (Per-Server Counters)

### Category
Scalability

### Description
Using file or database cache as the store for Saloon's rate limiter plugin state.

### Why It Happens
Default cache driver is often `file`. Developers don't change it.

### Warning Signs
- `new CacheStore(cache()->driver('file'))` in rate limiter config
- 429 errors from upstream on multi-server
- Rate limiter never seems to activate

### Why It Is Harmful
3 servers each get their own file cache. Rate limit is 100 req/min. Each server independently allows 100 req/min. Total outbound: 300 req/min. Upstream returns 429 for 200. The rate limiter plugin reports "all good" because each server only tracks its own requests.

### Preferred Alternative
Use Redis cache store for rate limit state.

### Refactoring Strategy
1. Change to `new CacheStore(cache()->driver('redis'))`
2. Ensure Redis is configured for production
3. Test with multi-server load

### Related Rules
Use Redis Cache for Distributed Rate Limit State (05-rules.md)

### Related Decision Trees
Cache Store Selection (07-decision-trees.md)

---

## Anti-Pattern 3: Shared Rate Limiter Across Multiple Connectors

### Category
Architecture

### Description
Using one rate limiter instance across multiple Saloon connectors pointing to different upstreams.

### Why It Happens
A single rate limiter is created and injected into all connectors.

### Warning Signs
- Same `TokenBucketLimiter` instance on Stripe and Mailgun connectors
- One connector's rate limit exhausts another's budget
- Config has one rate limit value shared by all

### Why It Is Harmful
Stripe and Mailgun share a rate limiter with 100 req/min. Stripe uses 80 requests. Mailgun is limited to 20 requests for the rest of the minute. Mailgun emails are delayed because Stripe consumed the shared budget. Two unrelated services compete for the same limit.

### Preferred Alternative
Create separate rate limiter instances per connector.

### Refactoring Strategy
1. Each connector implements its own `defaultLimiter()`
2. Configure per-connector limits based on upstream docs
3. Ensure no shared instance variable

### Related Rules
Configure Per-Connector Rate Limiters (05-rules.md)

---

## Anti-Pattern 4: Auto-Delay Enabled for User-Facing Requests

### Category
Performance | User Experience

### Description
Enabling `autoDelay` on the rate limiter for user-facing API calls. Users experience invisible delays.

### Why It Happens
Auto-delay is the default behavior. Developers don't differentiate between sync and async contexts.

### Warning Signs
- `autoDelay: true` on connector used in user-facing sync requests
- Intermittent slow responses correlated with rate limit
- No fallback or error for rate-limited user requests

### Why It Is Harmful
A user submits a payment form. The rate limiter auto-delays for 10 seconds waiting for budget. The user sees a loading spinner for 10 seconds. They think the payment is processing. They refresh. The payment was actually made (but slow). Now they have a pending and a new payment.

### Preferred Alternative
Disable auto-delay for user-facing requests; fail fast with fallback.

### Refactoring Strategy
1. Create separate connectors or configs for sync vs async
2. User-facing: `autoDelay: false` and handle rate limit exception
3. Background jobs: `autoDelay: true`

### Related Rules
Enable Auto-Delay for Non-Time-Sensitive Operations (05-rules.md)

---

## Anti-Pattern 5: No Rate Limit Hit Monitoring

### Category
Observability

### Description
Not monitoring rate limit hit rate. No visibility into approaching upstream limits.

### Why It Happens
The plugin handles rate limiting silently. Developers assume it "just works."

### Warning Signs
- No `onRateLimitHit()` callback on connectors
- Rate limit adjusted only after upstream 429 incidents
- No metrics on rate limit utilization

### Why It Is Harmful
Upstream reduces rate limit from 100 to 50 req/min. The connector still has 100 configured. Servers get 429 for half the requests. The plugin handles it (delays or fails). No metric shows the increased rate limit hit rate. Weeks pass before someone notices the degraded throughput.

### Preferred Alternative
Monitor rate limit hit rate with alerting.

### Refactoring Strategy
1. Add `onRateLimitHit()` callback to each connector
2. Increment metrics counter on hit
3. Alert on sustained rate limit hitting

### Related Rules
Monitor Rate Limit Hit Rate for Tuning (05-rules.md)
