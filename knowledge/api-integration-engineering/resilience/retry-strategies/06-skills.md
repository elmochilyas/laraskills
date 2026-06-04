# Skill: Apply Retry Strategies for Transient API Failures

## Purpose
Choose and implement appropriate retry strategies (fixed, incremental, exponential backoff, jitter) for transient API failures based on failure characteristics and service requirements.

## When To Use
- External API calls with transient failures (network, 5xx, timeouts)
- Queue jobs making external API calls
- Non-idempotent calls needing retry with idempotency keys

## When NOT To Use
- Non-transient failures (4xx, validation errors)
- User-facing synchronous calls where latency matters more than reliability

## Prerequisites
- Understanding of failure classification
- Retry middleware or job retry configuration

## Workflow
1. Classify failures: transient (retry) vs permanent (don't retry)
2. Choose retry strategy: exponential backoff for most APIs
3. Configure initial delay, multiplier, max attempts
4. Add jitter to prevent thundering herd
5. Cap maximum delay
6. Use `Http::retry()` for simple cases, job `$backoff` for queues
7. Integrate with circuit breaker for upstream outage protection
8. Log retry attempts and delays for monitoring

## Validation Checklist
- [ ] Failure classification defines retryable vs non-retryable
- [ ] Retry strategy chosen and justified
- [ ] Exponential backoff with jitter configured
- [ ] Maximum attempts and delay capped
- [ ] Retry integrated with circuit breaker
- [ ] Retry activity logged for monitoring
