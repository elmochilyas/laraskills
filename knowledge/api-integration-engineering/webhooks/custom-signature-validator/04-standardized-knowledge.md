# ECC Standardized Knowledge — Custom Webhook Signature Validation

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | incoming-webhooks |
| Knowledge Unit ID | ku-09 |
| Knowledge Unit | Custom Webhook Signature Validation |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K003, K004, K015 |

## Overview (Engineering Value)
Many third-party APIs sign their webhook payloads with a secret shared secret, sending the signature as a header (typically `X-Signature-256` or `X-Signature`). The receiver must independently compute the expected signature from the raw request body using the shared secret and compare it to the header value using a constant-time comparison function to prevent timing attacks.

## Core Concepts
- **Signature Header**: HTTP header containing HMAC signature of raw body
- **Raw Body**: Unparsed, unmodified request body (JSON string before PHP decodes)
- **Shared Secret**: Secret key known only to sender and receiver
- **Constant-Time Comparison**: `hash_equals()` to prevent timing attacks
- **Body Canonicalization**: Both sides must use the exact same byte sequence

## When To Use
- Any third-party webhook with HMAC signature verification
- Security-sensitive webhooks (payments, account changes)
- Compliance requirements (PCI DSS, SOC 2)

## When NOT To Use
- Signed by other mechanisms (JWT, OAuth)
- Internal webhooks over trusted network
- Third-party doesn't support signing

## Best Practices
- Always read raw body via `$request->getContent()`, not `$request->all()`
- Use `hash_equals()` for all signature comparisons
- Log failed signature attempts for monitoring
- Support multiple signatures for key rotation
- Include timestamp check for replay prevention

## Architecture Guidelines
- Signature validation as middleware on webhook routes
- Secret fetched from config/vault, not hardcoded
- Key rotation support with key ID prefix in header
- Validation failures return 401 without revealing details
- Logging of validation attempts for audit trail

## Performance Considerations
- HMAC computation is ~0.01ms
- `hash_equals()` is constant-time but sub-millisecond
- No external calls needed for validation
- Raw body available from PHP's input stream

## Common Mistakes
- Using `$request->all()` which parses body (JSON encoding differs)
- Using `==` or `===` for signature comparison (timing attack)
- Computing signature over enriched/modified body
- Hardcoding secrets in source code
- Not handling multiple signature headers during key rotation

## Related Topics
- **Prerequisites**: HMAC basics, Laravel request handling
- **Closely Related**: CSRF exclusion, webhook receiving
- **Advanced**: Key rotation strategies, multi-provider validation
- **Cross-Domain**: Security engineering, cryptography basics

## Verification
- [ ] Raw body via `$request->getContent()` for signature computation
- [ ] `hash_equals()` used for comparison
- [ ] Secret stored in config/vault, not hardcoded
- [ ] Failed validations logged for monitoring
- [ ] Key rotation supported via key ID in header
- [ ] Timestamp replay protection implemented
