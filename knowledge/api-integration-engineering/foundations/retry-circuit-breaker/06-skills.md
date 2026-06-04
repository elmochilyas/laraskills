# Skill: Implement Retry and Circuit Breaker Patterns for Resilient API Calls

## Purpose
Apply retry logic with exponential backoff and circuit breaker patterns to outbound API calls, preventing cascading failures during upstream outages.

## When To Use
- Any external API call in production
- API calls with transient failures (network issues, 5xx, timeouts)
- Protecting downstream services from overload during recovery
- Queue jobs making external API calls

## When NOT To Use
- Idempotent-only retries (non-idempotent mutations need idempotency keys)
- Real-time user-facing calls where fast failure is preferred over delayed success
- 4xx client errors (retries won't fix bad requests)

## Prerequisites
- Http facade retry or Guzzle middleware
- Circuit breaker package (algoyounes/circuit-breaker or harris21/laravel-fuse)

## Workflow
1. Use `Http::retry(3, 100)` for simple retry with 100ms delay
2. Configure exponential backoff: `->retry(3, fn ($attempt) => $attempt * 1000)`
3. Classify failures: 5xx, timeouts, connection errors are retryable; 4xx are not
4. Set maximum retry count with jitter to prevent thundering herd
5. Implement circuit breaker: Open after N failures, Half-Open after timeout, Close on success
6. For queue jobs: use `harris21/laravel-fuse` for persistence across process restarts
7. Log retry attempts and circuit state changes for monitoring
8. Test retry behavior with mock failure sequences

## Validation Checklist
- [ ] Retry configured with exponential backoff
- [ ] Failure classification: retryable vs non-retryable
- [ ] Circuit breaker states (Closed, Open, Half-Open) working
- [ ] Jitter added to prevent thundering herd
- [ ] Retry/breaker behavior tested with mock failures
- [ ] Circuit state changes logged
