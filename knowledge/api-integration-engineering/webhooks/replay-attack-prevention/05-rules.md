# Replay Attack Prevention for Webhooks — Rules

---

## Always Combine Timestamp Tolerance with Idempotency Keys

## Category

Security

## Rule

Implement both timestamp tolerance checks AND idempotency key deduplication; never rely on only one mechanism for replay prevention.

## Reason

Timestamp tolerance alone cannot detect replay within the tolerance window (e.g., an attacker replays the webhook 30 seconds later within a 5-minute window). Idempotency keys alone cannot detect replay of a key that was never recorded (e.g., attacker generates their own key). The combination covers both short-window and long-window attacks.

## Bad Example

```php
// Only idempotency key — no timestamp check
public function handle(Request $request): JsonResponse
{
    $key = $request->header('Idempotency-Key');
    if (Cache::has("processed:$key")) {
        return response()->json(['status' => 'already_processed']);
    }
    // No timestamp validation — old replayed events accepted if key unknown
    return $this->process($request);
}
```

## Good Example

```php
public function handle(Request $request): JsonResponse
{
    // 1. Timestamp tolerance
    $timestamp = $request->header('webhook-timestamp');
    if (abs((int) $timestamp - now()->timestamp) > 300) {
        return response()->json(['error' => 'expired'], 403);
    }

    // 2. Idempotency key
    $key = $request->header('webhook-id');
    if (Cache::add("processed:$key", true, 86400) === false) {
        return response()->json(['status' => 'already_processed']);
    }

    return $this->process($request);
}
```

## Exceptions

Webhooks from providers that do not send timestamps. In that case, idempotency keys alone provide partial protection.

## Consequences Of Violation

Security: Replay attacks succeed within tolerance window. Reliability: Duplicate processing on replay. Data integrity: Duplicate side effects.

---

## Reject Expired Timestamps Before Signature Verification

## Category

Performance

## Rule

Check the webhook timestamp against the tolerance window before performing HMAC signature verification; reject expired timestamps immediately.

## Reason

Signature verification is more expensive than timestamp comparison (~0.5ms). Rejecting expired timestamps first saves compute for obviously stale requests and reduces CPU spent on verification of expired payloads. This also prevents signature verification against timestamp-mutated content.

## Bad Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $signature = $request->header($config->signatureHeaderName);
    $expected = hash_hmac('sha256', $request->getContent(), $config->signingSecret);
    $valid = hash_equals($expected, $signature);

    if (!$valid) return false;

    // Timestamp check after expensive verification
    $timestamp = $request->header('webhook-timestamp');
    return abs((int) $timestamp - time()) <= 300;
}
```

## Good Example

```php
public function isValid(Request $request, WebhookConfig $config): bool
{
    $timestamp = $request->header('webhook-timestamp');
    if ($timestamp === null || abs((int) $timestamp - time()) > 300) {
        return false; // Fast path rejection
    }

    $signature = $request->header($config->signatureHeaderName);
    $expected = hash_hmac('sha256', $request->getContent(), $config->signingSecret);
    return hash_equals($expected, $signature);
}
```

## Exceptions

Providers that do not include timestamps in their webhook signatures.

## Consequences Of Violation

Performance: Unnecessary HMAC computation on expired requests. Security: Potential timing variance from conditional timestamp check.

---

## Use a Modest Timestamp Tolerance Window (≤ 5 Minutes)

## Category

Security

## Rule

Configure the timestamp tolerance window to 5 minutes or less; never use windows larger than 15 minutes.

## Reason

A larger window increases the replay attack surface. An attacker who intercepts a webhook within 5 minutes can replay it. At 15 minutes, the window quadruples. 5 minutes balances network clock skew tolerance with security. The Standard Webhooks specification recommends 5 minutes.

## Bad Example

```php
// Too large — 60-minute window
$tolerance = 3600;
if (abs($timestamp - time()) > $tolerance) {
    return false;
}
// Attacker has 1 hour to replay intercepted webhook
```

## Good Example

```php
// Standard Webhooks recommendation — 5 minutes
$tolerance = 300;
if (abs($timestamp - time()) > $tolerance) {
    return false;
}
```

## Exceptions

Providers with known clock skew > 5 minutes. In that case, document the exception and use the minimum window that prevents legitimate rejections.

## Consequences Of Violation

Security: Larger replay attack window. Compliance: Deviation from standard security recommendations.

---

## Include Timestamp and Nonce in HMAC Signature Calculation

## Category

Security

## Rule

Include both the timestamp and a nonce (or webhook event ID) in the payload that is HMAC-signed; never sign only the raw JSON body.

## Reason

Signing only the body allows an attacker to modify headers (including timestamp) without detection. When the timestamp is part of the signed payload, altering the timestamp invalidates the signature. This ties the signature to a specific time window, making replay outside that window impossible.

## Bad Example

```php
// Signs only the body — timestamp can be tampered
$signature = hash_hmac('sha256', $payload, $secret);
```

## Good Example

```php
// Signed content includes id, timestamp, and body (Standard Webhooks format)
$signedContent = "{$webhookId}.{$timestamp}.{$payload}";
$signature = hash_hmac('sha256', $signedContent, $secret);
```

## Exceptions

Providers that use separate signature calculation and timestamp verification (e.g., Stripe constructs a signed payload with timestamp prefix).

## Consequences Of Violation

Security: Timestamp tampering undetected. Integrity: Replay attack signature still valid.

---

## Track Nonces in Cache with TTL Matching Timestamp Window

## Category

Security

## Rule

Store processed nonces or webhook IDs in a cache with a TTL equal to the timestamp tolerance window.

## Reason

Nonces prevent replay within the tolerance window but should expire once the window closes (the timestamp check already rejects replays beyond that point). Setting TTL equal to the tolerance prevents unbounded cache growth while maintaining protection during the vulnerable window.

## Bad Example

```php
// Nonce never expires — unbounded cache growth
Cache::forever("nonce:{$id}", true);
```

## Good Example

```php
// Nonce expires when timestamp window closes
$tolerance = 300; // 5 minutes
Cache::add("nonce:{$id}", true, $tolerance);
```

## Exceptions

Regulatory requirements that mandate deduplication beyond the timestamp window. In that case, use a separate idempotency store with longer TTL.

## Consequences Of Violation

Performance: Unbounded cache growth. Security: Non-expired nonces offer no benefit beyond tolerance window.

---

## Log All Replay Detection Events for Security Auditing

## Category

Security

## Rule

Log every detected replay attempt (expired timestamp, duplicate nonce, duplicate idempotency key) with request metadata for security monitoring and incident response.

## Reason

Replay attempts may indicate active attacks. Without logging, replays from misconfigured or malicious senders go undetected. Logged replays provide audit trail for security incidents, help calibrate tolerance windows, and identify problematic providers with duplicate deliveries.

## Bad Example

```php
// Silent rejection — no logging
if (Cache::has("processed:{$id}")) {
    return response()->json(['status' => 'ok']); // Silently ignores
}
```

## Good Example

```php
if (Cache::has("processed:{$id}")) {
    Log::warning('Duplicate webhook rejected', [
        'id' => $id,
        'ip' => request()->ip(),
        'provider' => $config->name,
    ]);
    Metrics::increment('webhook.replay_detected', ['provider' => $config->name]);
    return response()->json(['status' => 'ok']);
}
```

## Exceptions

Extremely high-volume systems (>100K/day) where logging every duplicate creates cost pressure. Sample or aggregate in that case.

## Consequences Of Violation

Security: Undetected replay attacks. Debugging: No visibility into duplicate delivery rates. Compliance: Missing security audit trail.
