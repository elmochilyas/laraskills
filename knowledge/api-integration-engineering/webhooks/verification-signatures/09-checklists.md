# Verification Signatures — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Incoming Webhooks
- **Knowledge Unit:** Verification Signatures
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand HMAC-SHA256 fundamentals
- [ ] Familiarity with Spatie webhook-client basics
- [ ] Knowledge of raw body signing vs JSON re-encoding differences

## Implementation Checklist
- [ ] Signature verification uses raw request body (`$request->getContent()`)
- [ ] `hash_equals()` used for all signature comparisons
- [ ] Provider-specific validator classes implement `SignatureValidator` interface
- [ ] Multi-secret rotation supported via signature version prefix
- [ ] Invalid signatures return 500/403 without helpful error details
- [ ] Secrets stored in environment variables, never in code
- [ ] Verification done before any database writes or business logic

## Verification Checklist
- [ ] Tested with real provider payload samples
- [ ] Edge cases handled: empty body, missing signature header, multiple signatures
- [ ] Timing-safe comparison verified (no `===` used)

## Security Checklist
- [ ] Always verify against raw request body, never parsed JSON
- [ ] Always use `hash_equals()` for comparison — never `===`
- [ ] Store signing secrets in environment variables or vaults
- [ ] Return 500/403 on invalid signature; don't leak helpful error details
- [ ] Combine signature verification with timestamp validation for replay protection

## Performance Checklist
- [ ] HMAC-SHA256: <1ms for typical payloads
- [ ] `hash_equals()` constant-time; negligible difference from `===`
- [ ] Multi-secret verification: <2ms per additional secret
- [ ] Base64 decoding of provided signature is the most expensive operation

## Production Readiness Checklist
- [ ] Spatie `DefaultSignatureValidator` for standard HMAC providers
- [ ] Custom validators for non-standard providers (Stripe, GitHub, Slack, Adyen)
- [ ] Support multiple signature versions for zero-downtime secret rotation

## Common Mistakes to Avoid
- [ ] Avoid verifying against re-encoded JSON instead of raw request body
- [ ] Avoid using `===` instead of `hash_equals()` (timing side-channel)
- [ ] Avoid logging raw payload or signature in error logs (exposing secrets)
- [ ] Avoid not handling edge cases: empty body, missing signature header
- [ ] Avoid hardcoding provider-specific verification in controller
