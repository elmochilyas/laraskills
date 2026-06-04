# Skill: Sign and Verify API Requests with HMAC Signatures

## Purpose
Implement HMAC-based request signing for outbound API calls or incoming webhook verification, ensuring request authenticity and integrity.

## When To Use
- Authenticating API requests without OAuth2
- Verifying webhook payloads from external services
- Ensuring request integrity between services
- When API keys alone are insufficient for security

## When NOT To Use
- OAuth2-based authentication is already in place
- TLS-only is sufficient for the security model
- Public, non-authenticated endpoints

## Prerequisites
- Shared secret between client and server
- HMAC-capable hashing algorithm (SHA-256)

## Workflow
1. Define HMAC signing scheme: algorithm, signature location (header), payload format
2. Build canonical request: method + path + body + timestamp + nonce
3. Compute HMAC: `hash_hmac('sha256', $canonicalString, $secret)`
4. Send signature in header: `X-Signature: {hmac}`
5. Include timestamp in header for replay protection
6. On server: recompute HMAC from received request and compare
7. Validate timestamp is within acceptable window (5 minutes)
8. Implement nonce tracking for replay prevention
9. Log authentication failures for security monitoring

## Validation Checklist
- [ ] Shared secret stored securely (not in version control)
- [ ] Canonical request format documented and versioned
- [ ] Timestamp included for replay protection
- [ ] Timestamp validation with appropriate window
- [ ] Nonce tracking prevents replay attacks
- [ ] Signature comparison uses constant-time comparison
- [ ] Auth failures logged for security monitoring
