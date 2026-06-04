# Rule Card: K067 — Spatie Webhook Client

---

## Rule 1

**Rule Name:** sign-all-outgoing-webhooks

**Category:** Always

**Rule:** Always sign outgoing webhooks with a secret.

**Reason:** Without signatures, the receiver cannot verify authenticity — anyone could be sending webhooks.

**Bad Example:**
```php
WebhookCall::create()
    ->url('https://partner.example.com/webhooks')
    ->payload(['order_id' => 123])
    ->dispatch();
// No signature — receiver can't verify sender
```

**Good Example:**
```php
WebhookCall::create()
    ->url('https://partner.example.com/webhooks')
    ->payload(['order_id' => 123])
    ->useSecret($this->webhookSecret) // Signs with HMAC
    ->dispatch();
```

**Exceptions:** Webhooks sent to trusted internal services on the same network.

**Consequences Of ViolATION:** An attacker discovers the webhook URL and sends fake order-update payloads — the partner system processes phantom orders, shipping products that were never purchased.

---

## Rule 2

**Rule Name:** set-reasonable-timeout-and-retries

**Category:** Always

**Rule:** Always configure timeout and retry settings for outgoing webhooks.

**Reason:** Defaults may be too aggressive (hammering a slow receiver) or too lax (never retrying transient failures).

**Bad Example:**
```php
WebhookCall::create()
    ->url('https://partner.example.com/webhooks')
    ->payload([...])
    ->dispatch(); // Default timeout/retries — may not be appropriate
```

**Good Example:**
```php
WebhookCall::create()
    ->url('https://partner.example.com/webhooks')
    ->payload([...])
    ->timeoutInSeconds(10)          // 10s timeout
    ->maximumNumberOfAttempts(5)     // 5 total attempts
    ->backoffStrategy(new ExponentialBackoff(10))
    ->dispatch();
```

**Exceptions:** Internal webhooks where receivers are fast and reliable.

**Consequences Of ViolATION:** A partner's webhook endpoint is under maintenance (503) — the client retries aggressively with default 1-second intervals, sending 60 requests in a minute. The partner's rate limiter blacklists the sender, and all subsequent webhooks are rejected.

---

## Rule 3

**Rule Name:** use-webhook-profile-for-consistency

**Category:** Prefer

**Rule:** Prefer defining webhook profiles for reusable configurations.

**Reason:** Duplicating timeout/retry/secret config across all dispatches is error-prone.

**Bad Example:**
```php
// Dispatched from 5 different places — 5 copies of the same config
WebhookCall::create(['... 20 lines of config ...]);
WebhookCall::create(['... 20 lines of config ...]);
```

**Good Example:**
```php
// config/webhook-profiles.php
'partner' => [
    'url' => env('PARTNER_WEBHOOK_URL'),
    'secret' => env('PARTNER_WEBHOOK_SECRET'),
    'timeout' => 10,
    'attempts' => 5,
],

// Usage:
WebhookCall::create()->useProfile('partner')->payload([...])->dispatch();
```

**Exceptions:** One-off webhooks to non-standard endpoints with unique requirements.

**Consequences Of ViolATION:** The partner rotates their webhook secret — the developer updates it in 3 out of 5 dispatch locations. Two locations continue using the old secret, causing all their webhooks to be rejected with 401.

---

## Rule 4

**Rule Name:** monitor-failed-webhook-calls

**Category:** Always

**Rule:** Always monitor failed outgoing webhook delivery.

**Reason:** Failed webhooks mean the external system missed an event — silent failures cause data inconsistency.

**Bad Example:**
```php
// No monitoring — failed webhooks are invisible
```

**Good Example:**
```php
// Log all webhook failures
WebhookCall::creating(function (WebhookCall $call) {
    Log::info("Sending webhook to {$call->url}");
});

// Or use the built-in events
Event::listen(WebhookCallFailedEvent::class, function ($event) {
    Alert::send("Webhook failed: {$event->webhookCall->url}");
});
```

**Exceptions:** Non-critical webhooks whose failure has no immediate impact.

**Consequences Of ViolATION:** A partner changed their webhook endpoint URL — all 500 daily webhook calls fail with 404. No one notices for 3 days until a user reports that their order isn't showing up in the partner's system.
