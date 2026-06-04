# Custom Signature Validator Implementation for Non-Standard Webhooks — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Incoming Webhooks
- **Knowledge Unit:** Custom Signature Validator Implementation for Non-Standard Webhooks
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand HMAC-SHA256 fundamentals
- [ ] Familiarity with Spatie webhook-client package configuration
- [ ] Knowledge of provider-specific signature formats (Stripe, GitHub, Slack)

## Implementation Checklist
- [ ] Validator uses `hash_equals()` for signature comparison
- [ ] Raw body accessed via `$request->getContent()`, not JSON re-encoding
- [ ] Tested with real provider payload samples
- [ ] One provider per validator class (Single Responsibility Principle)
- [ ] Validator implements `SignatureValidator` interface (`isValid(Request $request, WebhookConfig $config): bool`)
- [ ] Signature parsing extracted into dedicated private methods
- [ ] Validator returns `false` on any failure; never throws exceptions

## Verification Checklist
- [ ] Verification failure logged without exposing payload
- [ ] Unit tests written with provider's official test vectors
- [ ] Multi-secret rotation supported via signature version prefix

## Security Checklist
- [ ] Timing-safe comparison mandatory: `hash_equals()` not `===`
- [ ] Raw payload never logged in validator failure logs
- [ ] Generic failure responses returned; validation failure details not revealed
- [ ] Signing secrets rotated regularly
- [ ] Rate limiting on webhook endpoints regardless of validator

## Performance Checklist
- [ ] Validator execution sub-millisecond for HMAC operations
- [ ] Raw body I/O cached (main bottleneck)
- [ ] Multi-secret validation time proportional to number of secrets

## Production Readiness Checklist
- [ ] Validator class in `App\Webhooks\Validators\{Provider}Validator`
- [ ] Validator switched via `signature_validator` config key per webhook config
- [ ] Composite validators chain signature + timestamp + nonce verification
- [ ] Multi-secret validators try keys in order for zero-downtime rotation

## Common Mistakes to Avoid
- [ ] Avoid verifying against re-encoded JSON instead of raw body
- [ ] Avoid using `===` instead of `hash_equals()` (timing side-channel vulnerability)
- [ ] Avoid hardcoding signing logic in ProcessWebhookJob instead of validator
- [ ] Avoid not testing with real provider payloads before deployment
- [ ] Avoid missing edge cases: empty body, absent signature header, multiple signatures
