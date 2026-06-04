## Classify Every Error as Retryable or Non-Retryable
---
## Category
Reliability
---
## Rule
Explicitly classify every provider error type as retryable (can succeed on retry) or non-retryable (will always fail); never retry errors that will fail again.
---
## Reason
Retrying non-retryable errors (authentication failure, invalid request, content policy violation) wastes time, tokens, and money. Proper classification ensures retries are only attempted when they have a reasonable chance of success.
---
## Bad Example
```php
catch (ProviderException $e) {
    // Retries everything, including invalid requests
    $this->retry($request);
}
```
---
## Good Example
```php
catch (ProviderException $e) {
    if ($e->isRetryable()) {
        $this->retry($request);
    } else {
        throw $e; // Non-retryable — fail immediately
    }
}
```
---
## Exceptions
When the cause of a 400-class error is uncertain, one retry with adjusted parameters (e.g., truncated input) may be attempted before classifying as non-retryable.
---
## Consequences Of Violation
Wasted retries on doomed requests, increased latency, unnecessary API costs, delayed error propagation.

## Use Exponential Backoff with Jitter
---
## Category
Reliability | Performance
---
## Rule
Implement exponential backoff with randomized jitter for retry delays; never use fixed-interval retries.
---
## Reason
Fixed-interval retries create thundering-herd patterns where all clients retry simultaneously, overwhelming the provider. Exponential backoff spreads retries over time, while jitter prevents synchronized retry waves from multiple instances.
---
## Bad Example
```php
$delay = 1000; // Fixed 1-second delay — thundering herd risk
```
---
## Good Example
```php
$delay = $baseDelay * (2 ** ($attempt - 1));
$jitter = $delay * 0.1 * (mt_rand() / mt_getrandmax() - 0.5);
usleep((int)($delay + $jitter) * 1000);
```
---
## Exceptions
Webhook retries with strict ordering requirements may use simpler strategies if jitter causes out-of-order processing.
---
## Consequences Of Violation
Thundering-herd rate-limit spikes, slower overall recovery, provider-side congestion exacerbation.

## Implement Circuit Breaker for Provider Calls
---
## Category
Reliability | Scalability
---
## Rule
Wrap all provider calls in a circuit breaker that opens after a configurable threshold of consecutive failures and remains open for a cooldown period; never retry indefinitely against a failing provider.
---
## Reason
Continuing to retry against an overloaded or down provider wastes resources, increases latency for all callers, and can cause cascading failures. A circuit breaker fails fast when the provider is known to be degraded, preserving capacity for healthy providers.
---
## Bad Example
```php
// Retries every time, even when provider has been failing for minutes
public function chat(ChatRequest $request): ChatResponse {
    return $this->retry(fn() => $this->inner->chat($request));
}
```
---
## Good Example
```php
public function chat(ChatRequest $request): ChatResponse {
    $this->breaker->check(); // Throws if circuit is open
    try {
        $response = $this->inner->chat($request);
        $this->breaker->recordSuccess();
        return $response;
    } catch (ProviderException $e) {
        $this->breaker->recordFailure();
        throw $e;
    }
}
```
---
## Exceptions
Background batch jobs where latency is not user-facing may retry without a circuit breaker, relying on queue retry limits instead.
---
## Consequences Of Violation
Resource waste on failing providers, increased user-facing latency, cascading failures across services.

## Implement Retry as a Decorator, Not Inside the Adapter
---
## Category
Architecture
---
## Rule
Implement retry logic as a decorator class wrapping the provider adapter; never embed retry logic inside the adapter itself.
---
## Reason
Separating retry from adapter logic follows the Single Responsibility Principle. Adapters handle request/response translation; decorators handle cross-cutting concerns (retry, logging, caching). This separation enables composable, testable, and swappable behavior.
---
## Bad Example
```php
class OpenAIChatAdapter implements LLMProvider {
    public function chat(ChatRequest $request): ChatResponse {
        // Retry logic mixed with adapter logic
        for ($i = 0; $i < 3; $i++) {
            try { /* ... */ } catch (RateLimitException $e) { usleep(1000000); }
        }
    }
}
```
---
## Good Example
```php
class RetryDecorator implements LLMProvider {
    public function __construct(private LLMProvider $inner) {}
    public function chat(ChatRequest $request): ChatResponse {
        // Retry logic only — delegates to inner adapter
    }
}
```
---
## Exceptions
Very simple adapters with a single retry for rate limits may include retry inline, but extract to a decorator when additional retry patterns are needed.
---
## Consequences Of Violation
Duplicated retry logic across adapters, untestable retry behavior, hard to add new cross-cutting concerns (circuit breaker, logging).
