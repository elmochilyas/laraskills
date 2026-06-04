# Delivery Retry — Rules

---

## Always Configure an Explicit Backoff Strategy

## Category

Reliability

## Rule

Configure a backoff strategy for every outgoing webhook delivery; never rely on the default retry behavior without customizing the delay schedule.

## Reason

The default retry schedule may be too aggressive (overloading subscriber) or too slow (missing delivery SLAs). A tuned backoff strategy balances delivery success probability with subscriber capacity. The Standard Webhooks schedule (5s, 5m, 30m, 2h, 5h, 10h, 14h, 20h, 24h) is a good starting point.

## Bad Example

```php
// No backoff strategy configured — default retry behavior used
// config/webhook-server.php has no 'backoff_strategy' key
```

## Good Example

```php
// config/webhook-server.php
'backoff_strategy' => \Spatie\WebhookServer\BackoffStrategy\ExponentialBackoffStrategy::class,
```

## Exceptions

Subscribers with documented Retry-After requirements should follow their schedule instead.

## Consequences Of Violation

Reliability: Aggressive retry overloads subscriber. Performance: Suboptimal delivery times. Scalability: Retry storms on subscriber recovery.

---

## Use Error-Aware Backoff Based on HTTP Status Code

## Category

Reliability

## Rule

Implement different backoff delays for 429 (Too Many Requests) and 5xx (Server Error) responses, rather than treating all failures identically.

## Reason

429 responses include a `Retry-After` header specifying when the client should retry. Ignoring this header and using standard exponential backoff may retry too early (wasting resources) or too late (missing the window). 5xx errors benefit from standard exponential backoff with jitter.

## Bad Example

```php
// Same delay for all error types
function getDelay(int $attempt, int $statusCode): int
{
    return 10 * (2 ** ($attempt - 1));
}
```

## Good Example

```php
function getDelay(int $attempt, int $statusCode, ?string $retryAfter): int
{
    if ($statusCode === 429 && $retryAfter !== null) {
        return (int) $retryAfter;
    }
    return min(10 * (2 ** ($attempt - 1)), 3600);
}
```

## Exceptions

Subscribers that never return 429 or Retry-After headers. In that case, standard exponential backoff is sufficient.

## Consequences Of Violation

Performance: Retries too early on rate-limited subscribers. Reliability: Ignoring Retry-After may cause subscriber throttling. Resource: Wasted retry attempts on rate-limited endpoints.

---

## Always Add Jitter to Retry Delays

## Category

Reliability

## Rule

Add random jitter (±25% or full jitter) to every retry delay calculation; never use pure exponential backoff without randomness.

## Reason

Without jitter, multiple webhook failures that occur simultaneously retry in lockstep, creating a thundering herd when the subscriber recovers. Jitter spreads retries across a time window, ensuring a gradual load increase instead of a spike.

## Bad Example

```php
// Pure exponential — no jitter
function getDelay(int $attempt): int
{
    return 10 * (2 ** ($attempt - 1));
}
// All subscribers retry at exactly 10s, 20s, 40s...
```

## Good Example

```php
// Full jitter — random delay between 0 and ceiling
function getDelay(int $attempt): int
{
    $exp = min(10 * (2 ** ($attempt - 1)), 3600);
    return rand(0, $exp);
}
```

## Exceptions

Subscribers explicitly requiring fixed-interval retries (rare). In that case, document the exception.

## Consequences Of Violation

Reliability: Thundering herd on subscriber recovery. Performance: Cascading failures. Scalability: Resource exhaustion from synchronized retries.

---

## Set Max Attempts Between 5 and 10

## Category

Reliability

## Rule

Configure `max_attempts` between 5 and 10 for outgoing webhook delivery; avoid values below 3 (insufficient delivery probability) or above 15 (unbounded resource consumption).

## Reason

Retry attempts consume database storage, queue time, and subscriber resources. Too few attempts fail to deliver during transient outages (30s–5min). Too many attempts waste resources on dead endpoints and extend the delivery failure horizon beyond 24 hours.

## Bad Example

```php
// Too few — no resilience
'max_attempts' => 2

// Too many — resource waste
'max_attempts' => 50
```

## Good Example

```php
// Balanced — typical for 24-hour delivery window
'max_attempts' => 8
```

## Exceptions

Critical financial webhooks may need 15+ attempts for multi-day delivery windows. Low-priority notifications may use 3 attempts.

## Consequences Of Violation

Reliability: Insufficient attempts fail on transient errors. Performance: Excessive attempts waste resources. Storage: Unbounded attempt records.

---

## Implement Circuit Breaker Before Retry

## Category

Reliability

## Rule

Check subscriber circuit breaker state before scheduling a webhook retry; do not retry delivery to endpoints that are in open circuit state.

## Reason

Retrying against a persistently failing or dead subscriber wastes queue workers, generates unnecessary HTTP traffic, and delays processing of other webhooks. Circuit breaker middleware short-circuits retries when failure thresholds are exceeded, allowing the system to mark the subscriber as degraded.

## Bad Example

```php
// Retries without checking subscriber health
class RetryFailedWebhooks
{
    public function handle(): void
    {
        WebhookCall::where('status', 'failed')->each(function ($call) {
            $call->retry();
        });
    }
}
```

## Good Example

```php
class RetryFailedWebhooks
{
    public function __construct(private CircuitBreaker $breaker) {}

    public function handle(): void
    {
        WebhookCall::where('status', 'failed')->each(function ($call) {
            if ($this->breaker->isAvailable($call->url)) {
                $call->retry();
            }
        });
    }
}
```

## Exceptions

Low-volume systems where circuit breaker complexity exceeds benefit.

## Consequences Of Violation

Reliability: Retry flood against dead endpoints. Performance: Wasted queue worker time. Scalability: Resource exhaustion.

---

## Test Retry Behavior Under Simulated Failures

## Category

Testing

## Rule

Write automated tests that simulate HTTP delivery failures at each error status (429, 500, 503, timeout) and verify the retry pipeline produces the expected delays and attempt counts.

## Reason

Retry logic is critical path code that often fails in production because development environments never experience failures. Without tests, regressions (e.g., broken exponent calculation, missing jitter, zero backoff) silently reach production.

## Bad Example

```php
// No retry tests — assumes correct behavior
public function test_dispatch(): void
{
    WebhookCall::create()->url('https://example.com')->payload(['k' => 'v'])->dispatch();
    $this->assertDatabaseHas('webhook_calls', ['url' => 'https://example.com']);
}
```

## Good Example

```php
public function test_retry_after_500(): void
{
    Http::fake(['example.com/*' => Http::response('Server Error', 500)]);

    WebhookCall::create()->url('https://example.com')->payload(['k' => 'v'])->dispatch();

    $this->assertDatabaseHas('webhook_calls', [
        'url' => 'https://example.com',
        'attempt' => 2,
    ]);
}
```

## Exceptions

No common exceptions.

## Consequences Of Violation

Reliability: Retry bugs reach production. Debugging: No verification of backoff correctness. Maintenance: Refactoring retry logic is risky without tests.
