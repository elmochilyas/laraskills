# Skill: Implement Custom Webhook Signature Validation Middleware

## Purpose
Create custom middleware to validate webhook payload signatures from services using non-standard signing schemes (HMAC, RSA, custom headers).

## When To Use
- Webhook signature schemes not supported out-of-the-box
- Custom HMAC, RSA, or proprietary signature headers
- Multi-signature validation per webhook source

## When NOT To Use
- Standard webhook verification (Spatie webhook client, Standard Webhooks spec)
- When built-in verification from webhook provider exists

## Prerequisites
- Shared secret or public key from webhook provider
- Laravel middleware pipeline

## Workflow
1. Create middleware class implementing signature validation
2. Extract signature from request header
3. Recompute expected signature from raw request body
4. Compare using constant-time comparison (`hash_equals()`)
5. Include timestamp validation for replay protection
6. Return 401 on signature mismatch
7. Register middleware on webhook routes
8. Handle body-stream consumed by JSON middleware (use `getContent()`)

## Validation Checklist
- [ ] Custom middleware created for signature validation
- [ ] Signature extracted from correct request header
- [ ] Body retrieved via `$request->getContent()` (not JSON parsing)
- [ ] Constant-time comparison with `hash_equals()`
- [ ] Timestamp validated for replay protection
- [ ] 401 returned on invalid signature
- [ ] Middleware registered on webhook routes only
