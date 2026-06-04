# Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Webhook Distribution
- **Knowledge Unit ID:** K069
- **Knowledge Unit:** Webhook Replay Attack Prevention
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

# Overview
Webhook replay attacks occur when an attacker intercepts a valid webhook request and retransmits it to the receiving endpoint, causing duplicate processing of the same event. Prevention relies on a combination of HMAC signature verification and a timestamp-based freshness check. The HMAC proves the request originated from the legitimate sender, and the timestamp proves the request is recent — neither alone is sufficient; together they provide strong replay protection.

# Core Concepts
- **Replay attack**: An attacker captures a valid webhook payload and resends it later, causing duplicate processing (e.g., processing the same order twice).
- **Timestamp header**: The sender includes a `Timestamp` header with the Unix epoch time. The receiver rejects requests where `|now - timestamp| > tolerance`.
- **Timestamp tolerance**: A configurable window (typically 5 minutes) accommodating network delay and clock skew while rejecting replayed requests.
- **HMAC signature over timestamp**: The signature covers the concatenation of timestamp and payload. Modifying the timestamp invalidates the signature.
- **Nonce**: A unique identifier per webhook that the receiver tracks to detect duplicate delivery. Optional — not implemented natively in Spatie client.
- **Idempotency key**: A sender-generated unique key used for deduplication at the business logic layer. Handles both replay attacks and accidental double-sends.

# When To Use
- Webhooks trigger financial transactions, account changes, or destructive operations (deletions, refunds).
- Webhook delivery traverses public networks where interception is possible.
- Compliance requirements (PCI DSS, SOC 2) mandate replay attack prevention for event notifications.
- Your webhook client processes events that are not naturally idempotent.

# When NOT To Use
- Webhooks are received over mutual TLS on a private network — transport-layer security already prevents interception and replay.
- Every webhook event is inherently idempotent (e.g., "set status to X" — applying it twice produces the same result).
- The sender cannot include timestamps in webhook requests (legacy systems, constrained senders).
- Webhooks are processed immediately without queuing and idempotency is guaranteed at the application level.

# Best Practices
- **Always combine timestamp verification with HMAC signature verification.** Signature without timestamp is vulnerable to indefinite replay. Timestamp without signature is trivially forged. Together they provide authenticity + freshness.
- **Set tolerance to the maximum expected end-to-end delivery latency, not just network latency.** Queue-backed webhook delivery can add seconds or minutes between generation and receipt. A 5-minute tolerance is standard; increase to 15 minutes if queue delays are significant.
- **Use NTP-synchronized clocks on both sender and receiver.** Clock skew is the most common cause of false positives in timestamp verification. Monitor and alert on clock drift.
- **Add idempotency keys as a second defense layer.** Timestamp + signature prevents replay at the HTTP layer. Idempotency keys provide deduplication at the business logic layer, also handling sender-side duplicate deliveries.
- **Log all rejected webhooks with the rejection reason** (signature mismatch vs. timestamp expired). These are critical security signals. A spike in signature mismatches may indicate an attack; a spike in timestamp expirations may indicate clock drift.

# Performance Considerations
- HMAC computation is fast (~1μs per 1KB payload on modern hardware). The bottleneck is I/O for reading the raw request body.
- Timestamp parsing and comparison are negligible.
- `hash_equals()` is constant-time but slightly slower than `==` on matching strings. This overhead is intentional and non-negotiable for security.
- Nonce-based prevention adds a database lookup per request. Index the nonce column and prune expired entries regularly.
- Idempotency key tracking adds storage and lookup overhead. Implement TTL-based expiration for idempotency records.

# Security Considerations
- **HMAC without timestamp**: Proves authenticity but not freshness. An attacker can replay at any future time with the valid signature. Always include timestamp in the signed payload.
- **Timestamp without HMAC**: Easily modifiable. An attacker can update the timestamp to a recent value and replay the request. Always sign the timestamp.
- **Timing-safe comparison**: Always use `hash_equals()` (or equivalent constant-time function) for signature comparison. Regular `==` or `===` leaks timing information about how many characters match.
- **Raw body verification**: Compare against the raw request body bytes, not a re-encoded JSON string. Parsing and re-encoding can change the byte sequence (whitespace, key order, encoding), invalidating the signature.
- **Clock skew tolerance**: Too tight a window causes false rejections. Too wide a window increases the replay window. Balance based on measured clock drift and delivery latency.
- **Support key rotation gracefully**: During secret rotation, accept both old and new signing secrets for a transition window. The Spatie client supports multiple signing secrets for this purpose.

# Common Mistakes
| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Signature without timestamp | Only verifying HMAC, skipping freshness check | Attacker can replay a captured webhook indefinitely — it has a valid signature forever | Include timestamp in the signed payload and verify freshness on receipt |
| Timestamp without signature | Checking timestamp alone without HMAC verification | Attacker modifies the timestamp to a recent value and replays — the timestamp passes but the payload may be malicious | Always sign the concatenation of timestamp + payload |
| Using `==` for signature comparison | Developer unaware of timing attacks | Timing side-channel leaks byte-by-byte match information, enabling signature forgery | Always use `hash_equals()` or equivalent constant-time comparison |
| Re-encoding request body before verification | Parsing JSON, modifying, then re-encoding | Byte sequence changes (whitespace, key order) invalidate the signature, causing false rejections | Verify signature against the raw request body before any parsing |
| Tolerance too tight for queue-backed delivery | Setting tolerance based only on network latency | Webhooks dispatched via queue arrive after the tolerance window expires, all rejected | Set tolerance to cover end-to-end delivery time including queue latency |

# Anti-Patterns
- **Single factor replay prevention**: Relying on either HMAC or timestamp alone. Both are required — the combination provides defense in depth against both forgery and replay.
- **Infinite timestamp tolerance**: Setting tolerance to hours or days to avoid legitimate rejections. Circumvents replay protection entirely. Fix clock skew and delivery latency issues instead.
- **Ignoring raw body**: Parsing the JSON body into an array, then re-encoding it for signature verification. The re-encoded string may differ from the original (different whitespace, key ordering). Always verify against the raw request body (`$request->getContent()`).
- **Secret key in signature verification error messages**: Including the expected or computed signature in error responses helps attackers debug their forgery attempts. Return a generic 401 without details.

# Examples
```php
// Sender side: sign payload with timestamp
$timestamp = now()->timestamp;
$payload = $timestamp . '.' . json_encode($eventData);
$signature = base64_encode(
    hash_hmac('sha256', $payload, $secret, true)
);

$response = Http::withHeaders([
    'Signature' => $signature,
    'Timestamp' => $timestamp,
])->post($endpoint, $eventData);

// Receiver side: verify timestamp and signature
$receivedTimestamp = $request->header('Timestamp');
$receivedSignature = $request->header('Signature');
$rawBody = $request->getContent(); // raw bytes, not parsed JSON

// 1. Check freshness
if (abs(now()->timestamp - $receivedTimestamp) > 300) { // 5 min tolerance
    abort(401, 'Webhook expired');
}

// 2. Verify signature
$expected = base64_encode(
    hash_hmac('sha256', $receivedTimestamp . '.' . $rawBody, $secret, true)
);

if (!hash_equals($expected, $receivedSignature)) {
    abort(401, 'Invalid signature');
}

// 3. Process (with idempotency key for second-layer dedup)
$idempotencyKey = $request->header('Idempotency-Key');
if ($idempotencyKey && $this->alreadyProcessed($idempotencyKey)) {
    return response()->json(['status' => 'already_processed']);
}

$this->processWebhook($eventData);
```

# Related Topics
- K066 — Spatie Webhook Server (sender-side signing)
- K067 — Spatie Webhook Client (receiver-side verification)
- K068 — Exponential Backoff (retry strategy for failed webhooks)
- K086 — Idempotency in Distributed Systems (idempotency keys pattern)
