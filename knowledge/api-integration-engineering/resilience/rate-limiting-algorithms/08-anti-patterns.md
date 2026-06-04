# ECC Anti-Patterns — Rate Limiting Algorithms

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 04-resilience |
| **Knowledge Unit** | Rate Limiting Algorithms |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. Fixed Window Rate Limiting (Boundary Burst Issue)
2. In-Memory Rate Limiter in Multi-Server Deployments
3. Ignoring Upstream Retry-After Headers
4. Dropping Rate-Limited Requests Instead of Queueing
5. Wrong Algorithm for Workload Type

## Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

## Anti-Pattern 1: Fixed Window Rate Limiting (Boundary Burst Issue)

### Category
Reliability

### Description
Using a fixed window counter that resets at interval boundaries. Traffic spikes at the boundary allow 2x the limit in a short period.

### Why It Happens
Fixed window is the simplest to implement: count requests in the current minute, reset at the start of the next minute.

### Warning Signs
- `Cache::increment("rate:stripe:" . now()->minute)` pattern
- Upstream 429 errors concentrated around minute boundaries
- 2x spike in requests at :00 seconds of each minute

### Why It Is Harmful
Limit is 100 req/min. At 11:59:30, 100 requests arrive. At 12:00:00, the counter resets. Another 100 requests arrive at 12:00:05. Total: 200 requests in 35 seconds. Upstream sees double the limit and returns 429 for the last 100.

### Preferred Alternative
Use sliding window or token bucket algorithm.

### Refactoring Strategy
1. Replace fixed window with sliding window (Redis sorted set)
2. Or use token bucket with refill rate matching desired limit
3. Test that boundary bursts no longer occur

### Related Rules
Choose Algorithm Based on Workload (05-rules.md)

### Related Skills
Implement Rate Limiting Algorithms (Token Bucket, Leaky Bucket) (06-skills.md)

### Related Decision Trees
Algorithm Selection (07-decision-trees.md)

---

## Anti-Pattern 2: In-Memory Rate Limiter in Multi-Server Deployments

### Category
Scalability

### Description
Using per-process in-memory rate limit counters. Each server independently maintains its own limit, allowing N×limit throughput.

### Why It Happens
In-memory rate limiter works in single-server development. It's the simplest implementation.

### Warning Signs
- `private int $requestCount = 0` pattern in rate limiter
- 429 errors from upstream but local rate limiter never activates
- Adding servers increases effective rate limit

### Why It Is Harmful
Rate limit is 100 req/min. 5 application servers each allow 100 req/min. Total outbound rate: 500 req/min. Upstream expects 100 req/min. 400 requests are rate-limited by upstream. The local rate limiter never fires because each server only sees its own 100.

### Preferred Alternative
Store rate limit state in Redis for distributed counting.

### Refactoring Strategy
1. Move counters to `Cache::store('redis')`
2. Use atomic `INCR` + TTL for sliding window
3. Verify all servers share the same limit

### Related Rules
Use Redis for Distributed Rate Limiter State (05-rules.md)

---

## Anti-Pattern 3: Ignoring Upstream Retry-After Headers

### Category
Reliability

### Description
Receiving 429 from upstream but retrying with standard backoff instead of respecting the `Retry-After` header.

### Why It Happens
The retry logic uses a fixed backoff schedule regardless of the response content.

### Warning Signs
- Retry after 429 doesn't use `Retry-After` header value
- Retry fails again with 429 because wait was too short
- Multiple 429 responses before successful retry

### Why It Is Harmful
Upstream returns 429 with `Retry-After: 30`. The client retries after 5 seconds (backoff schedule). Gets 429 again (`Retry-After: 25`). Retries after 10 seconds. Gets 429 again. After 3 failed retry attempts, the request is permanently failed. All because the `Retry-After` header was ignored.

### Preferred Alternative
Parse `Retry-After` and wait for the specified duration.

### Refactoring Strategy
1. On 429 response, extract `Retry-After` header
2. Wait for the exact duration specified
3. Only then retry or continue

### Related Rules
Always Respect Upstream Retry-After Headers (05-rules.md)

---

## Anti-Pattern 4: Dropping Rate-Limited Requests Instead of Queueing

### Category
Data Integrity

### Description
Silently dropping requests when the rate limit is reached instead of queueing them for later delivery.

### Why It Happens
`if (!$limiter->allow()) { return; }` — the simplest handling.

### Warning Signs
- `if (!$rateLimiter->allow()) { return null; }` pattern
- Missing data correlated with rate limit bursts
- No queue fallback for rate-limited requests

### Why It Is Harmful
100 requests arrive. Rate limit allows 50. 50 are silently dropped. No error. No retry. The requests are permanently lost. Customers don't get their order confirmations, password resets, or invoice emails.

### Preferred Alternative
Queue rate-limited requests for later processing.

### Refactoring Strategy
1. On rate limit hit, dispatch a delayed job
2. Use queue delay for the wait time
3. Never drop requests silently

### Related Rules
Implement Graceful Queue/Delay on Rate Limit Hit (05-rules.md)

---

## Anti-Pattern 5: Wrong Algorithm for Workload Type

### Category
Architecture

### Description
Using a rate limiting algorithm that doesn't match the workload pattern. Leaky bucket for bursty traffic, or fixed window for precise limits.

### Why It Happens
Developers pick an algorithm without analyzing the traffic pattern.

### Warning Signs
- Leaky bucket drops bursts on naturally bursty workload
- Token bucket allows excessive smoothing on constant-rate workload
- Fixed window causes boundary bursts on high-throughput workload

### Why It Is Harmful
A payment API has bursty traffic: 50 requests in 1 second, then quiet for 5 minutes. Leaky bucket with drain rate of 10/sec drops 40 of the 50 burst requests. Payment failures for legitimate traffic. The workload needed token bucket (supports bursts), not leaky bucket (constant rate).

### Preferred Alternative
Match algorithm to workload: token bucket for bursts, sliding window for precision, leaky bucket for constant rate.

### Refactoring Strategy
1. Analyze traffic pattern: bursty, smooth, or precise
2. Choose algorithm accordingly
3. Tune parameters based on observed metrics

### Related Rules
Choose Algorithm Based on Workload (05-rules.md)
