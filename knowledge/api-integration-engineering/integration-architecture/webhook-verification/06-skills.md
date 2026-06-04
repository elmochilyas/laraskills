# Skill: Verify Webhook Authenticity with Cryptographic Signatures

## Purpose
Verify incoming webhook payloads using cryptographic signatures (HMAC, RSA) to ensure they originated from the claimed sender and haven't been tampered with.

## When To Use
- All webhook receiving endpoints processing sensitive or mutating data
- Verifying webhook payload integrity and authenticity
- Security-critical webhook integrations

## When NOT To Use
- Internal-only endpoints (same network trust)
- Webhooks that only trigger idempotent, non-sensitive actions

## Prerequisites
- Shared secret or public key from webhook provider
- Signature verification middleware

## Workflow
1. Identify provider's signature algorithm and header location
2. Extract raw request body via `$request->getContent()`
3. Compute expected signature using shared secret
4. Compare with `hash_equals()` for timing-safe comparison
5. Handle multiple signatures for key rotation
6. Validate timestamp alongside signature for replay protection
7. Return 401 on verification failure, log for monitoring
8. Test with valid and forged payloads

## Validation Checklist
- [ ] Provider's signature algorithm identified and implemented
- [ ] Raw body retrieved via `getContent()` (not JSON parsed)
- [ ] `hash_equals()` used for constant-time comparison
- [ ] Multiple signatures handled for key rotation
- [ ] Timestamp validated alongside signature
- [ ] 401 returned on failure
- [ ] Valid and forged payloads tested
