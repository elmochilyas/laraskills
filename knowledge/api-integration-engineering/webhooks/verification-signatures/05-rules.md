## Always Verify Against Raw Request Body
---
## Category
Security
---
## Rule
Always compute the expected signature using `$request->getContent()` (raw body); never use parsed JSON or `$request->all()`.
---
## Reason
PHP JSON encoding may differ from the original body in whitespace, key ordering, or escaping; raw body guarantees byte-for-byte match.
---
## Bad Example
```php
$expected = hash_hmac('sha256', json_encode($request->all()), $secret); // may differ from raw
```
---
## Good Example
```php
$expected = hash_hmac('sha256', $request->getContent(), $secret); // byte-exact match
```
---
## Exceptions
Providers that explicitly specify signing on parsed JSON with a canonical representation.
---
## Consequences Of Violation
Signature verification fails on legitimate requests due to whitespace/key-order differences, causing false rejections.
## Use hash_equals() Exclusively for Comparison
---
## Category
Security
---
## Rule
Use `hash_equals()` for all signature comparisons; never use `==` or `===`.
---
## Reason
`===` is vulnerable to timing side-channel attacks; `hash_equals()` performs constant-time comparison regardless of input.
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
None — this is non-negotiable for signature verification.
---
## Consequences Of Violation
Attacker can brute-force the signature character-by-character using response timing, undermining the entire auth scheme.
## Implement Provider-Specific Validator Classes
---
## Category
Code Organization
---
## Rule
Implement one `SignatureValidator` class per provider with non-standard signing; never use a single validator for all.
---
## Reason
Stripe, GitHub, Slack, and Adyen all use different signature formats; a generic validator cannot correctly handle all variations.
---
## Bad Example
```php
class GenericValidator implements SignatureValidator {
    public function isValid(Request $request, WebhookConfig $config): bool {
        return hash_equals(/* tries to handle all formats — fails for non-standard */);
    }
}
```
---
## Good Example
```php
class StripeSignatureValidator implements SignatureValidator {
    public function isValid(Request $request, WebhookConfig $config): bool {
        // Stripe's t=timestamp,v1=signature format
    }
}
```
---
## Exceptions
Standard Webhooks compliant providers using the reference implementation.
---
## Consequences Of Violation
Failed signature verification for non-standard providers, rejected legitimate webhooks.
## Support Multiple Signature Versions for Key Rotation
---
## Category
Maintainability
---
## Rule
Parse and verify against multiple signature versions in the header; never assume only one signature.
---
## Reason
Key rotation requires accepting both old and new signatures during the transition window; single-signature handling breaks rotation.
---
## Bad Example
```php
$signature = $request->header('Stripe-Signature'); // takes only the first signature
```
---
## Good Example
```php
$signatures = explode(',', $request->header('Stripe-Signature'));
foreach ($signatures as $sig) {
    [$version, $value] = explode('=', $sig);
    $secret = $version === 'v1' ? config('services.stripe.secret_v1')
        : ($version === 'v2' ? config('services.stripe.secret_v2') : null);
    if ($secret && hash_equals(hash_hmac('sha256', $payload, $secret), $value)) {
        return true;
    }
}
return false;
```
---
## Exceptions
Providers that don't support signature versioning.
---
## Consequences Of Violation
Key rotation causes a wave of verification failures; teams avoid rotating, increasing breach risk.
## Return Generic Errors on Invalid Signatures
---
## Category
Security
---
## Rule
Return a generic 403/500 response on signature verification failure; never reveal why verification failed.
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
Internal debugging endpoints in non-production environments.
---
## Consequences Of Violation
Attackers learn which part of the verification failed, enabling targeted exploitation.
