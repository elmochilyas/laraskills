# Exponential Backoff for Webhook Delivery — Rules

---

## Always Add Jitter to Backoff Delays

## Category

Reliability

## Rule

Add random jitter (±25% or full jitter) to every exponential backoff delay; never use pure exponential backoff without randomization.

## Reason

Pure exponential backoff causes synchronized retry across all webhooks that fail simultaneously. When the downstream system recovers, it receives a thundering herd of retries, potentially causing it to fail again. Jitter spreads retry timing across a window, enabling gradual recovery.

## Bad Example

```php
function getDelay(int $attempt): int
{
    return 10 * (2 ** ($attempt - 1));
    // All subscribers retry at exactly 10s, 20s, 40s
}
```

## Good Example

```php
function getDelay(int $attempt): int
{
    $exp = min(10 * (2 ** ($attempt - 1)), 3600);
    return rand(0, $exp); // Full jitter: random between 0 and ceiling
}
```

## Exceptions

Subscribers explicitly requiring fixed-interval retries via Retry-After headers.

## Consequences Of Violation

Reliability: Thundering herd on subscriber recovery. Performance: Cascading retry failures. Scalability: System-wide load spikes.

---

## Cap Maximum Backoff Delay

## Category

Reliability

## Rule

Set a maximum delay cap (e.g., 1 hour or 3600 seconds) on exponential backoff to prevent unbounded delay growth.

## Reason

Without a cap, exponential backoff grows rapidly: attempt 15 at 10s base delay waits 45 hours. This delays final failure notification and keeps the `WebhookCall` in pending state indefinitely, complicating cleanup and reconciliation.

## Bad Example

```php
function getDelay(int $attempt): int
{
    return 10 * (2 ** ($attempt - 1));
    // attempt 20 = 10 * 524288 = ~60 days
}
```

## Good Example

```php
function getDelay(int $attempt): int
{
    return min(10 * (2 ** ($attempt - 1)), 3600);
    // Never exceeds 1 hour
}
```

## Exceptions

Delivery SLAs requiring multi-day retry windows. In that case, cap at a higher value aligned to the SLA, never remove the cap entirely.

## Consequences Of Violation

Reliability: Effective retry horizon becomes unreasonably long. Maintainability: Webhook records in pending state for weeks. Storage: Long-lived database records.

---

## Set Maximum Attempts Based on Business SLA

## Category

Reliability

## Rule

Configure `max_attempts` based on the maximum acceptable delivery delay, not an arbitrary number.

## Reason

The total retry horizon is the sum of all backoff delays. For example, 10 attempts with 10s base delay and cap at 3600s: 10 + 20 + 40 + ... + 3600 = ~7200s (2 hours). Set attempts such that the sum of delays matches your delivery SLA (e.g., 24 hours for critical webhooks).

## Bad Example

```php
// Arbitrary number with no relation to SLA
'max_attempts' => 5

// With 10s base delay, total horizon is only 310s (~5 minutes)
// Transient 10-minute outages cause permanent failure
```

## Good Example

```php
// Standard Webhooks schedule — 24-hour delivery window
'max_attempts' => 10
// With: backoff = [5s, 5m, 30m, 2h, 5h, 10h, 14h, 20h, 24h]
```

## Exceptions

Non-critical webhooks where delivery within hours is acceptable with fewer attempts.

## Consequences Of Violation

Reliability: Insufficient attempts fail on moderate outages. Performance: Excessive attempts waste resources on dead endpoints.

---

## Use Different Delays for 429 vs 5xx Responses

## Category

Reliability

## Rule

Implement error-aware backoff that uses `Retry-After` header for 429 responses and standard exponential backoff for 5xx responses.

## Reason

HTTP 429 (Too Many Requests) includes a `Retry-After` header specifying the precise interval the server wants the client to wait. Ignoring this and using standard backoff may retry too early (wasting attempts) or too late (missing optimal retry window). 5xx errors indicate server-side issues that benefit from exponential backoff.

## Bad Example

```php
function getDelay(int $attempt, int $statusCode): int
{
    return 10 * (2 ** ($attempt - 1));
    // Ignores Retry-After for 429
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

Subscribers that never rate-limit with 429 responses.

## Consequences Of Violation

Reliability: Retries during rate-limit window are wasted. Performance: Subscriber continues throttling due to premature retries.

---

## Start with a Reasonable Initial Delay (>= 1 Second)

## Category

Performance

## Rule

Set the initial backoff delay to at least 1 second; never use sub-second initial delays for webhook retries.

## Reason

Sub-second initial delays trigger near-instant retries that often fail with the same transient error, consuming attempt budget and queue resources without meaningful recovery time. Most transient network issues resolve within 1-5 seconds.

## Bad Example

```php
function getDelay(int $attempt): int
{
    return 0.1 * (2 ** ($attempt - 1));
    // 100ms initial delay — retries before recovery
}
```

## Good Example

```php
function getDelay(int $attempt): int
{
    return min(10 * (2 ** ($attempt - 1)), 3600);
    // 10s initial delay gives recovery time
}
```

## Exceptions

Real-time notification webhooks where every second of delivery delay matters and the subscriber has confirmed <100ms response capability.

## Consequences Of Violation

Performance: Wasted retries on non-recovered endpoints. Reliability: Attempt budget consumed before recovery window.

---

## Log Backoff State for Each Retry Sequence

## Category

Observability

## Rule

Log the attempt number, delay applied, and subscriber response for every retry event in the webhook delivery lifecycle.

## Reasoning

Backoff configuration errors (zero delay, no cap, missing jitter) are invisible until incident post-mortem. Logging each retry's timing and outcome enables detection of misconfigured backoff, subscriber degradation trends, and SLA compliance measurement.

## Bad Example

```php
// No retry-specific logging
WebhookCall::create()->url($url)->payload($data)->dispatch();
```

## Good Example

```php
WebhookCall::create()
    ->url($url)
    ->payload($data)
    ->onQueue('webhooks')
    ->dispatch();

Event::listen(WebhookCallFailedEvent::class, function ($event) {
    Log::info('Webhook retry scheduled', [
        'id' => $event->webhookCall->id,
        'attempt' => $event->webhookCall->attempt,
        'response_status' => $event->webhookCall->response['status'] ?? null,
        'next_delay' => getDelay($event->webhookCall->attempt),
    ]);
});
```

## Exceptions

Extremely high-volume webhook systems (>100K/day) where per-attempt logging creates cost.

## Consequences Of Violation

Debugging: Cannot diagnose backoff configuration errors. Observability: Retry patterns invisible. SLA: Cannot measure delivery latency.

---

## Reset Backoff Count on First Successful Delivery

## Category

Reliability

## Rule

Reset the backoff attempt counter to zero after the first successful delivery following a failure; never continue an old backoff sequence across a successful delivery.

## Reason

Once delivery succeeds, the system is healthy. Continuing an old backoff sequence means the next failure inherits an inflated delay, adding unnecessary latency. Resetting ensures each failure sequence starts fresh with the configured initial delay.

## Bad Example

```php
// Continued attempt counter — never reset
class WebhookCall extends Model
{
    public function incrementAttempt(): void
    {
        $this->increment('attempt'); // Never resets
    }
}
```

## Good Example

```php
class WebhookCall extends Model
{
    public function recordSuccess(): void
    {
        $this->update(['attempt' => 0, 'status' => 'success']);
    }

    public function recordFailure(): void
    {
        $this->increment('attempt');
    }
}
```

## Exceptions

Subscribers that request a minimum interval between any two deliveries regardless of success history.

## Consequences Of Violation

Performance: Unnecessary long delays after intermittent failures. Reliability: Missed delivery SLAs due to inflated backoff.
