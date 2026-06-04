# ECC Standardized Knowledge — Verification Signatures

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit ID | ku-02 |
| Knowledge Unit | Verification Signatures |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K003, K021, K022 |

## Overview (Engineering Value)
Webhook signature verification ensures that incoming webhook requests are authentic (from the claimed provider) and untampered (payload hasn't been modified in transit). HMAC-SHA256 with a shared secret is the dominant mechanism, used by Stripe, GitHub, Slack, and the Standard Webhooks specification. The verification pipeline requires raw-body signing, timing-safe comparison (`hash_equals`), support for multi-secret rotation, and replay attack prevention via timestamp binding. Spatie's laravel-webhook-client provides `DefaultSignatureValidator` for standard HMAC, with custom validator support for non-standard provider signatures.

## Core Concepts
- **HMAC-SHA256**: `hash_hmac('sha256', $payload, $secret)` producing verifiable signature
- **Timing-Safe Comparison**: `hash_equals($expected, $actual)` prevents side-channel attacks
- **Raw Body Signing**: Sign the raw `php://input`, not re-encoded JSON (whitespace/key order matters)
- **Multi-Secret Rotation**: Accept `v1,sig1 v2,sig2` for zero-downtime key rotation
- **Timestamp Binding**: Sign `$timestamp.$payload` to enable replay attack prevention
- **Custom SignatureValidator**: Implement provider-specific verification (Stripe's t=, GitHub's sha256=)

## When To Use
- All incoming webhook endpoints (signature verification is mandatory)
- Any webhook that can trigger data writes or side effects
- Webhooks from providers with documented signing mechanisms

## When NOT To Use
- Internal webhooks within trusted network (still recommended for defense in depth)
- Development environments where signature checking complicates testing

## Best Practices
- Always verify against raw request body (`$request->getContent()`), never parsed JSON
- Always use `hash_equals()` for comparison, never `===` (timing side-channel)
- Implement provider-specific validators as separate classes implementing `SignatureValidator`
- Store signing secrets in environment variables or vaults, never in source code
- Support multiple signature versions for zero-downtime secret rotation

## Architecture Guidelines
- Spatie's `DefaultSignatureValidator` for standard HMAC providers
- Custom validators for non-standard providers (Stripe, GitHub, Slack, Adyen)
- Verify signature before any database writes or business logic processing
- Return 500/403 on invalid signature; don't leak helpful error details
- Combine signature verification with timestamp validation for replay protection

## Performance Considerations
- HMAC-SHA256 is extremely fast (< 1ms for typical payloads)
- `hash_equals()` is constant-time but marginally slower than `===`; negligible difference
- Multi-secret verification doubles time per additional secret (still < 2ms)
- Base64 decoding of provided signature is the most expensive single operation

## Common Mistakes
- Verifying against re-encoded JSON instead of raw request body (whitespace differences cause false negatives)
- Using `===` instead of `hash_equals()` (creates timing side-channel)
- Logging raw payload or signature in error logs (exposing secrets)
- Not handling edge cases: empty body, missing signature header, multiple signatures
- Hardcoding provider-specific verification in controller instead of using SignatureValidator pattern

## Related Topics
- **Prerequisites**: HMAC fundamentals, Spatie webhook-client basics
- **Closely Related**: Receiving endpoints (ku-01), queued processing (ku-03), retry/failure (ku-04)
- **Advanced**: Custom SignatureValidator for non-standard providers
- **Cross-Domain**: Cryptography, security (replay attack prevention)

## Verification
- [ ] Signature verification uses raw request body
- [ ] `hash_equals()` used for all signature comparisons
- [ ] Provider-specific validator classes implement SignatureValidator interface
- [ ] Multi-secret rotation supported via signature version prefix
- [ ] Invalid signatures return 500/403 without helpful error details
- [ ] Secrets stored in environment variables, never in code
