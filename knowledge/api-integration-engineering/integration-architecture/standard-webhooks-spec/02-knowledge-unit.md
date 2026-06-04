# Metadata
Domain: API Integration Engineering
Subdomain: Event Sourcing for Integrations
Knowledge Unit: Standard Webhooks Specification (Signature Format, Retry, Metadata)
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
The Standard Webhooks specification defines a unified protocol for webhook delivery across different providers, covering signature format (both HMAC-SHA256 symmetric and Ed25519 asymmetric), metadata headers (webhook-id, webhook-timestamp, webhook-signature), retry schedules, idempotency, and verification procedures. Backed by Svix and adopted by Clerk, Liveblocks, and other platforms, it aims to eliminate the fragmentation of custom webhook implementations. The specification includes reference implementations in multiple languages including PHP.

## Core Concepts
- **webhook-id**: Unique event identifier (idempotency key), constant across retries
- **webhook-timestamp**: Unix timestamp of the delivery attempt, changes per retry attempt
- **webhook-signature**: Space-delimited list of signatures (supports zero-downtime key rotation)
- **Signature Scheme**: Sign `msg_id.timestamp.payload` with base64-encoded HMAC-SHA256 (symmetric) or Ed25519 (asymmetric)
- **Retry Schedule**: Specific exponential schedule: 5s → 5m → 30m → 2h → 5h → 10h → 14h → 20h → 24h
- **Idempotency**: webhook-id serves as idempotency key for deduplication at receiver
- **Replay Protection**: Timestamp validation within 5-minute tolerance window
- **Secret Format**: `whsec_` prefix for symmetric secrets, `whsk_`/`whpk_` for asymmetric key pairs

## Mental Models
- **Universal Remote**: Like a universal remote control that works with any TV; Standard Webhooks works with any provider
- **Webhook Esperanto**: A common language for webhooks that everyone can understand
- **Contract Standardization**: Like HTTP itself is standardized; this standardizes webhook headers and signatures

## Internal Mechanics
- Signing payload: `toSign = "${msgId}.${timestamp}.${payload}"` (UTF-8 encoded); `signature = base64(hmac_sha256(toSign, secret))`
- Signature header: `webhook-signature: v1,base64sig v1a,base64sig` (space-delimited for multiple keys during rotation)
- Verification: parse `webhook-signature`, extract version prefix, decode, compare with `hash_equals()` (constant-time)
- Timestamp check: `abs(now - webhook-timestamp) < 300` (5 minutes tolerance)
- Idempotency: Store `webhook-id` for 24h+ to detect duplicates
- Asymmetric: Ed25519 with key pair; sign with private, verify with public; version prefix `v1a`
- Secret format identifies scheme: `whsec_` = symmetric (HMAC-SHA256), `whsk_`/`whpk_` = asymmetric (Ed25519)

## Patterns
- **Signed + Timestamped + Idempotent**: Triple guarantee: integrity (signature), freshness (timestamp), uniqueness (idempotency key)
- **Multi-Signature Verification**: Accept multiple signatures in webhook-signature header for zero-downtime key rotation
- **Receiver-Side Verification Library**: Use one of the reference implementations (PHP, JS, Python, etc.) for correct verification
- **Gateway Adoption**: Webhook gateways (Svix, Convoy) implement the spec; sending through gateway ensures compliance
- **Idempotency Store**: Cache webhook-id in Redis for 5 minutes (minimum) to 24 hours (recommended)
- **Migration without Breakage**: Add Standard Webhooks headers alongside legacy headers; remove legacy after migration period

## Architectural Decisions
- Adopt Standard Webhooks for all outgoing webhooks (future-proofs for gateway migration)
- Verify incoming webhooks using Standard Webhooks libraries when providers support it
- Use symmetric (HMAC-SHA256) for most use cases; asymmetric (Ed25519) when third-party verification is needed
- Set idempotency store TTL to 24 hours (covers all retry attempts)
- Maintain 5-minute timestamp tolerance (matching spec default)
- Implement receiver verification using reference libraries rather than custom implementation

## Tradeoffs
- Standard Webhooks is not backward compatible with existing custom webhook formats (requires migration)
- Asymmetric signing (Ed25519) is more complex but enables public verification without secret sharing
- The signed payload `msg_id.timestamp.payload` is strict; any encoding difference causes verification failure
- Reference implementations simplify adoption but add a dependency
- Migration from legacy format requires running both in parallel during transition

## Performance Considerations
- HMAC-SHA256 signing: <1ms per webhook (same as existing HMAC implementations)
- Ed25519 signing: slightly slower (~2ms) but still negligible
- Verification with constant-time comparison: ~1ms
- Idempotency store lookup (Redis): ~5ms
- Secret format detection: string prefix matching, negligible overhead

## Production Considerations
- Use reference implementations for verification (verified correct, constant-time comparison)
- Maintain 5-minute timestamp tolerance; monitor clock skew between sender and receiver
- Implement idempotency store with Redis (auto-expire after 24h)
- Support multiple signature versions for seamless key rotation
- Log verification failures with sufficient context (which version, what header values) for debugging
- Plan migration from legacy webhook format to Standard Webhooks with parallel operation period

## Common Mistakes
- Not using constant-time comparison (`hash_equals`) for signature verification (timing attack vulnerability)
- Verifying against re-serialized JSON instead of the exact payload string received
- Setting timestamp tolerance too tight (<60s causes clock skew issues) or too loose (>600s weakens replay protection)
- Not handling key rotation: assuming single signature instead of space-delimited list
- Implementing custom verification instead of using reference libraries (introduces subtle bugs)
- Forgetting to scope idempotency store by provider (same webhook-id from different providers collides)

## Failure Modes
- Payload encoding mismatch: sender and receiver encode JSON differently (whitespace, property ordering)
- Timestamp tolerance exceeded: legitimate webhook delayed past tolerance window (rejected incorrectly)
- Key rotation cutover: sender signs with new key but receiver only has old key configured
- Idempotency store overflow: high-volume webhooks exhaust Redis memory (set TTL and max entries)
- Reference library version mismatch: sender uses different spec version than receiver

## Ecosystem Usage
- Svix is the primary steward of the specification; all Svix webhooks follow the standard
- Clerk and Liveblocks ship Standard Webhooks by default
- Standard Webhooks has reference implementations in 10+ languages including PHP
- Webhook gateway services (Svix, Convoy) natively implement the specification
- OpenAPI and AsyncAPI tooling can generate Standard Webhooks-compatible documentation
- The specification is at version 1.0.2 (February 2026) with 1,627+ GitHub stars

## Related Knowledge Units
- K003: HMAC-SHA256 Signature Generation (foundation for the signing scheme)
- K005: Retry Strategies (Standard Webhooks defines specific retry schedule)
- K021: Custom Signature Validator Implementation (Standard Webhooks validator implementation)
- K022: Replay Attack Prevention (timestamp + idempotency key pattern)
- K006: Idempotency Key Pattern (webhook-id as idempotency key)
- K035: Standard Webhooks Specification (this document)

## Research Notes
- Specification: standardwebhooks.com with official GitHub repository (standard-webhooks/standard-webhooks)
- v1.0.2 released February 2026; Apache 2.0 license
- PHP reference implementation available in the standard-webhooks/standard-webhooks repository
- Spec covers both sender (signing, retry) and receiver (verification, idempotency) concerns
- Growing adoption: 1,627+ GitHub stars, 40 contributors across reference implementations
- The spec is designed to work alongside existing legacy webhook implementations for graceful migration
