## Use Standard Webhooks for All Outgoing Webhooks
---
## Category
Architecture
---
## Rule
Format all outgoing webhooks per the Standard Webhooks specification with `webhook-id`, `webhook-timestamp`, and `webhook-signature` headers.
---
## Reason
Standard Webhooks format ensures interoperability, future-proofs for gateway migration, and provides a consistent interface for all subscribers.
---
## Bad Example
```php
// Custom format — subscribers must implement custom verification
```
---
## Good Example
```php
$payload = json_encode($data);
$toSign = "{$eventId}.{$timestamp}.{$payload}";
$signature = base64_encode(hash_hmac('sha256', $toSign, $secret, true));
Http::withHeaders([
    'webhook-id' => $eventId,
    'webhook-timestamp' => $timestamp,
    'webhook-signature' => "v1,{$signature}",
])->post($endpoint, $data);
```
---
## Exceptions
Providers with incompatible legacy formats (run dual format during migration).
---
## Consequences Of Violation
Fragmented webhook formats, subscriber confusion, difficult gateway migration, custom verification per subscriber.
## Use Constant-Time Comparison for Signature Verification
---
## Category
Security
---
## Rule
Always use `hash_equals()` or the reference verification library for signature comparison; never use `==` or `===`.
---
## Reason
Non-constant-time comparison leaks timing information that enables attackers to forge signatures byte-by-byte.
---
## Bad Example
```php
$computed === $provided; // timing attack vulnerability
```
---
## Good Example
```php
hash_equals($computed, $provided); // constant-time — safe
```
---
## Exceptions
None — always use constant-time comparison.
---
## Consequences Of Violation
Timing attack vulnerability, forged webhook signatures, attacker-triggered webhook processing.
## Verify Against Exact Raw Payload, Not Re-Serialized
---
## Category
Security
---
## Rule
Verify the signature against the exact raw request body as received, not a re-parsed and re-encoded version.
---
## Reason
JSON encoding is not deterministic; re-serialization may change whitespace, key ordering, or encoding, producing a different string and invalidating the signature.
---
## Bad Example
```php
$payload = json_encode($request->all()); // re-serialized — signature mismatch
```
---
## Good Example
```php
$payload = $request->getContent(); // raw body — preserves exact bytes
```
---
## Exceptions
None — always use the raw request body.
---
## Consequences Of Violation
Legitimate webhooks rejected due to signature mismatch, processing failures for valid events.
## Implement 24h Idempotency Store TTL
---
## Category
Reliability
---
## Rule
Store processed webhook IDs in an idempotency store with a 24-hour TTL to cover all retry attempts.
---
## Reason
Standard Webhooks retry schedule spans 24+ hours; shorter TTL allows late retries to bypass duplicate detection.
---
## Bad Example
```php
Cache::put("webhook:$id", true, 3600); // 1h — doesn't cover full retry window
```
---
## Good Example
```php
Cache::put("webhook:$id", true, 86400); // 24h — covers all retry attempts
```
---
## Exceptions
Providers with documented shorter retry windows.
---
## Consequences Of Violation
Late retries re-processed as new events, duplicate side effects, idempotency guarantee violated.
## Set 5-Minute Timestamp Tolerance for Replay Protection
---
## Category
Security
---
## Rule
Validate `webhook-timestamp` against the current time with a 5-minute tolerance window.
---
## Reason
Too-tight tolerance causes clock skew failures; too-loose tolerance weakens replay attack prevention.
---
## Bad Example
```php
if (abs(time() - $timestamp) > 60) { return; } // 60s — too tight for clock skew
```
---
## Good Example
```php
if (abs(time() - $timestamp) > 300) { return; } // 5 min — spec default tolerance
```
---
## Exceptions
Known clock synchronization issues requiring wider window.
---
## Consequences Of Violation
Legitimate webhooks rejected due to clock skew (tight tolerance) or replay attacks succeed (loose tolerance).
## Support Multiple Signature Versions for Key Rotation
---
## Category
Security
---
## Rule
Accept multiple signatures in the `webhook-signature` header (`v1,sig1 v2,sig2`) to support zero-downtime key rotation.
---
## Reason
Single signature support forces a breaking change on key rotation; multiple signatures allow overlapping rotation periods.
---
## Bad Example
```php
$signature = $headers['webhook-signature'][0]; // takes only first — misses rotated key
```
---
## Good Example
```php
$signatures = explode(' ', $headers['webhook-signature']);
foreach ($signatures as $sig) {
    [$version, $value] = explode(',', $sig, 2);
    $secret = $this->getSecretForVersion($version);
    if (hash_equals($this->computeSignature($payload, $secret, $timestamp), $value)) {
        return; // verified
    }
}
```
---
## Exceptions
None — always support multiple signature versions.
---
## Consequences Of Violation
Key rotation breaks all subscriber integrations, forcing coordinated cutover; secret compromise requires emergency outage.
