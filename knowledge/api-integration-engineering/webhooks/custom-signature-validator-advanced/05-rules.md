## Implement One Validator Class Per Provider
---
## Category
Code Organization
---
## Rule
Create a dedicated `SignatureValidator` class per webhook provider with a non-standard signing scheme.
---
## Reason
Each provider (Stripe, GitHub, Slack, Adyen) uses a different signature format — parsing, algorithm, and comparison logic differ.
---
## Bad Example
```php
class GenericValidator implements SignatureValidator {
    public function isValid(Request $request, WebhookConfig $config): bool {
        // Tries to handle all formats — succeeds for none correctly
    }
}
```
---
## Good Example
```php
class StripeSignatureValidator implements SignatureValidator {
    public function isValid(Request $request, WebhookConfig $config): bool {
        // Handles Stripe's t=timestamp,v1=signature format
    }
}
class GitHubSignatureValidator implements SignatureValidator {
    public function isValid(Request $request, WebhookConfig $config): bool {
        // Handles GitHub's sha256=hex format
    }
}
```
---
## Exceptions
Standard Webhooks compliant providers using the reference implementation.
---
## Consequences Of Violation
Signature verification fails for non-standard providers, legitimate webhooks rejected or invalid webhooks accepted.
## Use hash_equals() Exclusively
---
## Category
Security
---
## Rule
Use `hash_equals()` for all signature comparisons in custom validators; never use `==` or `===`.
---
## Reason
`===` is vulnerable to timing side-channel attacks; `hash_equals()` provides constant-time comparison.
---
## Bad Example
```php
if ($computed === $provided) { /* timing vulnerability */ }
```
---
## Good Example
```php
if (hash_equals($computed, $provided)) { /* constant time */ }
```
---
## Exceptions
None — non-negotiable for security.
---
## Consequences Of Violation
Timing side-channel allows attacker to brute-force signature character by character.
## Access Raw Body via $request->getContent()
---
## Category
Security
---
## Rule
Always access the raw request body via `$request->getContent()` for signature computation; never use parsed JSON.
---
## Reason
JSON encoding/decoding alters whitespace and key ordering, producing a different byte sequence than the original payload.
---
## Bad Example
```php
$payload = json_encode($request->all()); // may differ from original body
```
---
## Good Example
```php
$payload = $request->getContent(); // byte-exact original body
```
---
## Exceptions
Providers explicitly specifying canonical JSON signing.
---
## Consequences Of Violation
Signature mismatch on legitimate requests due to whitespace/key-order differences, false verification failures.
## Test with Provider's Official Test Vectors
---
## Category
Testing
---
## Rule
Use the provider's official test payloads and signatures in validator unit tests; never rely solely on hand-crafted fixtures.
---
## Reason
Provider test vectors are guaranteed to match real-world behavior; hand-crafted fixtures may miss edge cases.
---
## Bad Example
```php
// Hand-crafted test — may not match real provider behavior
public function test_validator(): void {
    $this->assertTrue($validator->isValid(...));
}
```
---
## Good Example
```php
// Provider's official test vector
public function test_stripe_signature(): void {
    $payload = file_get_contents('tests/Fixtures/stripe/signed-payload.json');
    $signature = 't=1492774577,v1=525c...';
    $request = Request::create('/webhook/stripe', 'POST', [], [], [], [], $payload);
    $request->headers->set('Stripe-Signature', $signature);
    $this->assertTrue($this->validator->isValid($request, $this->config));
}
```
---
## Exceptions
Providers that don't publish test vectors (capture real payloads instead).
---
## Consequences Of Violation
Validator passes tests but fails in production against real provider payloads.
## Return Generic Failure Responses
---
## Category
Security
---
## Rule
Return a generic 403 response on verification failure; never reveal why verification failed.
---
## Reason
Detailed error messages help attackers refine their approach; generic responses limit information leakage.
---
## Bad Example
```php
return response()->json(['error' => 'Signature timestamp expired'], 403);
```
---
## Good Example
```php
return response()->json(['error' => 'Invalid request'], 403); // generic
```
---
## Exceptions
Non-production environments where debugging is prioritized.
---
## Consequences Of Violation
Attackers learn which verification component failed, enabling targeted exploitation.
