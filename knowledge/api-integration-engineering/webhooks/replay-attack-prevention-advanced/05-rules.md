## Always Decouple Admin 12-3 Merge
---
## Category
Security
---
## Rule
Validate timestamp before nonce check and signature verification; reject old requests early.
---
## Reason
Timestamp validation is cheap and fast; rejecting old requests early avoids costly cryptographic operations on expired payloads.
---
## Bad Example
```php
// Verifies signature first, then checks timestamp — wasted crypto on expired requests
```
---
## Good Example
```php
$timestamp = $request->header('webhook-timestamp');
if (abs(now()->timestamp - (int)$timestamp) > 300) {
    return false; // reject early — no crypto needed
}
// Then check nonce, then verify signature
```
---
## Exceptions
None — always validate timestamp first.
---
## Consequences Of Violation
Unnecessary cryptographic overhead on replayed requests, wasted processing resources.
## Combine Timestamp + Nonce for Defense in Depth
---
## Category
Security
---
## Rule
Implement both timestamp validation and nonce/idempotency key deduplication; never rely on either alone.
---
## Reason
Timestamp alone allows replay within the tolerance window; nonce alone is useless if the nonce check is bypassed. Both together provide defense in depth.
---
## Bad Example
```php
// Timestamp only — attacker can replay within 5-minute window
if (abs($now - $timestamp) > 300) return false;
```
---
## Good Example
```php
// Timestamp check
if (abs($now - $timestamp) > 300) return false;
// Nonce check
$key = "webhook:{$provider}:{$id}";
if (!Cache::add($key, true, now()->addHours(24))) return false;
```
---
## Exceptions
Internal webhooks over trusted networks where replay risk is negligible.
---
## Consequences Of Violation
Replay attacks succeed within the timestamp window, causing duplicate processing.
## Use Redis-Backed Nonce Store with TTL
---
## Category
Reliability
---
## Rule
Store nonces in Redis with TTL equal to the maximum retry horizon (24h standard); never use unbounded storage.
---
## Reason
Nonce store without TTL grows unbounded; Redis TTL automatically evicts expired entries.
---
## Bad Example
```php
DB::table('processed_webhooks')->insert(['id' => $webhookId]); // no TTL — unbounded growth
```
---
## Good Example
```php
Cache::add("webhook:stripe:{$webhookId}", true, now()->addHours(24)); // auto-expires
```
---
## Exceptions
Compliance requirements mandating longer deduplication records.
---
## Consequences Of Violation
Unbounded nonce store growth, degraded performance, increased storage costs.
## Scope Nonces by Provider
---
## Category
Code Organization
---
## Rule
Include the provider name in the nonce cache key to prevent collisions between different providers.
---
## Reason
Different providers may use the same event ID; without provider scoping, a Stripe event ID could collide with a GitHub event ID.
---
## Bad Example
```php
$key = "webhook:{$eventId}"; // no provider scope — collision risk
```
---
## Good Example
```php
$key = "webhook:{$provider}:{$eventId}"; // provider-scoped — no collision
```
---
## Exceptions
Single-provider integrations where collision is impossible.
---
## Consequences Of Violation
Valid webhooks rejected due to key collisions across providers, missed event processing.
## Log Replay Attempts for Security Monitoring
---
## Category
Security
---
## Rule
Log all timestamp rejections and duplicate nonce detections for security monitoring and incident response.
---
## Reason
Replay attempts may indicate an attack; logging provides forensic evidence for incident investigation.
---
## Bad Example
```php
// Replay silently rejected — no audit trail
if (!Cache::add($key, true, 86400)) return false;
```
---
## Good Example
```php
if (!Cache::add($key, true, 86400)) {
    Log::warning('Duplicate webhook detected', ['provider' => $provider, 'id' => $eventId]);
    return false;
}
```
---
## Exceptions
None — always log security-relevant events.
---
## Consequences Of Violation
Replay attacks go undetected, no forensic evidence for incident response, compliance violations.
