---
id: ku-04
title: "Error Handling & Retry Strategies"
subdomain: "llm-provider-abstraction"
ku-type: "reliability"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/llm-provider-abstraction/ku-04/04-standardized-knowledge.md"
---

# Error Handling & Retry Strategies

## Overview

Error handling and retry strategies are critical for production AI systems, where LLM provider APIs can fail in numerous ways: rate limits, server errors, timeouts, authentication failures, content policy violations, and temporary overloads. Each error type requires a different response — some should be retried, some should trigger fallback, and some should fail immediately. This KU covers the error taxonomy, retry algorithms, and fallback strategies for the provider abstraction layer.

## Core Concepts

- **Error Taxonomy:** A classification of provider errors by type (rate limit, server error, authentication, content policy, timeout, invalid request) and severity (retryable, non-retryable).
- **Retryable Error:** An error that may succeed if retried (rate limits, 5xx, timeouts). Usually transient.
- **Non-Retryable Error:** An error that will fail again on retry (authentication failure, invalid request, content policy violation).
- **Exponential Backoff:** Retry algorithm where wait time increases exponentially between attempts (e.g., 1s, 2s, 4s, 8s).
- **Jitter:** Randomizing the retry delay to prevent thundering herd (e.g., 1s ± 0.5s).
- **Circuit Breaker:** After N consecutive failures, stop retrying for a cooldown period to allow the provider to recover.
- **Error Budget:** The acceptable number or rate of errors over a time window. Used for SLO-based alerting.
- **Graceful Degradation:** When the primary provider fails, the system continues with reduced functionality (cached response, fallback model, simplified output).

## When To Use

- Any production system making HTTP calls to LLM providers.
- Multi-provider systems where fallback is an option.
- Applications with uptime requirements (>99% availability).
- Systems that process user requests synchronously (failures are user-facing).

## When NOT To Use

- Batch/async processing where failed requests can be retried manually or in the next batch run.
- Development environments where immediate failure is preferred for debugging.

## Best Practices

- **Classify every error as retryable or non-retryable.** Rate limits and 5xx are retryable; 4xx (except 429) are non-retryable.
- **Use exponential backoff with jitter.** Fixed retry intervals cause thundering herd. Exponential + jitter spreads retries safely.
- **Set a maximum retry count (3-5).** Beyond this, the provider is likely experiencing sustained issues.
- **Implement circuit breaker.** After 5 consecutive failures in 60 seconds, stop sending requests for 30 seconds.
- **Log every error with context.** Provider, model, status code, error type, retry attempt, and correlation ID.
- **Provide fallback.** If all retries are exhausted, fall back to a different provider or model.
- **Alert on high error rates.** A spike in errors indicates a provider issue or a misconfiguration.

## Architecture Guidelines

- Implement retry logic as a **decorator** around the provider adapter, not inside the adapter itself.
- Use a **retry policy object** that encapsulates the retry configuration (max attempts, backoff formula, jitter, circuit breaker).
- The retry decorator should be **composable** with other decorators (logging, caching, rate limiting).
- For circuit breaker, use a **shared state store** (Redis) so all application instances respect the open circuit.
- Error classification should be **extensible** — new providers may have unique error types that need custom classification.

## Performance Considerations

- Retries add latency proportional to backoff duration. Configure timeouts aggressively (5-15s per attempt) so retries don't exhaust request budgets.
- Circuit breaker reduces latency during provider outages — requests fail fast (1-5ms) instead of waiting for timeouts.
- Retry decorator overhead is <0.1ms when no retry is needed.
- Backoff computation is trivial (<0.01ms). Use pre-computed backoff schedules for known providers.
- Distributed circuit breaker (Redis) adds 1-5ms per check. Use local circuit breaker for faster decision, with periodic sync to distributed state.

## Security Considerations

- **Error message leakage:** Provider error messages may contain internal details (stack traces, configuration). Sanitize before returning to clients.
- **Retry amplification:** An attacker could trigger many requests that all retry, amplifying load. Cap retries and use rate limiting.
- **Fallback security:** When falling back to a different provider, ensure the fallback provider meets the same security requirements.
- **Circuit breaker state:** Ensure the circuit breaker doesn't permanently disable a provider due to transient issues. Use half-open state for recovery.
- **Content policy errors:** A content policy error (e.g., "your request was filtered") should NOT be retried — the request itself is the problem.

## Common Mistakes

- Retrying non-retryable errors (4xx except 429). Retrying "invalid request" will always fail.
- Using fixed retry intervals — creates thundering herd and worsens rate limit issues.
- Not implementing circuit breaker — continuing to retry against an overloaded provider makes the problem worse.
- Swallowing errors — logging "request failed, retrying" without surfacing the error to observability.
- Retrying indefinitely — without a max retry count, a sustained provider outage keeps consumers waiting forever.
- Not differentiating error types — treating all errors the same leads to incorrect retry decisions.

## Anti-Patterns

- **Immediate Retry:** Retrying immediately without backoff. The provider hasn't recovered in 100ms.
- **Infinite Retry:** No maximum retry count. Consumers hang forever during provider outages.
- **Silent Failure:** The provider returns an error, and the system returns a generic "something went wrong" without logging the actual error.
- **Retry Spiral:** Multiple services all retry simultaneously, overwhelming the provider. Use jitter to spread retries.
- **One-Size-Fits-All Retry:** The same retry policy for all providers. Different providers have different rate limit windows and error patterns.

## Examples

### Retry Decorator
```php
class RetryDecorator implements LLMProvider {
    public function __construct(
        private LLMProvider $inner,
        private RetryPolicy $policy,
        private CircuitBreaker $breaker,
    ) {}

    public function chat(ChatRequest $request): ChatResponse {
        $attempts = 0;
        while (true) {
            try {
                $this->breaker->check();
                return $this->inner->chat($request);
            } catch (ProviderException $e) {
                $attempts++;
                if (!$e->isRetryable() || $attempts >= $this->policy->maxAttempts) {
                    $this->breaker->recordFailure();
                    throw $e;
                }
                $delay = $this->policy->getDelay($attempts);
                $this->breaker->recordFailure();
                usleep($delay * 1000);
            }
        }
    }
}
```

### Retry Policy
```php
class RetryPolicy {
    public function __construct(
        public readonly int $maxAttempts = 3,
        public readonly int $baseDelayMs = 1000,
        public readonly float $jitterFactor = 0.1,
    ) {}

    public function getDelay(int $attempt): int {
        $backoff = $this->baseDelayMs * (2 ** ($attempt - 1));
        $jitter = $backoff * $this->jitterFactor * (mt_rand() / mt_getrandmax() - 0.5);
        return (int) ($backoff + $jitter);
    }
}
```

### Error Classification
```php
class ProviderErrorClassifier {
    public function classify(int $statusCode, string $errorCode): ErrorType {
        return match(true) {
            $statusCode === 429 => ErrorType::RateLimit,          // retryable
            $statusCode === 401, $statusCode === 403 => ErrorType::Auth,  // non-retryable
            $statusCode >= 500 => ErrorType::ServerError,          // retryable
            $statusCode === 400 && $errorCode === 'content_policy' => ErrorType::ContentPolicy, // non-retryable
            default => ErrorType::Unknown,
        };
    }
}
```

## Related Topics

- ku-01 (Provider Abstraction Layer Design): The layer that decorators wrap.
- ku-02 (Provider Adapters): Adapters generate the errors that this layer handles.
- ai-middleware-gateway/ku-02: Gateway-level failover strategies.
- ai-safety-security/ku-05: Rate limiting complements retry strategies.
- streaming-real-time-ai/ku-03: Error handling during streaming.

## AI Agent Notes

- When asked to implement retry logic, first classify the errors the provider returns (which are retryable, which are not).
- For retry-related bugs, check: error classification, backoff formula, circuit breaker state, and max retry count.
- Prefer reading the retry policy configuration before the decorator implementation.
- When generating retry code, always include jitter, circuit breaker, and a maximum retry count.

## Verification

- [ ] Error taxonomy classifies errors as retryable or non-retryable.
- [ ] Retry uses exponential backoff with jitter.
- [ ] Maximum retry count is configured (3-5).
- [ ] Circuit breaker is implemented with configurable thresholds.
- [ ] Error logs include provider, model, status code, error type, and attempt number.
- [ ] Non-retryable errors are surfaced immediately without retry attempts.
- [ ] Fallback provider/model is available when all retries are exhausted.
