# ECC Standardized Knowledge — HMAC Signature for API Request Signing

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | http-client-api-consumption |
| Knowledge Unit ID | ku-04 |
| Knowledge Unit | HMAC Signature for API Request Signing |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K001, K004 |

## Overview (Engineering Value)
HMAC (Hash-based Message Authentication Code) signing provides request integrity and authenticity verification for API communications. Both the client and server share a secret key; the client creates a signature over select request components, which the server independently recreates to verify authenticity, tamper-proofing, and optionally non-repudiation.

## Core Concepts
- **HMAC Algorithm**: `hash_hmac('sha256', $payload, $secret)` produces a fixed-length signature
- **Payload Composition**: Typically includes HTTP method, URI, timestamp, body hash, and headers
- **Signature Header**: Sent as `X-Signature: t=timestamp,v=signature` or `Authorization: HMAC ...`
- **Replay Prevention**: Timestamp + nonce within a short tolerance window
- **Secret Rotation**: Periodic key rotation limits exposure from compromised secrets
- **Timing-Attack Safe Comparison**: `hash_equals()` for constant-time comparison

## When To Use
- Server-to-server API authentication (no user session)
- Webhook payload verification
- Idempotent payment or write operations
- Regulatory/compliance requirements for request integrity

## When NOT To Use
- User-facing browser-based auth (use OAuth2/OpenID Connect)
- Public read-only API endpoints
- When TLS alone provides sufficient integrity guarantees
- When managing secret distribution becomes infeasible

## Best Practices
- Include timestamp in signature to bound replay window
- Use `hash_equals()` for constant-time signature comparison
- Support key rotation via key ID prefix in header
- Sign the full request body, not just selected fields
- Include a nonce for additional replay protection
- Rotate keys at least every 90 days

## Architecture Guidelines
- Centralized signing/verification service rather than ad hoc per-endpoint
- Secret stored in vault/secret manager, not in code or .env alone
- Versioned keys with key ID in signature header for rotation
- Signature validation middleware before route handler

## Performance Considerations
- HMAC computation is negligible (~0.01ms) relative to HTTP round-trip
- `hash_equals()` is constant-time but still sub-millisecond
- No external network calls needed for verification
- Payload body reading for signing requires full buffer in memory

## Common Mistakes
- Signing selected parameters instead of complete body (parameter injection)
- Using loose comparison (`==`) for signature verification (timing attack)
- Not including timestamp in signature (replay attacks)
- Rotating keys without grace period for in-flight requests (verification failures)
- Signing serialized form data instead of canonical representation

## Related Topics
- **Prerequisites**: Hash functions, secret management, HTTP headers
- **Closely Related**: OAuth 2.0 client credentials, webhook verification
- **Advanced**: Key rotation strategies, multi-key support, canonicalization
- **Cross-Domain**: Security engineering, cryptography basics

## Verification
- [ ] `hash_equals()` used for all signature comparisons
- [ ] Timestamp and nonce included in signed payload
- [ ] Replay window configured (default 300s)
- [ ] Key rotation implemented with grace period
- [ ] Signature includes full request body
- [ ] Secrets stored in vault, never in source code
