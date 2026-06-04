# Skill: Verify Incoming Webhook Signatures Using Provider Standards

## Purpose
Implement signature verification for incoming webhooks following provider-specific standards (Stripe, GitHub, Slack, Paddle) to ensure authenticity.

## When To Use
- Integrating with webhook providers with documented signature schemes
- Ensuring webhook payload authenticity
- Preventing forged webhook requests

## When NOT To Use
- Internal-only webhook endpoints
- Provider's own verification package is available (prefer that)

## Prerequisites
- Provider's webhook signing secret
- Provider's signature documentation
- Middleware or verification class

## Workflow
1. Identify provider's signature algorithm (HMAC-SHA256, RSA, etc.)
2. Extract signature from provider-specific header
3. Build signed payload string per provider's spec
4. Compute expected signature using shared secret/public key
5. Compare using `hash_equals()` for constant-time comparison
6. Include timestamp validation where supported
7. Handle key rotation by supporting multiple active keys
8. Return 401 on verification failure

## Validation Checklist
- [ ] Provider's signature scheme implemented correctly
- [ ] Signature extracted from correct header
- [ ] Signed payload string built according to provider's spec
- [ ] Constant-time comparison with `hash_equals()`
- [ ] Timestamp validation where applicable
- [ ] Multiple active keys supported for rotation
- [ ] 401 returned on verification failure
