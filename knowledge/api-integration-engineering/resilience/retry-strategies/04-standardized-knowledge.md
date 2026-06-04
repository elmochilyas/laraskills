# ECC Standardized Knowledge — Retry Strategies

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-patterns |
| Knowledge Unit ID | ku-21 |
| Knowledge Unit | Retry Strategies |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K006, K008, K009, K011 |

## Overview (Engineering Value)
Retry strategies define when, how many times, and with what delay to retry failed HTTP requests. Not all failures should be retried (4xx client errors are non-retryable), and the retry pattern must respect upstream rate limits. Combined with exponential backoff and jitter, well-designed retry strategies dramatically improve resilience against transient failures.

## Core Concepts
- **Retryable Failures**: Transient errors (5xx, timeout, DNS failure, connection reset)
- **Non-Retryable Failures**: Client errors (4xx), particularly 400, 401, 403, 404
- **Exponential Backoff**: Increasing delay between retries
- **Jitter**: Random variance to prevent thundering herd
- **Retry Count**: Maximum number of attempts (typically 3)
- **Retry Budget**: Rate of retries allowed per time window
- **Idempotency Check**: Only retry idempotent operations

## When To Use
- Transient failures from upstream services
- Network timeouts and connection resets
- Rate-limited requests (429 with Retry-After)
- Idempotent write operations

## When NOT To Use
- Non-idempotent write operations (duplicate writes)
- 4xx client errors (unlikely to succeed on retry)
- Streaming responses where retry has side effects
- Real-time operations where latency from retries is unacceptable

## Best Practices
- Only retry on retryable status codes (5xx, 429, timeouts)
- Use exponential backoff with jitter
- Cap maximum retries (3 default, 5 maximum)
- Set an overall deadline for the retry sequence
- Log each retry attempt with reason and attempt number
- Consider retry budget to avoid retry amplification

## Architecture Guidelines
- Retry middleware in handler stack (outer layer)
- Retry config per upstream service (different tolerance levels)
- Retry budget per upstream to prevent cascading retries
- Monitoring on retry count and retry success rate
- Alert on max retries exhausted

## Performance Considerations
- Each retry adds latency equal to backoff + request time
- 3 retries with 1s, 2s, 4s backoff adds minimum 7s to request
- Retry budget reduces load during degradation
- Jitter adds 0-50% variance to backoff time

## Common Mistakes
- Retrying 4xx errors (wasteful, may cause account lockout)
- No jitter on retry timing (thundering herd)
- Infinite retries (resource exhaustion)
- Not checking idempotency before retry (duplicate writes)
- Retrying after timeout without shorter per-attempt timeout
- No retry budget leading to retry amplification

## Related Topics
- **Prerequisites**: HTTP status codes, idempotency, timeouts
- **Closely Related**: Circuit breaker, exponential backoff, rate limiting
- **Advanced**: Retry budget, circuit breaker integration
- **Cross-Domain**: Distributed systems, SRE principles

## Verification
- [ ] Retry only on retryable status codes (5xx, 429)
- [ ] Exponential backoff with jitter implemented
- [ ] Maximum retry count capped (3-5)
- [ ] Overall deadline for retry sequence
- [ ] Idempotency verified before retry of write operations
- [ ] Retry logging for debugging and monitoring
