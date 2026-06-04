# ECC Standardized Knowledge — Signed Request Pattern

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | Signed Request Pattern |
| Difficulty | Intermediate |
| Category | Authentication / Integrity |
| Last Updated | 2026-06-02 |

## Overview

A signed request pattern (HMAC request signing) verifies authenticity and integrity by including a cryptographic signature computed from the request components and a shared secret. The receiver recomputes the signature and rejects mismatches. This pattern is essential for webhook callbacks, M2M communication without bearer tokens, and scenarios where both authentication and request integrity must be guaranteed.

## Core Concepts

- **HMAC-SHA256**: Cryptographic hash with secret key. Standard choice for request signing.
- **Signature**: HMAC digest over method, URI, timestamp, nonce, and body hash.
- **Nonce**: Single-use value preventing replay attacks. Stored in cache with TTL.
- **Timestamp**: Included in signature to limit validity window (typically ±5 minutes).
- **Replay attack**: Intercepted signed request replayed later. Timestamp + nonce prevent this.
- **Shared secret**: Symmetric key known to both sender and receiver.

## When To Use

- Webhook payload signing (outgoing webhooks from your app)
- Incoming webhook verification (Stripe, GitHub, PayPal)
- Internal service-to-service authentication with integrity guarantees
- APIs requiring replay protection beyond bearer tokens
- Idempotent operations where nonce serves dual purpose
- Laravel signed URLs for one-time access (email verification, unsubscribe)

## When NOT To Use

- Browser-based clients (cannot manage secrets securely)
- Mobile apps (secrets extracted from binary)
- Simple authentication without integrity requirements (use Sanctum tokens)
- Public API endpoints (no shared secret to distribute)
- When TLS already provides integrity (but TLS does not prevent replay)

## Best Practices

- **Use `hash_hmac()` and `hash_equals()`**: PHP's built-in functions. `hash_equals()` provides constant-time comparison preventing timing attacks.
- **Include method, URI, body hash in signature**: Prevents method tampering (GET→DELETE) and body modification.
- **Canonicalize before signing**: Sort JSON keys, standardize whitespace to prevent signature mismatches from encoding differences.
- **5-minute timestamp window**: Balances security with delivery reliability. 1 minute for high-security.
- **Nonce deduplication via Redis**: SET NX with TTL equal to timestamp window. Reject on duplicate nonce.
- **Two active secrets during rotation**: Accept current + previous secret to avoid desynchronization.
- **Error headers for debugging**: Return `X-Signature-Error: timestamp_expired | nonce_reused | signature_mismatch`.

## Architecture Guidelines

- Validation runs as middleware before the controller.
- Store shared secrets encrypted at rest. Use a secrets manager (Vault, AWS Secrets Manager) for production.
- Key versioning in signature: include key ID in headers so receiver knows which secret to use.
- For high-volume systems, use Bloom filter for efficient nonce deduplication.
- Laravel's `URL::signedRoute()` uses this pattern — reference implementation for one-time URLs.

## Performance Considerations

- HMAC computation is microseconds. No database lookup for token validation.
- Nonce deduplication requires one Redis call per request. Use pipelining for batch operations.
- SHA-256 of large payloads (1MB+) is CPU-bound. For very large payloads, sign only specific fields.
- Constant-time comparison adds no measurable overhead.

## Security Considerations

- **Non-constant-time comparison** (`==` instead of `hash_equals()`): Vulnerable to timing attacks. Always use `hash_equals()`.
- **Missing body hash**: Attacker can modify body without changing signature.
- **Missing method in canonical string**: Attacker changes GET to DELETE.
- **Nonce reuse**: Defeats replay protection entirely.
- **Timestamp window too large** (>15 minutes): Allows replay attacks within that window.
- **Clock skew**: Sender/receiver clocks must be NTP-synced. 5-minute tolerance handles most skew.

## Common Mistakes

- **`==` instead of `hash_equals()`**: Timing attack vulnerability leaks signature byte-by-byte.
- **Missing HTTP method in canonical string**: Method tampering undetected.
- **Missing body hash**: Body modification undetected.
- **Reusing nonces**: Total loss of replay protection.
- **Secret in version control**: Exposure via repository access.
- **Custom HMAC implementation**: Use PHP's built-in `hash_hmac()`.

## Anti-Patterns

- **Signed requests for browser clients**: Secrets cannot be stored securely in browsers. Use token auth.
- **Bearer tokens with signed request patterns**: Redundant. Choose one pattern.
- **No nonce, only timestamp**: Replay within timestamp window still possible.

## Examples

- Stripe signature verification: `Stripe-Signature` header contains timestamp + signature list → recompute HMAC-SHA256 with webhook secret → compare.
- Laravel signed URL: `URL::temporarySignedRoute('unsubscribe', now()->addHours(24), ['user' => $user->id])` generates HMAC-signed one-time link.

## Related Topics

- **Prerequisites**: HMAC and hashing fundamentals, HTTP request/response lifecycle
- **Closely Related**: API Key Pattern, API-Specific Middleware
- **Advanced**: AWS Signature V4, PAKE protocols, TLS client certificates
- **Cross-Domain**: Security & Identity Engineering

## AI Agent Notes

When generating signed request code: use `hash_hmac('sha256', ...)` and `hash_equals()`, include method/URI/body/timestamp/nonce in signature, use 5-minute window, store nonces in Redis with TTL, accept two secrets during rotation, provide signature error headers.

## Verification

Sources: PHP `hash_hmac()` docs, Stripe webhook signing spec, Laravel `URL::signedRoute()` source, domain-analysis.md.
