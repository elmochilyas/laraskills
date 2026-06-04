# ECC Anti-Patterns — Replay Attack Prevention for Webhooks

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 03-webhooks |
| **Knowledge Unit** | Replay Attack Prevention for Webhooks |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. Idempotency Keys Without Timestamp Tolerance
2. Timestamp Tolerance Without Idempotency Keys
3. Overly Large Timestamp Window (>15 Minutes)
4. Timestamp Check After Signature Verification
5. Nonce Cache with No TTL (Unbounded Growth)
6. Silent Rejection Without Logging

## Repository-Wide Anti-Patterns

- Security Theater
- Silent Failure

---

## Anti-Pattern 1: Idempotency Keys Without Timestamp Tolerance

### Category
Security

### Description
Using idempotency keys as the sole replay prevention mechanism without timestamp tolerance checks. Replays with unknown or expired keys are accepted.

### Why It Happens
Idempotency keys are simpler to implement. Developers believe "if the key hasn't been seen, it's a legitimate event."

### Warning Signs
- Idempotency checked but no timestamp validation
- Old intercepted webhooks accepted if ID not in cache
- Cache miss on idempotency key allows replay

### Why It Is Harmful
An attacker intercepts a webhook payload. The idempotency key is not in cache (TTL expired or first encounter). The webhook is processed as legitimate, even if the event is years old. Without timestamp context, the endpoint cannot distinguish a fresh event from a replayed one.

### Preferred Alternative
Always combine timestamp tolerance with idempotency keys.

### Refactoring Strategy
1. Add timestamp extraction from webhook header
2. Reject if `abs($timestamp - time()) > 300`
3. Then check idempotency key after timestamp passes

### Related Rules
Always Combine Timestamp Tolerance with Idempotency Keys (05-rules.md)

### Related Skills
Prevent Webhook Replay Attacks with Timestamps and Nonces (06-skills.md)

### Related Decision Trees
Prevention Layer Strategy (07-decision-trees.md)

---

## Anti-Pattern 2: Timestamp Tolerance Without Idempotency Keys

### Category
Security

### Description
Using timestamp tolerance alone without idempotency key deduplication. Replays within the tolerance window are accepted.

### Why It Happens
Developers think "5 minute window is small enough, no one can replay that fast."

### Warning Signs
- Timestamp checked but no idempotency verification
- Same event processed multiple times within minutes

### Why It Is Harmful
An attacker intercepts a webhook and replays it 30 seconds later. The timestamp is within the 5-minute tolerance window. The webhook is processed again. No deduplication mechanism catches the replay.

### Preferred Alternative
Combine timestamp tolerance with idempotency keys.

### Refactoring Strategy
1. Extract event ID from webhook payload
2. Store processed IDs in cache with TTL
3. Check idempotency after timestamp passes

### Related Rules
Always Combine Timestamp Tolerance with Idempotency Keys (05-rules.md)

---

## Anti-Pattern 3: Overly Large Timestamp Window (>15 Minutes)

### Category
Security

### Description
Configuring the timestamp tolerance window to >15 minutes. Expands the replay attack surface unnecessarily.

### Why It Happens
Debugging signature failures leads to increasing the tolerance. "Let's try 30 minutes to be safe." It's never reduced.

### Warning Signs
- Tolerance value > 900 (15 minutes)
- Debug config tolerance leaked to production

### Why It Is Harmful
At 60-minute tolerance, an attacker has a 2-hour window (1 hour before, 1 hour after) to replay intercepted webhooks. The combination of idempotency keys with TTL matching the tolerance means cache must retain keys for 60+ minutes — increasing memory pressure.

### Preferred Alternative
Use ≤ 5-minute tolerance window (300 seconds).

### Refactoring Strategy
1. Reduce tolerance to 300 seconds
2. Verify provider clock skew against 5-minute window
3. Adjust only if legitimate events are rejected (rare)

### Related Rules
Use a Modest Timestamp Tolerance Window (≤ 5 Minutes) (05-rules.md)

---

## Anti-Pattern 4: Timestamp Check After Signature Verification

### Category
Performance

### Description
Performing HMAC signature verification before checking the timestamp. Wastes CPU on expired webhooks.

### Why It Happens
The timestamp check is added after the signature validation code. Nobody reorders the checks.

### Warning Signs
- `hash_equals()` called before `abs($timestamp - time())` check
- Signature verification logged for expired webhooks

### Why It Is Harmful
HMAC computation (~0.5ms) is wasted on every expired webhook. Under a replay attack with thousands of expired payloads, CPU is wasted on meaningless signature verification before the timestamp check rejects them. The timestamp check is cheaper (~0.001ms).

### Preferred Alternative
Check timestamp first, then verify signature.

### Refactoring Strategy
1. Move timestamp check to the beginning of validation
2. Return false immediately if timestamp is expired
3. Only compute HMAC for valid-timestamp requests

### Related Rules
Reject Expired Timestamps Before Signature Verification (05-rules.md)

---

## Anti-Pattern 5: Nonce Cache with No TTL (Unbounded Growth)

### Category
Maintainability | Performance

### Description
Storing processed nonces in cache with `Cache::forever()` or no TTL. Cache grows unboundedly.

### Why It Happens
Developers think "once processed, always processed." They don't consider cache storage limits.

### Warning Signs
- `Cache::forever("nonce:{$id}", true)` in replay prevention
- Cache memory usage growing over time
- Redis eviction kicking out nonces under memory pressure

### Why It Is Harmful
Nonces only need protection within the timestamp tolerance window. After 5 minutes, the timestamp check already rejects replayed events. Keeping nonces indefinitely wastes cache memory. Under Redis memory pressure, eviction may remove nonces that are still within the tolerance window, allowing replays.

### Preferred Alternative
Set nonce TTL equal to the timestamp tolerance window.

### Refactoring Strategy
1. Replace `Cache::forever()` with `Cache::add("nonce:{$id}", true, $tolerance)`
2. Verify TTL matches the timestamp tolerance value

### Related Rules
Track Nonces in Cache with TTL Matching Timestamp Window (05-rules.md)

---

## Anti-Pattern 6: Silent Rejection Without Logging

### Category
Security | Observability

### Description
Silently returning 200 on duplicate/replayed events without logging. Replay attacks go undetected.

### Why It Happens
Developers focus on idempotency (same response for same event) and forget observability.

### Warning Signs
- No logging in duplicate detection path
- No metrics on replay detection events
- Replay attacks invisible in monitoring

### Why It Is Harmful
An attacker replays 10,000 intercepted webhooks over 24 hours. Each returns 200. No log entry. No metric increment. The attacker learns the endpoint accepts replays and escalates to more sophisticated attacks. Operations has no forensic trail.

### Preferred Alternative
Log every detected duplicate/replay with event metadata.

### Refactoring Strategy
1. Add `Log::warning()` on duplicate detection
2. Increment metrics counter per provider
3. Alert on duplicate rate > threshold

### Related Rules
Log All Replay Detection Events for Security Auditing (05-rules.md)
