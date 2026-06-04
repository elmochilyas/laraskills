## Sign Full Request Body, Not Selected Fields
---
## Category
Security
---
## Rule
Sign the complete, canonical request body in HMAC computation; never sign only selected fields.
---
## Reason
Signing selected fields allows parameter injection attacks — an attacker can modify unsigned fields without detection.
---
## Bad Example
```php
$signature = hash_hmac('sha256', "{$data['amount']}.{$data['currency']}", $secret);
```
---
## Good Example
```php
$signature = hash_hmac('sha256', json_encode($body, JSON_UNESCAPED_SLASHES), $secret);
```
---
## Exceptions
APIs that explicitly specify a canonical signing format different from the full body.
---
## Consequences Of Violation
Tampered requests pass signature verification, leading to unauthorized operations.
## Always Use hash_equals() for Comparison
---
## Category
Security
---
## Rule
Use `hash_equals()` for all signature comparisons; never use `==` or `===`.
---
## Reason
`===` is vulnerable to timing side-channel attacks; `hash_equals()` performs constant-time comparison.
---
## Bad Example
```php
if ($computed === $provided) { /* verified */ }
```
---
## Good Example
```php
if (hash_equals($computed, $provided)) { /* verified */ }
```
---
## Exceptions
None — this is non-negotiable for HMAC verification.
---
## Consequences Of Violation
Attacker can brute-force the signature character-by-character using response timing, compromising the entire auth scheme.
## Include Timestamp in Signature for Replay Protection
---
## Category
Security
---
## Rule
Always include a Unix timestamp in the signed payload and validate a tolerance window (default 300s).
---
## Reason
Without a timestamp, captured signed requests can be replayed indefinitely; a bounded tolerance window limits replay opportunity.
---
## Bad Example
```php
$toSign = $body; // no timestamp — replayable forever
```
---
## Good Example
```php
$timestamp = now()->timestamp;
$toSign = "{$timestamp}.{$body}";
$signature = hash_hmac('sha256', $toSign, $secret);
// Header: X-Signature: t={$timestamp},s={$signature}
```
---
## Exceptions
WebSocket or long-polling connections where timestamps are managed at the transport layer.
---
## Consequences Of Violation
Replay attacks succeed, duplicate payment processing, unauthorized state changes.
## Support Key Rotation with Key ID Prefix
---
## Category
Maintainability
---
## Rule
Include a key ID prefix in the signature header to support zero-downtime secret rotation.
---
## Reason
Without key versioning, rotating the secret immediately breaks all in-flight requests signed with the old key.
---
## Bad Example
```php
$header = "X-Signature: {$signature}"; // no key ID — rotation breaks all clients
```
---
## Good Example
```php
$header = "X-Signature: kid=v2,t={$timestamp},s={$signature}";
// Server tries v2, falls back to v1 during rotation window
```
---
## Exceptions
Single-server deployments where zero-downtime rotation is not required.
---
## Consequences Of Violation
Secret rotation causes a wave of authentication failures; teams avoid rotating, increasing breach risk.
## Centralize Signing in a Dedicated Service
---
## Category
Code Organization
---
## Rule
Implement HMAC signing and verification in a centralized service class, not ad-hoc per endpoint.
---
## Reason
Centralization ensures consistent algorithm, header format, key management, and replay protection across all integrations.
---
## Bad Example
```php
// Duplicated in multiple controllers
$sig = hash_hmac('sha256', $body, $secret);
```
---
## Good Example
```php
class HmacSigner {
    public function sign(string $body, string $secret): string { /* ... */ }
    public function verify(string $body, string $signature, string $secret): bool { /* ... */ }
}
```
---
## Exceptions
None — consistency is critical for security.
---
## Consequences Of Violation
Inconsistent implementations, some endpoints missing timestamp or using wrong algorithm, security gaps.
