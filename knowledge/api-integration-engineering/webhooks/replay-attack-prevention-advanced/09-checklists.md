# Replay Attack Prevention (Timestamp + Nonce Windows) — Checklist

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** Incoming Webhooks
- **Knowledge Unit:** Replay Attack Prevention (Timestamp + Nonce Windows)
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand HMAC-SHA256 signature verification concepts
- [ ] Familiarity with nonce generation and idempotency keys
- [ ] Knowledge of Redis cache operations for distributed nonce store

## Implementation Checklist
- [ ] Timestamp validation with configurable tolerance window (default 5 minutes)
- [ ] Nonce store with provider-scoped keys and TTL
- [ ] Redis used for production nonce store
- [ ] Database unique constraint as durability fallback
- [ ] Clock skew monitoring via NTP
- [ ] Replay attempts logged for security monitoring
- [ ] Timestamp validated before nonce and signature to reject old requests early

## Verification Checklist
- [ ] Both timestamp AND nonce validation implemented together
- [ ] Nonce TTL set to provider's maximum retry period (Stripe: 3 days)
- [ ] Database unique constraint on `(provider, webhook_id)` for durability

## Security Checklist
- [ ] Timestamp alone insufficient — requires nonce
- [ ] Nonce alone insufficient — requires timestamp
- [ ] Both mechanisms required together for defense-in-depth
- [ ] NTP synchronization critical; unsynchronized clocks cause false rejections
- [ ] Nonces scoped by provider to prevent collision

## Performance Checklist
- [ ] Timestamp comparison: O(1), negligible
- [ ] Redis nonce check: ~1-5ms per request
- [ ] Database unique constraint: O(1) with index
- [ ] Nonce cleanup automatic with Redis TTL

## Production Readiness Checklist
- [ ] Replay protection in custom SignatureValidator before crypto operations
- [ ] Nonce store in Redis with `Cache::add()` for atomic deduplication
- [ ] Timestamp rejections logged for clock skew monitoring
- [ ] Scheduled job for database nonce cleanup

## Common Mistakes to Avoid
- [ ] Avoid checking only signature without timestamp (vulnerable to replay)
- [ ] Avoid using system clock without NTP synchronization
- [ ] Avoid not scoping nonces by provider (different providers may send same ID)
- [ ] Avoid not clearing nonces after TTL expiration (unbounded store growth)
- [ ] Avoid relying on timestamp alone without nonce
