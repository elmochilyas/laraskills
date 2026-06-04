# Metadata
Domain: API Integration Engineering
Subdomain: HTTP Client & API Consumption Patterns
Knowledge Unit: HMAC-SHA256 Webhook Signature Generation and Verification
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
HMAC-SHA256 is the dominant mechanism for webhook payload authentication, used by Stripe, GitHub, Slack, and the Standard Webhooks specification. It employs a shared secret to produce a cryptographic signature that verifies payload integrity and authenticity. The pattern requires raw-body signing, timing-safe comparison, support for multiple signature versions during key rotation, and defense against replay attacks through timestamp binding.

## Core Concepts
- HMAC (Hash-Based Message Authentication Code) combines a cryptographic hash with a shared secret key
- SHA-256 provides 256-bit (32-byte) output regardless of input size
- `hash_hmac('sha256', $payload, $secret)` produces the canonical PHP signature
- Timing-safe comparison via `hash_equals($expected, $actual)` prevents side-channel attacks
- Raw request body must be signed (not parsed/re-encoded JSON which may differ)
- Signature prefix versions (`v1,`, `v2,`) enable zero-downtime key rotation

## Mental Models
- **Sealed Envelope**: The HMAC signature is a wax seal on an envelope; breaking any part of the payload invalidates the seal
- **Shared Secret: Shared Key**: Like a password shared between sender and receiver, never transmitted over the channel
- **Signature as Evidence**: The signature proves the payload came from someone holding the secret and wasn't tampered in transit

## Internal Mechanics
- Signing: `base64_encode(hash_hmac('sha256', $payload, $secret, true))`
- Verification: Recompute signature using same key and algorithm, compare with provided signature using `hash_equals()`
- Raw body requirement: JSON parsing then re-encoding changes whitespace and key order; signing must use the raw `php://input`
- Multi-signature support: Signature header often contains space-delimited `v1,sig1 v2,sig2` for rotation transitions
- Timestamp binding: Prepending timestamp `$timestamp.$payload` before signing enables replay detection

## Patterns
- **Verify Then Process**: Always verify signature before any database writes or business logic
- **Fail Closed**: Return 500/403 on invalid signature; do not return helpful error details that aid attackers
- **Multi-Secret Verification**: Try each configured secret when rotating keys; verify against first match
- **Constant-Time Always**: Use `hash_equals()` even in non-production environments to avoid behavioral differences
- **Raw Body Capture**: Read `$request->getContent()` (Laravel) or `file_get_contents('php://input')` (PHP) before any parsing

## Architectural Decisions
- Choose SHA-256 over SHA-1 (deprecated) or MD5 (broken)
- Store secrets as Symfony `REDACTED` or Laravel vault values, never in source code or logs
- Use provider-specific signature validators as custom classes implementing `SignatureValidator` interface
- Accept multiple signature versions for graceful rotation without downtime

## Tradeoffs
- Symmetric HMAC requires shared secret distribution; asymmetric (Ed25519) eliminates shared secrets but increases complexity
- Raw-body comparison is strict; any encoding difference (newline, whitespace) causes verification failure
- Multi-signature verification is slower but enables key rotation without delivery gaps
- Timestamp binding reduces replay window but introduces clock skew edge cases

## Performance Considerations
- HMAC-SHA256 is extremely fast (< 1ms for typical payloads) and not a bottleneck
- `hash_equals()` is constant-time but marginally slower than `===`; the difference is negligible
- Base64 decoding of the provided signature is the most expensive single operation
- Multi-secret verification doubles verification time per additional secret

## Production Considerations
- Store signing secrets in environment variables or secret vaults, never in database
- Rotate secrets regularly (every 90 days recommended) using the multi-signature transition period
- Monitor invalid signature rates to detect potential attacks or misconfigured senders
- Log signature verification failures with minimal detail (no payloads, no full signatures)
- Set up alerting for a spike in invalid signatures as a potential attack indicator

## Common Mistakes
- Verifying against re-encoded JSON instead of raw request body (whitespace differences cause false negatives)
- Using `===` instead of `hash_equals()` for comparison, creating timing side-channel
- Logging the raw payload or signature in error logs, exposing secrets
- Not handling edge cases: empty payload, missing signature header, multiple signatures
- Signing parsed data (e.g., `json_encode($request->all())`) instead of raw body

## Failure Modes
- Webhook provider changes signature format without notice (version prefix changes)
- Shared secret mismatch causes all webhooks to fail verification
- Clock skew beyond tolerance window causes legitimate timestamp-bound signatures to fail
- Payload encoding differences (UTF-8 BOM, line endings) produce mismatched signatures
- Load balancer modifies request body (compression, transformation) before signature check

## Ecosystem Usage
- Spatie laravel-webhook-client uses `DefaultSignatureValidator` with `hash_hmac('sha256', ...)`
- Stripe uses HMAC-SHA256 with a timestamp prefix format: `t=timestamp,v1=signature`
- GitHub uses HMAC-SHA256 with `X-Hub-Signature-256` header (sha256= prefix)
- Standard Webhooks spec defines both HMAC-SHA256 (symmetric, `whsec_` prefix) and Ed25519 (asymmetric)
- Slack uses a slightly different pattern with versioned signatures (`v0=`)
- Svix/Convoy webhook gateways implement the Standard Webhooks signature scheme

## Related Knowledge Units
- K011: Spatie laravel-webhook-client Configuration (uses HMAC verification)
- K021: Custom Signature Validator Implementation (extends HMAC for non-standard providers)
- K022: Replay Attack Prevention (timestamp binding prevents replay)
- K035: Standard Webhooks Specification (defines canonical signature format)

## Research Notes
- The Standard Webhooks specification defines a unified approach: sign `msg_id.timestamp.payload` with base64 HMAC-SHA256
- Stripe's signature format (`t=timestamp,v1=signature`) differs from Standard Webhooks but uses the same underlying HMAC
- `hash_hmac()` in PHP supports `true` (raw binary) and `false` (hex) output modes; base64 is most common
- The IETF HMAC RFC 2104 defines the HMAC algorithm; SHA-256 variant is FIPS-compliant
