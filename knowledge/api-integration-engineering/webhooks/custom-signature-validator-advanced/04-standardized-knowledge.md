# ECC Standardized Knowledge — Custom Signature Validator Implementation for Non-Standard Webhooks

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit ID | ku-02 |
| Knowledge Unit | Custom Signature Validator Implementation for Non-Standard Webhooks |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K021, K003, K011 |

## Overview (Engineering Value)
Spatie's default `SignatureValidator` implements standard HMAC-SHA256 raw body verification, but many providers use non-standard signature schemes: Stripe's timestamped format, GitHub's HMAC hex with `sha256=` prefix, Slack's version-prefixed signatures, or enveloped formats from Adyen and Braintree. Custom `SignatureValidator` implementations adapt the Spatie pipeline to each provider's unique signing mechanism while maintaining the same validation, storage, and queuing benefits.

## Core Concepts
- **SignatureValidator Interface**: `isValid(Request $request, WebhookConfig $config): bool`
- **Raw Body Requirement**: Most schemes require the unmodified request body
- **Timing-Safe Comparison**: Always use `hash_equals()` — never `===`
- **Provider-Specific Headers**: Each provider uses different header names and formats
- **WebhookConfig Access**: Validator receives full config including signing secret

## When To Use
- Any provider not using raw-body HMAC-SHA256 (Stripe, GitHub, Slack, Adyen, Braintree)
- Providers using timestamp-in-payload signing (Stripe's `t=timestamp,v1=...`)
- Multi-secret rotation periods requiring verification against multiple keys
- Composite verification requiring signature + timestamp + nonce checks

## When NOT To Use
- Providers using standard raw-body HMAC-SHA256 (default validator suffices)
- Standard Webhooks compliant providers (use reference implementation)
- Internal webhooks with custom trust model

## Best Practices
- Implement one validator class per provider for clear separation
- Extract signature parsing into dedicated private methods
- Use `hash_equals()` exclusively for comparison
- Return `false` on any failure; never throw exceptions from validators
- Unit test with known-good test vectors from provider documentation
- Log verification failures with minimal detail (no payload) for debugging

## Architecture Guidelines
- Validators in `App\Webhooks\Validators\{Provider}Validator`
- Switch validators via `signature_validator` config key per webhook config
- Composite validators chain signature + timestamp + nonce verification
- Multi-secret validators try keys in order for zero-downtime rotation
- Wrap validators with logging decorator for production debugging

## Performance Considerations
- Validator execution: sub-millisecond for HMAC operations
- Raw body I/O is the main bottleneck; cache body read
- Multi-secret validation doubles time per additional secret
- Composite validators add negligible overhead

## Security Considerations
- Timing-safe comparison is mandatory: `hash_equals()` not `===`
- Never log raw payload in validator failure logs
- Return generic failure responses; don't reveal why verification failed
- Rotate signing secrets regularly
- Implement rate limiting on webhook endpoints regardless of validator

## Common Mistakes
- Verifying against re-encoded JSON instead of raw body (whitespace/key ordering)
- Using `===` instead of `hash_equals()` (timing side-channel vulnerability)
- Hardcoding signing logic in ProcessWebhookJob instead of validator
- Not testing with real provider payloads before deployment
- Missing edge cases: empty body, absent signature header, multiple signatures

## Anti-Patterns
- Single validator handling all providers (violates SRP, hard to test)
- Throwing exceptions from validators (breaks Spatie pipeline)
- Payload transformation before verification (causes signature mismatch)
- Hardcoded secrets in validator class instead of config

## Examples
```php
class StripeSignatureValidator implements SignatureValidator
{
    public function isValid(Request $request, WebhookConfig $config): bool
    {
        $signature = $request->header('Stripe-Signature');
        $parts = $this->parseSignatureHeader($signature);
        $payload = $request->getContent();
        $expected = hash_hmac('sha256', "{$parts['t']}.{$payload}", $config->signingSecret);
        return hash_equals($parts['v1'], $expected);
    }
}
```

## Related Topics
- **Prerequisites**: HMAC-SHA256 fundamentals, Spatie webhook-client
- **Closely Related**: Replay attack prevention, signature verification
- **Advanced**: Ed25519 asymmetric verification, composite multi-validator chains
- **Cross-Domain**: PHP cryptography, webhook provider documentation

## AI Agent Notes
- Generate provider-specific validator class when integrating non-standard webhook
- Include hash_equals() comparison in all generated validators
- Add unit test with provider's official test vectors

## Verification
- [ ] Validator uses `hash_equals()` for signature comparison
- [ ] Raw body accessed via `$request->getContent()`, not JSON re-encoding
- [ ] Tested with real provider payload samples
- [ ] Verification failure logged without exposing payload
- [ ] Single Responsibility: one provider per validator class
