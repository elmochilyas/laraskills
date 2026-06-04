# Skills: Circuit Breaker + Rate Limiting for External Analytics API Calls

## Skill: Circuit Breaker Implementation for Enrichment Pipelines
**Purpose:** Implement circuit breaker protection for external analytics enrichment calls.
**When to use:** Adding resilience to geo-IP, user-agent, or spam-filter enrichment in tracking pipelines.
**Steps:**
1. Identify each external dependency and create a dedicated circuit breaker instance
2. Register all breakers in a `CircuitBreakerRegistry`
3. Wrap each enrichment service call with `breaker->isAvailable()` check
4. Record success/failure after each call
5. Implement degraded fallback (null + reprocess flag) for open circuit
6. Configure thresholds per environment via configuration provider
7. Log every state transition with full context
8. Test with fault injection (mock service failures)

## Skill: Token Bucket Rate Limiter for Analytics APIs
**Purpose:** Implement burst-tolerant rate limiting for external analytics API calls.
**When to use:** Controlling cost and preventing abuse on metered analytics APIs.
**Steps:**
1. Determine per-API-key or per-tenant rate limit budget
2. Implement or configure token bucket limiter with Redis atomic counters
3. Apply limit at the HTTP client middleware level
4. Configure bucket capacity and refill rate from environment config
5. Implement backpressure signaling (429 responses queued for retry)
6. Monitor rate limit headroom and adjust budget dynamically

## Skill: Circuit Breaker Integration with Queue Jobs
**Purpose:** Handle circuit breaker state in queue job execution without data loss.
**When to use:** Queue jobs that process analytics events and depend on external enrichment services.
**Steps:**
1. Check circuit breaker state at the start of job `handle()`
2. If open: release job with delay equal to half-open timeout
3. If closed: attempt enrichment; on failure, record failure and release
4. Set `maxAttempts` to prevent infinite retry loops
5. Implement dead-letter queue for jobs that exceed max attempts due to prolonged outages
