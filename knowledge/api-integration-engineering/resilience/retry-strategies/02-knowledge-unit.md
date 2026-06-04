# Metadata
Domain: API Integration Engineering
Subdomain: Resilience & Reliability Patterns
Knowledge Unit: Retry Strategies (Fixed, Exponential, Jitter)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Retry strategies define how and when failed API requests are retried. The three fundamental strategies—fixed interval, exponential backoff, and exponential with jitter—balance delivery reliability against upstream resource protection. Fixed interval is simplest, exponential backoff is the industry standard, and jitter prevents thundering herd problems in distributed systems. Proper retry strategies are essential for building resilient API integrations that handle transient failures gracefully.

## Core Concepts
- **Retryable Errors**: HTTP 408, 429, 5xx and network-level failures (timeout, DNS, connection refused)
- **Non-Retryable Errors**: HTTP 400, 401, 403, 404, 410, 422 (client errors unchanged by retry)
- **Max Attempts**: Upper bound on total delivery attempts including the initial try
- **Backoff**: Delay between retry attempts, growing over time
- **Jitter**: Random variation applied to backoff delay to desynchronize retry timing
- **Retry Budget**: Maximum retry count or total time window for retries
- **Circuit Breaker Integration**: Retry should not continue when circuit is open (failure is not transient)

## Mental Models
- **Tired Retry**: The more a retry fails, the longer it should rest before trying again
- **Jitter as Traffic Cop**: Random delays prevent all clients from retrying simultaneously when a service recovers
- **Exponential as Fever Curve**: The fever (retry rate) should spike initially and taper off as the illness (outage) persists

## Internal Mechanics
- Fixed interval: `$delay = $baseInterval` (same delay for every retry)
- Exponential backoff: `$delay = min($base * (2 ** ($attempt - 1)), $maxDelay)`
- Full jitter: `$delay = random_int(0, min($cap, $base * (2 ** $attempt)))`
- Equal jitter: `$temp = min($cap, $base * (2 ** $attempt)); $delay = $temp / 2 + random_int(0, $temp / 2)`
- Decorrelated jitter: `$delay = min($cap, random_int($base, $delay * 3))` (AWS recommended)
- Laravel `Http::retry($maxAttempts, $delay, $callback)` implements basic exponential with optional decision callback

## Patterns
- **Exponential Backoff + Full Jitter**: AWS-recommended pattern; provides the best distribution
- **Error-Aware Retry**: Different backoff strategies per status code (429 = Retry-After header, 5xx = standard exponential)
- **Retry Budget with Deadline**: Calculate total retry time budget and limit retries within that window
- **Idempotency-Backed Retry**: Idempotency keys ensure safe retry; without them, retry only GET/HEAD/PUT/DELETE requests
- **Circuit Breaker Tap**: Check circuit breaker state before each retry attempt
- **Progressive Retry**: Start with shorter delays, increase rapidly after a threshold of failures

## Architectural Decisions
- Use exponential backoff with jitter as the default for all external API calls
- Apply fixed interval only for internal services with guaranteed capacity
- Set max attempts based on total time horizon (e.g., 5 retries over ~30 minutes)
- Never retry on 4xx client errors (they will always fail regardless of attempts)
- Respect `Retry-After` header when present (override backoff calculation)
- Use SaloonPHP retry plugin or Laravel Http `retry()` for consistent retry behavior across integrations

## Tradeoffs
- Exponential backoff increases latency for the caller but reduces load on the upstream
- Jitter improves distribution but introduces nondeterministic retry timing (harder to diagnose)
- More retry attempts increase delivery probability but extend failure detection time
- Aggressive retry (short backoff, many attempts) recovers faster but can overwhelm struggling services

## Performance Considerations
- Retry delay calculation is negligible CPU cost
- Retry increases total operation latency by sum of all delays (could be hours for many attempts)
- In-memory retry state is lost on process restart; use database-backed retry for critical webhook delivery
- Concurrent retries from multiple workers multiply upstream load exponentially
- Queue-based retry (Laravel `backoff`) persists retry state across worker restarts

## Production Considerations
- Log each retry attempt with attempt number, delay, and error details
- Monitor retry rates as a leading indicator of integration health
- Set up alerts when retries exceed expected thresholds (indicates persistent failure)
- Use distributed retry state (cache/database) instead of in-memory for multi-worker deployments
- Configure different retry strategies per service based on SLAs and upstream behavior
- Implement retry budget limiting: max 10 retries or max 1-hour retry window per request

## Common Mistakes
- Retrying non-retryable errors (400, 401) indefinitely, wasting resources
- Zero-delay retry (immediate retry loop) that floods the upstream
- Retrying without idempotency, causing duplicate side effects on success
- Infinite retries without budget or circuit breaker (retry storm on persistent failure)
- Not respecting `Retry-After` header from 429 responses
- Confusing retry with circuit breaker (retry handles transient failure; circuit breaker handles persistent failure)

## Failure Modes
- Retry storm: many clients retry simultaneously after a transient blip, overwhelming the recovering service
- Exponential backoff overflow: delay calculation exceeds integer limits (PHP `int` overflow on large exponents)
- Retry budget exhaustion: all retries fail, operation is permanently failed (correct behavior, but needs alerting)
- Jitter collision: identical random delays from same seed (rare, usually negligible)
- Retry state lost: process crash before retry causes permanent job failure (use queue-backed retry)

## Ecosystem Usage
- Laravel Http facade `retry()` method supports configurable delays and decision callbacks
- SaloonPHP retry plugin provides per-connector retry configuration with exponential backoff
- Spatie webhook-server uses configurable backoff strategies for webhook delivery retries
- AWS SDKs recommend exponential backoff with full jitter as the default retry strategy
- Stripe's official PHP SDK retries automatically with exponential backoff
- Standard Webhooks spec defines a specific retry schedule for webhook delivery

## Related Knowledge Units
- K007: Circuit Breaker Pattern (complementary to retry; stops retry on persistent failure)
- K008: Rate Limiting Algorithms (retry-after handling intertwines with rate limiting)
- K006: Idempotency Key Pattern (retry safety depends on idempotency)
- K019: Exponential Backoff Customization (specific to Spatie webhook-server)
- K024: Fuse Circuit Breaker (protects queue retry from wasted effort)

## Research Notes
- AWS "Exponential Backoff and Jitter" blog post defines the four jitter strategies (full, equal, decorrelated, none)
- Decorrelated jitter (AWS recommended) uses the formula: `sleep = min(cap, random_between(base, sleep * 3))`
- Google API design guide recommends exponential backoff with jitter for all retryable errors
- Stripe's retry schedule: immediate, then at increasing intervals up to 3 days for webhook delivery
- BoldSign's "API Retry Mechanism" guide provides practical implementation patterns for distributed systems
