# Skill: Prevent Webhook Replay Attacks with Timestamps and Nonces

## Purpose
Protect webhook endpoints from replay attacks by validating timestamps and tracking nonces to ensure each webhook payload is processed only once.

## When To Use
- Any webhook receiving sensitive or mutating data
- Webhooks without built-in replay protection
- Idempotency-critical webhook processing
- Financial or compliance-focused integrations

## When NOT To Use
- Webhooks that are strictly informational/logging (idempotent)
- Webhook providers with built-in replay protection

## Prerequisites
- Shared secret or public key for signature verification
- Timestamp in webhook payload or headers

## Workflow
1. Require timestamp in webhook header: `X-Webhook-Timestamp`
2. Validate timestamp is within acceptable window (e.g., 5 minutes)
3. Use `$request->header('X-Webhook-Timestamp')` to check for replay
4. Implement nonce tracking: store nonce from header in cache, reject duplicates
5. Use cache with TTL equal to the timestamp window for nonce storage
6. Verify signature including timestamp in HMAC computation
7. Log duplicate/replay attempts for security monitoring
8. Return 200 on duplicate to avoid confusion (idempotent acknowledgment)

## Validation Checklist
- [ ] Timestamp validated within acceptable window
- [ ] Nonce tracking prevents duplicate processing
- [ ] Signature includes timestamp in HMAC
- [ ] Cache used for nonce storage with appropriate TTL
- [ ] Duplicate attempts logged
- [ ] 200 returned for duplicates (idempotent)
