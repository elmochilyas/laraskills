# Signed Request Pattern

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
A signed request pattern (also called HMAC request signing) verifies the authenticity and integrity of an HTTP request by including a cryptographic signature computed from the request body, headers, and a shared secret. The receiver recomputes the signature using the same secret and rejects the request if the signatures do not match. This pattern is essential for webhook callbacks, M2M communication without bearer tokens, API idempotency guarantees, and scenarios where request integrity (not just authentication) must be guaranteed.

## Core Concepts
- **HMAC (Hash-based Message Authentication Code)**: A cryptographic hash function combined with a secret key. HMAC-SHA256 is the standard choice.
- **Signature**: An HMAC digest computed over selected request components (method, URI, body, timestamp, nonce).
- **Nonce**: A unique, single-use value that prevents replay attacks.
- **Timestamp**: Included in the signature computation to limit the validity window.
- **Replay attack**: An attacker intercepts a signed request and replays it later. Timestamp + nonce prevent this.
- **Shared secret**: A symmetric key known to both sender and receiver. For webhooks, this is the webhook signing secret.

## Mental Models
- **Signed request as wax seal**: The HMAC signature is a wax seal on a letter. Anyone can see the letter (request body), but the seal proves it came from the right person and wasn't tampered with.
- **Timestamp + nonce as expiration date**: Like a ticket that must be used within 5 minutes and only once. Even if stolen, the ticket expires.
- **Shared secret as handshake**: Both parties know the same handshake. If the handshake matches, you know it's the right counterparty.

## Internal Mechanics
1. **Sender preparation**: Construct the canonical request string: `HTTP_METHOD + "\n" + URI_PATH + "\n" + TIMESTAMP + "\n" + NONCE + "\n" + BODY_HASH`.
2. **Signing**: Compute `HMAC-SHA256(secret, canonical_string)` → base64-encoded signature.
3. **Header injection**: Add headers: `X-Signature: <base64_hmac>`, `X-Timestamp: <unix_time>`, `X-Nonce: <uuid>`.
4. **Receiver validation**:
   - Check timestamp is within acceptable skew window (±5 minutes).
   - Check nonce has not been used before (store in cache with TTL).
   - Recompute the signature from received data.
   - Compare computed signature with `X-Signature` header using constant-time comparison.
   - Reject if mismatch.
5. **Body integrity**: Hash the body with SHA-256 before signing. This detects body tampering in transit.

## Patterns
- **Webhook signing**: When your app sends webhooks to external services, sign each webhook payload. The receiver verifies the signature using a pre-shared secret.
- **Incoming webhook verification**: When receiving webhooks from Stripe, GitHub, or PayPal, verify the incoming signature using their published secrets.
- **Internal service-to-service signing**: Use signed requests between microservices instead of bearer tokens. Each service pair shares a secret.
- **Idempotency via nonce**: Use the nonce as an idempotency key. The receiver processes the request only if the nonce hasn't been seen before.
- **Query string signing**: For GET requests (no body), sign the query parameters: `https://api.example.com/resource?param1=val1&signature=...&expires=...`.
- **Laravel signed URLs**: Laravel's built-in `URL::signedRoute()` uses HMAC to sign URLs for one-time access (e.g., email verification links, unsubscribe links).

## Architectural Decisions
1. **What to sign**: Minimally include method, URI, timestamp, nonce, and body hash. Including headers (e.g., `Content-Type`) adds robustness but complexity.
2. **Timestamp window**: 5 minutes is standard. 1 minute for high-security. 15 minutes for webhooks that may be delayed. Balance security against delivery reliability.
3. **Nonce storage**: Use Redis with TTL equal to the timestamp window. For high-volume systems, use a Bloom filter for efficient nonce deduplication.
4. **Secret storage**: Store shared secrets encrypted at rest. Use a secrets manager (Vault, AWS Secrets Manager) for production systems.

## Tradeoffs (table)
| Aspect | Bearer Token (Sanctum) | Signed Request (HMAC) |
|--------|----------------------|---------------------|
| Mechanism | Token in header | Cryptographic signature |
| Replay protection | None (token reused) | Built-in (nonce + timestamp) |
| Integrity check | No (body can be modified) | Yes (body is part of signature) |
| Complexity | Low | Medium |
| Secret rotation | Regenerate token | Rotate shared secret between parties |
| Stateless verification | Yes (DB or cache) | Yes (can pre-share public key) |
| Idempotency | Separate header | Nonce serves both purposes |
| Webhook standard | Rarely used | Industry standard (Stripe, GitHub) |

## Performance Considerations
- HMAC computation is fast (microseconds with modern CPUs). No database query for token lookup.
- Nonce deduplication requires a cache lookup. Use Redis INCR with TTL for atomic nonce checking.
- Constant-time comparison (`hash_equals()` in PHP) prevents timing attacks. Always use it.
- Signing large payloads (1MB+) requires computing SHA-256 of the body. This is CPU-bound. Consider signing only specific fields for very large payloads.

## Production Considerations
- **Clock sync**: Sender and receiver clocks must be synchronized via NTP. Clock skew > 5 minutes causes legitimate requests to be rejected.
- **Secret rotation**: Establish a rotation policy. Use key versioning: accept signatures with `v1` or `v2` during rotation periods.
- **Nonce garbage collection**: Nonces stored in Redis should have automatic TTL via Redis EXPIRE. For database storage, schedule a cleanup job.
- **Error responses**: Return `401` with `X-Signature-Error: timestamp_expired`, `nonce_reused`, or `signature_mismatch` to help senders debug.
- **Debugging**: Log the canonical request string and computed signature (without the secret) during development to help integration testing.
- **Retry handling**: If a webhook receiver returns 401 due to signature mismatch, retry with a fresh timestamp and nonce.

## Common Mistakes
- Using non-constant-time comparison (`==` instead of `hash_equals()`), vulnerable to timing attacks.
- Not including the HTTP method in the canonical string (attacker changes GET to DELETE and the signature still matches).
- Not including the request body hash (attacker modifies the body and the signature is still valid).
- Reusing nonces (total defeat of replay protection).
- Storing the shared secret in version control.
- Timestamp window too large (>15 minutes), allowing replay attacks.
- Signing only the body but not the headers — an attacker can modify Content-Type or other critical headers.
- Implementing a custom HMAC library instead of using PHP's built-in `hash_hmac()`.

## Failure Modes
1. **Clock drift between services**: Server A's clock is 3 minutes ahead of Server B's. Signed requests from A to B constantly rejected. Solution: NTP sync on all servers; 5-minute tolerance.
2. **Nonce collision**: Two requests generate the same nonce (extremely unlikely with UUID v4, but possible with weak random generators). Solution: Use a combination of nonce + sender ID for deduplication.
3. **Signature mismatch due to encoding**: Sender encodes body with different JSON encoding (e.g., no spaces vs spaces). Solution: Canonicalize the body before signing (sorted keys, no whitespace).
4. **Replay attack within timestamp window**: Attacker replays the request within the 5-minute window before the nonce expires. Solution: Use nonce deduplication with immediate invalidation.
5. **Secret rotation desynchronization**: Sender rotates secret but receiver still uses the old one. Solution: Accept two active secrets during rotation (current + previous).

## Ecosystem Usage
- **Stripe webhooks**: Uses HMAC-SHA256 with a signing secret. The signature is in the `Stripe-Signature` header along with timestamp and signature list.
- **GitHub webhooks**: Uses HMAC-SHA1 or HMAC-SHA256 with a secret token. Signature in `X-Hub-Signature-256` header.
- **AWS Signature V4**: A sophisticated signing protocol that signs the entire HTTP request including headers, query string, and body. Used by all AWS SDKs.
- **Laravel signed URLs**: `URL::signedRoute()` and `URL::temporarySignedRoute()` use HMAC for one-time access URLs.

## Related Knowledge Units
### Prerequisites
- HMAC and hashing fundamentals
- HTTP request/response lifecycle

### Related Topics
- [api-key-pattern](./phase-2/06-api-key-pattern.md)
- [api-specific-middleware](./phase-2/15-api-specific-middleware.md)

### Advanced Follow-up Topics
- AWS Signature V4 implementation details
- PAKE (Password-Authenticated Key Exchange) protocols
- TLS client certificates as an alternative to signing

## Research Notes
### Source Analysis
PHP's `hash_hmac()` and `hash_equals()` are the core functions. Laravel's `Illuminate\Routing\UrlGenerator` shows the signed URL implementation. Stripe's webhook signature specification (https://stripe.com/docs/webhooks/signatures) is an excellent reference.

### Key Insight
The signed request pattern solves two problems that bearer tokens do not: integrity (body cannot be modified) and replay prevention (nonce + timestamp). This makes it the preferred choice for webhooks and high-security M2M communication. However, it requires the sender to manage secrets and timestamps — acceptable for servers but not for mobile or browser clients.

### Version-Specific Notes
- Laravel's signed URLs (`URL::signedRoute()`) use HMAC-SHA256 by default since Laravel 8.
- The `hash_hmac()` function in PHP 8.1+ has improved performance for repeated calls.
- No major changes in PHP 8.3/8.4 relevant to HMAC computation.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.