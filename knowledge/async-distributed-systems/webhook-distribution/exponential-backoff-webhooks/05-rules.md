# Rule Card: K068 — Exponential Backoff for Webhook Delivery

---

## Rule 1

**Rule Name:** implement-exponential-backoff-with-jitter

**Category:** Always

**Rule:** Always implement exponential backoff with jitter for webhook retries.

**Reason:** Without jitter, all retries happen simultaneously — causing a thundering herd.

**Bad Example:**
```php
function getDelay(int $attempt): int
{
    return pow(2, $attempt) * 10; // All clients retry at same intervals
}
```

**Good Example:**
```php
function getDelay(int $attempt): int
{
    $base = pow(2, $attempt) * 10;
    $jitter = random_int(0, (int) ($base * 0.5));
    return $base + $jitter;
}
```

**Exceptions:** Single-webhook systems where thundering herd isn't a concern.

**Consequences Of ViolATION:** A partner's webhook endpoint is temporarily down — 500 webhooks all retry at exactly 10s, 20s, 40s, 80s. Each retry wave is a synchronized DDoS on the endpoint, making recovery harder.

---

## Rule 2

**Rule Name:** cap-max-retry-delay

**Category:** Always

**Rule:** Always cap the maximum retry delay.

**Reason:** Exponential backoff grows unbounded — a 10th retry delay is hours, which may exceed the relevance window.

**Bad Example:**
```php
function getDelay(int $attempt): int
{
    return pow(2, $attempt) * 10; // Attempt 10: 10240s (~2.8 hours)
}
```

**Good Example:**
```php
function getDelay(int $attempt): int
{
    return min(pow(2, $attempt) * 10, 3600); // Cap at 1 hour
}
```

**Exceptions:** Webhook delivery that's still meaningful after hours (e.g., replenishment orders).

**Consequences Of ViolATION:** A transient DNS failure causes a webhook to fail — the 15th retry is scheduled 9 hours later. By then, the order status has already been resolved through other means, and processing the webhook causes a duplicate.

---

## Rule 3

**Rule Name:** set-max-attempts-not-infinite

**Category:** Always

**Rule:** Always set a maximum number of webhook delivery attempts.

**Reason:** Infinite retries never stop — a permanently dead endpoint keeps retrying forever.

**Bad Example:**
```php
'max_attempts' => null, // Infinite retries
```

**Good Example:**
```php
'max_attempts' => 10, // Stop after 10 attempts — move to dead letter
```

**Exceptions:** None — every webhook delivery system needs an eventual stop.

**Consequences Of ViolATION:** A partner goes out of business and takes down their webhook endpoint — the system retries their webhooks for years, consuming queue capacity and filling logs with failure messages.

---

## Rule 4

**Rule Name:** classify-4xx-not-retryable

**Category:** Always

**Rule:** Always treat 4xx responses as non-retryable (except 429 and 408).

**Reason:** 4xx means the request is wrong — retrying won't fix a 400, 401, or 404.

**Bad Example:**
```php
// Retry all HTTP errors
if ($response->failed()) {
    return WebhookRetry::INCREMENT_ATTEMPT; // Retries 400 Bad Request
}
```

**Good Example:**
```php
if ($response->failed()) {
    if ($response->status() === 429 || $response->status() === 408) {
        return WebhookRetry::INCREMENT_ATTEMPT; // Retryable
    }
    if ($response->status() >= 400 && $response->status() < 500) {
        return WebhookRetry::FAIL; // Non-retryable — fix the webhook config
    }
    return WebhookRetry::INCREMENT_ATTEMPT; // 5xx — retryable
}
```

**Exceptions:** 4xx responses that might resolve (e.g., 404 from eventual consistency).

**Consequences Of ViolATION:** A webhook URL is misconfigured — every dispatch returns 404. The system retries 10 times with backoff over 2 hours before giving up, wasting resources that should process valid webhooks.
