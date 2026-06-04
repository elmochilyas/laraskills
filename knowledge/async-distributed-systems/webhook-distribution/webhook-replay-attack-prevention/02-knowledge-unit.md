# Metadata
Domain: Async & Distributed Systems
Subdomain: Webhook Distribution
Knowledge Unit: Webhook Replay Attack Prevention
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Webhook replay attacks occur when an attacker intercepts a valid webhook request and retransmits it to the receiving endpoint, causing duplicate processing of the same event. Prevention relies on a combination of HMAC signature verification and a timestamp-based freshness check. The Spatie webhook client implements both: the HMAC proves the request originated from the legitimate sender, and the timestamp proves the request is recent, not a captured replay. Neither alone is sufficient — together they provide strong replay protection.

# Core Concepts
- **Replay attack**: An attacker captures a valid webhook payload (e.g., "order.paid") and resends it later, causing the receiver to process the same order twice.
- **Timestamp header**: The sender includes a `Timestamp` header with the Unix epoch time when the webhook was generated. The receiver rejects requests where `|now - timestamp| > tolerance`.
- **Timestamp tolerance**: A configurable window (typically 5 minutes) that accommodates network delay and clock skew while rejecting replayed requests outside the window.
- **HMAC signature over timestamp**: The signature covers the concatenation of timestamp and payload. This prevents an attacker from modifying the timestamp in a captured request — any timestamp change invalidates the signature.
- **Nonce (optional)**: A unique identifier per webhook that the receiver tracks to detect duplicate delivery. The Spatie client does not implement nonces natively, but they can be added.
- **Idempotency key (optional)**: A sender-generated unique key that the receiver uses to deduplicate processing. This is a higher-level mechanism that also handles accidental double-sends by the sender.

# Mental Models
- **Dated driver's license**: A webhook with a timestamp is like a driver's license with an expiration date. The signature proves it's authentic (not forged), and the date proves it's still valid (not an old license being reused). A valid license from 2015 is real but expired — you wouldn't accept it.
- **Movie ticket stub**: The HMAC is the ticket's hologram (authenticity). The timestamp is the showtime (freshness). A genuine ticket from yesterday's show is authentic but stale — the usher won't let you in.
- **One-time pad with timestamp**: The HMAC is a seal that can only be created with the shared secret. The timestamp ensures the seal is current. An attacker can't forge the seal, and can't reuse an old sealed message.

# Internal Mechanics
- The sender computes `$payload = $timestamp . '.' . $jsonBody` and then `$signature = base64_encode(hash_hmac('sha256', $payload, $secret))`.
- The `Signature` header includes the computed HMAC. The `Timestamp` header includes the Unix timestamp used in the computation.
- The receiver extracts `Timestamp` from the request headers, checks `|now - timestamp| > tolerance`, and rejects with 401 if expired.
- The receiver then computes `hash_hmac('sha256', $timestamp . '.' . $requestBody, $secret)` using the same algorithm and compares it to the `Signature` header using `hash_equals()`.
- The `hash_equals()` function performs a timing-safe string comparison — it takes the same amount of time regardless of how many characters match, preventing timing side-channel attacks.
- The signature covers the timestamp, so any modification to the timestamp (to extend its validity) invalidates the signature.
- The tolerance is configured in the Spatie webhook-client config as `verify_timestamp` with a `tolerance` value in minutes.

# Patterns
## Strict Replay Prevention (Timestamp + Signature)
- **Purpose**: Prevent replay attacks entirely by rejecting any request outside the tolerance window.
- **Benefits**: Simple, effective, low overhead.
- **Tradeoffs**: Legitimate requests delayed by network or queue latency beyond the tolerance window are rejected. Requires accurate clocks on both sides.

## Idempotency-Key-Based Deduplication
- **Purpose**: Handle both replay attacks and accidental duplicate sends.
- **Benefits**: Receiver can safely accept and process the same idempotency key multiple times, producing the same result once.
- **Tradeoffs**: Requires stateful tracking of idempotency keys. Storage grows with unique keys.

## Nonce-Based Replay Prevention
- **Purpose**: Track unique webhook IDs to detect and reject duplicates.
- **Benefits**: Works even if the attacker replays within the timestamp tolerance window.
- **Tradeoffs**: Requires persistent storage for nonce tracking. Nonces must be pruned after expiry.

# Architectural Decisions
- Always enable timestamp verification in production. A tolerance of 5 minutes is standard for most systems. Increase to 15 minutes if significant clock skew is expected.
- Combine timestamp + signature with idempotency keys on the processing side. The timestamp provides replay prevention at the HTTP layer; the idempotency key provides deduplication at the business logic layer.
- Use NTP-synchronized clocks on both sender and receiver. Clock skew is the most common cause of false positives in timestamp verification.
- For non-Spatie receivers, implement the same verification logic manually: extract timestamp, verify signature, check freshness.

# Tradeoffs
Timestamp + signature catches most replay attacks | Does not catch replays within the tolerance window
Idempotency keys handle within-window replays | Requires storage and key management
NTP synchronization reduces false positives | Not all systems have reliable NTP — embedded systems, containers in restricted networks
Replay prevention adds latency to webhook processing | Verification adds ~1ms per request — negligible

# Performance Considerations
- HMAC computation is fast (~1μs per 1KB payload on modern hardware). The bottleneck is the I/O for reading the request body for verification.
- Timestamp parsing and comparison are negligible.
- `hash_equals()` is constant-time but slightly slower than `==` on matching strings. This overhead is intentional and non-negotiable for security.
- If using nonce-based prevention, the database lookup for existing nonces adds per-request latency. Index the nonce column and prune expired entries regularly.

# Production Considerations
- Log all rejected webhooks with the reason (signature mismatch vs. timestamp expired). These are critical security signals.
- Alert on high volumes of signature mismatches — this indicates either a configuration error on the sender or an active attack.
- When rotating secrets, support a grace period where both old and new secrets are accepted for verification. The Spatie webhook-client allows configuring multiple signing secrets for this purpose.
- Test replay prevention by capturing a valid webhook with a tool like curl and resending it after the tolerance window. Verify rejection.

# Common Mistakes
- **Signature without timestamp**: A static signature proves authenticity but not freshness. An attacker can replay at any future time with the valid signature.
- **Timestamp without signature**: Timestamp is easily modifiable by an attacker. They can update the timestamp to a recent time and replay the request.
- **Using `==` for signature comparison**: Regular string comparison leaks timing information. Always use `hash_equals()` or a timing-safe comparison.
- **Replaying the request body without parsing**: Some implementations re-encode the JSON body after parsing, which changes the byte sequence and invalidates the signature. Compare against the raw request body.

# Failure Modes
- **Clock skew beyond tolerance**: Legitimate webhooks are rejected. Mitigation: use NTP or increase tolerance during clock synchronization windows.
- **Key rotation inconsistency**: After rotating the signing key, old webhooks still in transit are rejected because the receiver only knows the new key. Mitigation: accept both old and new keys during a rotation window.
- **Body encoding mismatch**: The sender and receiver disagree on encoding (e.g., UTF-8 with/without BOM). The raw body bytes differ, causing signature mismatch. Mitigation: standardize encoding and compare raw request body.
- **Tolerance too tight for queue-backed delivery**: If the sender dispatches via a queue and the queue latency exceeds the tolerance window, all webhooks arrive expired. Mitigation: set tolerance based on expected end-to-end delivery latency, not just network latency.

# Ecosystem Usage
- **Stripe webhooks**: Stripe uses a similar timestamp + signature scheme. The Spatie webhook-client's approach is modeled after this industry standard.
- **GitHub webhooks**: GitHub uses HMAC signature without timestamp. Replay prevention relies on nonces or idempotency keys instead.
- **Spatie laravel-webhook-server**: The sending package includes the `Timestamp` header by default. Verification on the client side is configured via `verify_timestamp` in the config file.

# Related Knowledge Units
- K066 Spatie Webhook Server (sender-side signing) | K067 Spatie Webhook Client (receiver-side verification) | K068 Exponential Backoff (retry strategy for failed webhooks)

# Research Notes
Replay attack prevention is a layered defense. The HMAC + timestamp combination is the minimum viable protection. For systems handling financial transactions or destructive operations, add idempotency keys as a second layer that also protects against sender-side duplicate delivery. The most common production issue is clock skew — always monitor webhook rejection rates after deploying timestamp verification to distinguish security events from operational configuration issues.

## Research Notes
- Spatie's webhook-server package dispatches webhooks as queued jobs with configurable queue, backoff, and failure behavior — each webhook call is a job instance that can be monitored through Horizon or Pulse.
- Webhook replay attack prevention requires idempotency keys (sent as Idempotency-Key header) and a sliding window timestamp validation — the receiving service checks if a request with the same key was already processed within the window.
- Exponential backoff for webhooks must consider the total retry window (e.g., 24 hours) and the risk of thundering herd when all failed webhooks retry simultaneously — jitter is essential to avoid synchronized retries.
- The spatie/webhook-client package validates incoming webhooks via signature verification (HMAC with shared secret) and provides middleware for custom validation logic.
- Webhook delivery guarantees in Laravel follow the queue's at-least-once semantics — webhook receivers must implement idempotency to handle duplicate deliveries.
- Community webhook patterns include: event-based webhook triggers (using Laravel events), webhook delivery logs (for audit and debugging), and webhook health monitoring (success rate, latency percentiles).
- Webhook payload versioning is handled by the webhook provider — versioned endpoints or payload version headers enable backward-compatible webhook schema evolution.
- The spatie/laravel-webhook-server package supports webhook signing with SHA256 HMAC, configurable headers, and conditional dispatch based on webhook status.
