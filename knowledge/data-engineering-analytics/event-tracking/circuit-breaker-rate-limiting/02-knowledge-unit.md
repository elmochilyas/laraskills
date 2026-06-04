# Circuit Breaker and Rate Limiting

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 01-event-tracking
- **Knowledge Unit:** circuit-breaker-rate-limiting
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Circuit breakers and rate limiters form the resilience layer for analytics pipelines that depend on external services — without them, a single external dependency failure cascades into tracking failures, queue backlogs, and data loss. Analytics pipelines are uniquely vulnerable because they run in background processes with less monitoring and data loss is often silent — a failed geo-IP lookup just means a null field, not a 500 error.

---

## Core Concepts

- **Circuit Breaker States:** Transitions through Closed (normal), Open (short-circuited after failures threshold), and Half-Open (probing for recovery) states
- **Failure Threshold Configuration:** Sliding window counter with configurable failure count and time window to distinguish transient from sustained failures
- **Rate Limiting Strategies:** Token Bucket (bursts allowed up to capacity), Leaky Bucket (smooth throughput), Fixed Window (simple but double-burst at boundaries), Sliding Window Log (accurate but memory-intensive)
- **Degraded Fallback:** When circuit is open or rate limit exceeded, return null/default values, use cached results, skip enrichment with reprocessing flag, or route to dead-letter queue

---

## Mental Models

- **Circuit Breaker as Circuit Board:** A physical circuit breaker protects a house — when current spikes (failures), the breaker trips, protecting the entire system. Only after resetting does it probe if the fault is cleared. Same principle for API calls.
- **Token Bucket as Toll Booth:** Tokens regenerate at a fixed rate like cars passing through a toll booth. Bursts are handled because tokens accumulate up to a maximum bucket size, but sustained overload drains the bucket and blocks traffic.

---

## Internal Mechanics

Each external dependency has its own circuit breaker instance managed via a registry or factory pattern. The circuit breaker records successes and failures in a sliding window. When the failure count exceeds the threshold within the time window, the state transitions to Open. All requests are immediately rejected (short-circuited) while Open. After a configurable timeout, the breaker transitions to Half-Open, allowing one probe request. If the probe succeeds, it returns to Closed; if it fails, it returns to Open with extended timeout. Rate limiters use atomic counters (Redis) or timestamp arrays to track request volume per time window.

---

## Patterns

- **Per-Dependency Circuit Breaker:** Each external service (geo-IP, user-agent, spam detection) has its own breaker instance so one failure doesn't cascade to unrelated services
- **Queue Release with Delay:** When a circuit breaker opens in a queue job, release the job back with a delay matching the half-open timeout instead of failing immediately — prevents job loss during outage
- **Enrichment Service Wrapper:** Circuit breaker wraps the enrichment client, not the business logic — enrichment services receive a circuit breaker via DI, enabling independent testing of resilience strategies

---

## Architectural Decisions

Choose token bucket over fixed window rate limiting for analytics pipelines because analytics traffic is bursty — events arrive in waves from user activity. Fixed window causes thundering herd problems at window boundaries. For infrastructure, use in-memory rate limiters (Laravel's `Cache::lock` with Redis) for high-throughput pipelines (10,000+ events/second) rather than database-backed implementations.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Prevents cascading failures | Adds complexity to enrichment layer | Must instrument all external calls with breaker wrappers |
| Fails fast instead of waiting for timeouts | False positives can reject healthy requests | Configurable thresholds and Half-Open probing mitigate |
| Controls external API costs | Queue retry patterns become more complex | Jobs must coordinate with breaker state and release delays |

---

## Performance Considerations

Circuit breaker state checks are O(1) and do not impact throughput. Rate limiter performance depends on implementation — token bucket with atomic counters is fast, sliding window log with timestamp arrays is memory-intensive. The main performance cost is the enrichment call itself, not the protection layer. Circuit breakers improve overall throughput by failing fast instead of waiting for timeouts.

---

## Production Considerations

Log every circuit breaker state transition with full context: service name, previous/new state, failure count, time since last transition. In multi-tenant systems, rate limiting must be per-tenant to prevent noisy tenants from exhausting shared limits. Monitor enrichment coverage rates to detect silent failures. Configure thresholds per environment — production may need tighter thresholds than staging.

---

## Common Mistakes

- **Single Circuit Breaker for All Services:** One breaker covering all external APIs causes cascading shutdowns when a single service fails. Better: one breaker per external dependency via a registry.
- **No Degraded Fallback:** Enrichment returns null when circuit opens, and this null is stored without flagging for reprocessing. Better: store a sentinel value and `needs_reprocessing` flag, run batch reprocessing when circuit closes.
- **Rate Limiting at Wrong Granularity:** Global rate limiting instead of per-API-key or per-tenant. Better: use `RateLimiter::for()` with named limits per tenant or API key.

---

## Failure Modes

- **Infinite Retry Loop:** Queue jobs retry indefinitely when circuit is open, generating infinite trips. Mitigation: release with delay equal to half-open timeout, use `maxAttempts`.
- **Magic Number Thresholds:** Hardcoded failure thresholds that aren't adjusted for traffic patterns. Mitigation: make thresholds configurable per environment, adjustable at runtime.
- **Circuit Breaker State Leak:** Breaker state observable by end users, leaking information about third-party service health. Mitigation: never expose breaker state in API responses or UI.

---

## Ecosystem Usage

Laravel packages like `laravel-analytics` and community geo-IP/enrichment packages can integrate circuit breakers via middleware or enrichments service wrappers. The pattern is commonly implemented at the HTTP client level using `retry()` and middleware on Guzzle clients. Queue job retry configurations interact directly with breaker state timings.

---

## Related Knowledge Units

### Prerequisites
- Middleware Event Tracking — Where enrichment failures happen
- Queue Dispatching — How queue retry interacts with circuit breaker

### Related Topics
- Kafka CDC — Circuit breaker for Kafka producer failures
- Multi-Tenancy Analytics — Per-tenant rate limiting patterns

### Advanced Follow-up Topics
- Saga Pattern with Kafka — Circuit breakers in distributed transaction coordination

---

## Research Notes

The token bucket algorithm is the most common production choice for analytics pipelines because it naturally accommodates bursty traffic patterns. The circuit breaker pattern originated from Michael Nygard's "Release It!" and has been widely adopted in cloud-native architectures. Laravel's `Cache::lock` provides atomic operations that can back both rate limiting and circuit breaker state management.
