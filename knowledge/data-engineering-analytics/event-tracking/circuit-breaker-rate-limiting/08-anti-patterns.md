# Anti-Patterns: Circuit Breaker + Rate Limiting for External Analytics API Calls

## Shared Circuit Breaker for All Dependencies
A single circuit breaker instance protecting all external API calls. When the geo-IP service fails, user-agent parsing and spam detection enrichment also stop working. This violates the principle of failure isolation and makes debugging difficult because all services appear failed.

**Solution:** Each external dependency gets its own circuit breaker instance, managed by a `CircuitBreakerRegistry`.

## Silent Null Fallback Without Flagging
Enrichment returns null when the circuit is open, but the null is stored without indicating whether the value is genuinely unknown or missing due to a service failure. Analysts cannot distinguish between "no geo-IP data available" and "geo-IP service was down."

**Solution:** Use a sentinel value (e.g., `geo_ip_failed: true`) and an `enrichment_status` column that indicates the provenance of each enriched field.

## Fixed Retry Delay on Open Circuit
Jobs are released with a constant 30-second delay regardless of how long the circuit has been open. This creates thundering herd recovery: when the service comes back, all waiting jobs hit it simultaneously.

**Solution:** Implement exponential backoff in the release delay: `min(initial_delay * 2^attempt, max_delay)`.

## Rate Limiting Without Backpressure
Rate limiting rejects requests with a 429 status but provides no mechanism for the caller to retry. Events that exceed the rate limit are dropped permanently.

**Solution:** Implement a retry queue with exponential backoff for rate-limited requests, or use Laravel's built-in rate limiter with `then` callback for queuing exceeded requests.

## In-Memory State Without Persistence
Circuit breaker state is stored in-memory (in a singleton or static variable). When the PHP process restarts (deployment, scaling event), all circuit breaker state is lost, and the circuit resets to Closed even if the downstream service is still failing.

**Solution:** Use Redis or another persistent store for circuit breaker state in production. In-memory state is acceptable only for single-server development environments.
