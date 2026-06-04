# ECC Standardized Knowledge — Standard Webhooks Specification (Signature, Retry, Metadata)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit ID | ku-06 |
| Knowledge Unit | Standard Webhooks Specification (Signature, Retry, Metadata) |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K035, K003, K005, K006, K021, K022 |

## Overview (Engineering Value)
The Standard Webhooks specification defines a unified protocol for webhook delivery: signature format (HMAC-SHA256 symmetric or Ed25519 asymmetric), metadata headers (webhook-id, webhook-timestamp, webhook-signature), retry schedule, and idempotency. Backed by Svix and adopted by Clerk, Liveblocks, it aims to eliminate fragmented custom webhook implementations. Reference implementations exist in 10+ languages including PHP.

## Core Concepts
- **webhook-id**: Unique event identifier, constant across retries (idempotency key)
- **webhook-timestamp**: Unix timestamp of delivery attempt, changes per retry
- **webhook-signature**: Space-delimited list of signatures for key rotation
- **Signing Scheme**: `hmac_sha256(msg_id.timestamp.payload, secret)` base64-encoded
- **Retry Schedule**: 5s → 5m → 30m → 2h → 5h → 10h → 14h → 20h → 24h
- **Tolerance Window**: 5-minute timestamp validation for replay protection

## When To Use
- All outgoing webhooks for future-proofing and interoperability
- Receiving webhooks from providers that implement the spec (Svix, Clerk)
- Building B2B SaaS platforms that send webhooks to subscribers
- Migration from legacy webhook formats to standardized format

## When NOT To Use
- Providers with incompatible legacy formats (dual-run during migration)
- Internal webhooks where standardization doesn't add value
- Very simple webhook needs where full spec overhead isn't justified

## Best Practices
- Use reference implementations for verification (tested, constant-time safe)
- Adopt for all outgoing webhooks; future-proofs for gateway migration
- Use symmetric HMAC-SHA256 for most cases; Ed25519 for third-party verification
- Set idempotency store TTL to 24 hours (covers all retry attempts)
- Maintain 5-minute timestamp tolerance matching spec default

## Architecture Guidelines
- Implement Standard Webhooks for all outgoing webhook dispatch
- Verify incoming webhooks using reference PHP library
- Support multiple signature versions for key rotation
- Scope idempotency store by provider to prevent collision
- Plan migration from legacy format with parallel operation period

## Performance Considerations
- HMAC-SHA256 signing: <1ms per webhook
- Ed25519 signing: ~2ms (negligible)
- Verification using constant-time comparison: ~1ms
- Idempotency store lookup (Redis): ~5ms

## Security Considerations
- Constant-time comparison (`hash_equals`) mandatory for verification
- Verify against exact raw payload, not re-serialized JSON
- Timestamp tolerance: too tight causes clock skew issues; too loose weakens replay protection
- Store secrets with `whsec_`/`whsk_` prefix for scheme identification
- Support multiple signatures for zero-downtime key rotation

## Common Mistakes
- Not using constant-time comparison (timing attack vulnerability)
- Verifying re-serialized JSON instead of exact payload received
- Timestamp tolerance too tight (<60s) or too loose (>600s)
- Not handling key rotation (single signature instead of list)
- Custom verification instead of reference libraries (subtle bugs)

## Anti-Patterns
- Custom verification implementation avoiding reference libraries
- Single secret per subscriber without rotation support
- No idempotency store for duplicate detection
- Verification against transformed payload instead of raw body

## Examples
```php
// Reference implementation pattern
$toSign = "{$webhookId}.{$timestamp}.{$payload}";
$signature = base64_encode(hash_hmac('sha256', $toSign, $secret, true));
// Header: webhook-signature: v1,{base64sig}
```

## Related Topics
- **Prerequisites**: HMAC-SHA256, idempotency keys, replay prevention
- **Closely Related**: Webhook gateways (Svix, Convoy), webhook signatures
- **Advanced**: Ed25519 asymmetric signing, multi-key rotation strategies
- **Cross-Domain**: Webhook standards, API interoperability

## AI Agent Notes
- Use Standard Webhooks format for all outgoing webhook generation
- Reference the PHP reference implementation for verification code
- Include webhook-id as idempotency key in generated webhook code

## Verification
- [ ] Outgoing webhooks signed with Standard Webhooks format
- [ ] Reference verification library used for incoming
- [ ] Idempotency store with 24h TTL implemented
- [ ] 5-minute timestamp tolerance configured
- [ ] Multi-signature header parsing for key rotation
- [ ] Migration plan from legacy format documented
