# Skill: Implement Signed Request Pattern

## Purpose
Implement signed URL/request validation using HMAC signatures for tamper-proof external callbacks and public endpoints, with timestamp validation and replay protection.

## When To Use
- Public callback/webhook URLs (no auth possible)
- Temporary access URLs (file downloads, verification links)
- Tamper-proof parameters in URL-based flows

## When NOT To Use
- Authenticated API endpoints — use standard auth
- Server-to-server with mutual TLS — more secure

## Prerequisites
- HMAC signing understanding
- URL generation for signed endpoints

## Inputs
- Signed endpoint routes
- Signing key configuration

## Workflow
1. Generate signature using HMAC-SHA256: `hash_hmac('sha256', $data, $secretKey)`
2. Create URL with query parameters + signature: `?expires=...&signature=...`
3. Validate signature in middleware: recompute HMAC, compare using `hash_equals()`
4. Include expiration timestamp to limit signed URL validity window
5. Include nonce for one-time use URLs: store nonce in cache with TTL
6. Use `URL::signedRoute()` for Laravel's built-in signed URL support
7. Return 403 Forbidden for invalid signatures
8. Return 410 Gone for expired signatures
9. Return 409 Conflict for replayed nonces
10. Log invalid signature attempts for abuse detection

## Validation Checklist
- [ ] HMAC-SHA256 used for signature generation
- [ ] `hash_equals()` for constant-time comparison
- [ ] Expiration timestamp in signed URL
- [ ] Nonce for one-time use URLs where needed
- [ ] Laravel `signedRoute()` used or custom implementation
- [ ] Invalid signature returns 403
- [ ] Expired URL returns 410
- [ ] Replayed nonce returns 409
- [ ] Invalid signature attempts logged
- [ ] Tests verify valid, invalid, expired, and replayed scenarios

## Common Failures
- Using string comparison instead of `hash_equals()` — timing attack vulnerability
- No expiration — signed URL valid forever
- No nonce for one-time URLs — URL valid multiple times
- Signature over too little data — params not included, signature can be reused
- Secret key hardcoded — exposed in code, can't rotate
- Secret key reused across environments — test signatures valid in production
- Signature in URL without HTTPS — signed URL intercepted, replayed

## Decision Points
- Laravel built-in vs custom — built-in for simple, custom for advanced (nonces, custom data)
- Expiration window — 1 hour for verification links, 5 minutes for callback URLs
- Nonce storage — cache/Redis for automatic TTL cleanup

## Performance Considerations
- HMAC computation is fast (~0.01ms)
- Nonce lookup adds 0.5ms with Redis
- Expiration check is arithmetic comparison — negligible

## Security Considerations
- Always use `hash_equals()` to prevent timing attacks
- Always include expiration to limit validity window
- Use nonce for one-time URLs to prevent replay
- Secret key must be environment-specific and rotated periodically
- Signed URLs over HTTPS only — signature in plaintext over HTTP
- Signed URL parameters must be immutable — any change invalidates signature
- Log invalid signature attempts — indicates tampering attempts

## Related Rules
- Use HMAC-SHA256 For Signature Generation
- Use hash_equals() For Constant-Time Comparison
- Include Expiration In All Signed URLs
- Use Nonce For One-Time Signed URLs
- Use URL::signedRoute() For Laravel Built-In Support
- Return Appropriate HTTP Status For Signature Errors

## Related Skills
- API Webhook Implementation — for webhook signed payloads
- Temporary Access URL Pattern — for temporary file access
- HMAC Request Validation — for request body signing

## Success Criteria
- Signed URLs validate correctly with valid signature
- Invalid signatures return 403 with no information leakage
- Expired signatures return 410 Gone
- Replayed nonces return 409 Conflict
- `hash_equals()` prevents timing attacks
- Secret key configurable per environment
- Logged invalid signature attempts indicate tampering
