# Rule Card: K069 — Webhook Replay Attack Prevention

---

## Rule 1

**Rule Name:** use-timestamped-nonce-in-signature

**Category:** Always

**Rule:** Always include a timestamp and nonce in the webhook signature payload.

**Reason:** Without a timestamp, a captured signature can be replayed indefinitely.

**Bad Example:**
```php
// Static signature — same payload always produces same signature
$signature = hash_hmac('sha256', json_encode($payload), $secret);
```

**Good Example:**
```php
$timestamp = now()->timestamp;
$nonce = Str::random(16);
$payloadWithMeta = json_encode(['timestamp' => $timestamp, 'nonce' => $nonce, 'data' => $payload]);
$signature = hash_hmac('sha256', $payloadWithMeta, $secret);
```

**Exceptions:** Webhooks on isolated VPC-internal networks with no replay risk.

**Consequences Of ViolATION:** An attacker intercepts a "refund" webhook (HTTPS MITM or compromised network) — they replay the same webhook every hour. Each replay creates a new refund, draining the company's bank account.

---

## Rule 2

**Rule Name:** reject-expired-timestamps

**Category:** Always

**Rule:** Always reject webhooks with timestamps older than a threshold (typically 5 minutes).

**Reason:** A replayed webhook has the original timestamp — if it's too old, reject it.

**Bad Example:**
```php
$signature = hash_hmac('sha256', $payloadWithMeta, $secret);
if (hash_equals($signature, $incomingSignature)) {
    // Process — no timestamp check
}
```

**Good Example:**
```php
$timestamp = Carbon::createFromTimestamp($payload['timestamp']);
if ($timestamp->diffInMinutes(now()) > 5) {
    abort(401, 'Webhook too old — possible replay attack');
}
```

**Exceptions:** Reliability requirements that accept replays within a larger window (e.g., 1 hour).

**Consequences Of ViolATION:** An attacker captures a webhook and replays it 3 days later — the timestamp is still valid because there's no expiry check. The replayed webhook triggers a duplicate refund.

---

## Rule 3

**Rule Name:** implement-idempotency-keys

**Category:** Prefer

**Rule:** Prefer implementing idempotency keys for critical webhook operations.

**Reason:** Even with timestamps, legitimate retransmissions from the provider may arrive with the same payload — deduplicate by event ID.

**Bad Example:**
```php
// Process webhook — no deduplication
public function handleOrderPaid(Request $request): void
{
    $this->markOrderAsPaid($request->input('order_id'));
    // Same webhook delivered twice → order paid twice
}
```

**Good Example:**
```php
public function handleOrderPaid(Request $request): void
{
    $eventId = $request->input('event_id');
    $lock = Cache::lock("webhook:{$eventId}", 10);
    if ($lock->get()) {
        $this->markOrderAsPaid($request->input('order_id'));
        $lock->release();
    }
}
```

**Exceptions:** Idempotent operations (e.g., "set status to paid" is often idempotent already).

**Consequences Of ViolATION:** The webhook provider delivers the same event twice (rare but documented behavior for Stripe, GitHub, etc.) — both requests succeed, the order is processed twice, and the customer receives duplicate shipments.

---

## Rule 4

**Rule Name:** prefer-hmac-sha256-over-sha1

**Category:** Always

**Rule:** Always use HMAC-SHA256 or stronger for webhook signatures.

**Reason:** SHA-1 is cryptographically weak — HMAC-SHA1 is vulnerable to collision attacks.

**Bad Example:**
```php
$signature = hash_hmac('sha1', $payload, $secret); // Weak algorithm
```

**Good Example:**
```php
$signature = hash_hmac('sha256', $payload, $secret); // Strong algorithm
```

**Exceptions:** Integration with legacy systems that only support SHA-1.

**Consequences Of ViolATION:** An attacker crafts a different payload that produces the same HMAC-SHA1 hash — they can send a webhook with different data and a valid signature, bypassing authentication.
