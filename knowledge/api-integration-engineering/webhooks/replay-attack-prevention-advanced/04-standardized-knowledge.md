# ECC Standardized Knowledge — Replay Attack Prevention (Timestamp + Nonce Windows)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit ID | ku-04 |
| Knowledge Unit | Replay Attack Prevention (Timestamp + Nonce Windows) |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K022, K003, K006 |

## Overview (Engineering Value)
Replay attacks occur when an attacker intercepts a legitimate webhook and retransmits it, causing duplicate processing. Prevention combines timestamp validation (ensuring the webhook is recent within a tolerance window) and nonce/idempotency key deduplication (ensuring each webhook is processed once). These two mechanisms are complementary and implemented together for defense-in-depth. Stripe, Standard Webhooks, and Spatie packages all support variants of this pattern.

## Core Concepts
- **Replay Attack**: Captured webhook re-sent to cause duplicate side effects
- **Timestamp Validation**: `abs($now - $timestamp) < $tolerance` — rejects old requests
- **Nonce (Number Used Once)**: Unique event ID checked against previously processed IDs
- **Idempotency Key**: Nonce that also serves as deduplication for processing logic
- **Tolerance Window**: Standard 5-minute window balances security and clock skew

## When To Use
- All webhook endpoints handling financial or state-mutating events
- Any webhook processing that must be idempotent
- Multi-tenant SaaS receiving webhooks from external providers

## When NOT To Use
- Internal webhooks within trusted network (nonce alone may suffice)
- Read-only webhook notifications that don't trigger mutations
- Development environments where replay testing is intentional

## Best Practices
- Validate timestamp before nonce and signature to reject old requests early
- Use Redis-backed nonce store with TTL equal to max retry horizon (24h)
- Always scope nonces by provider: `webhook:$provider:$id`
- Set tolerance window to 5 minutes (standard across major providers)
- Pair timestamp validation with database unique constraints for guaranteed deduplication

## Architecture Guidelines
- Validate timestamp in custom SignatureValidator before crypto operations
- Nonce store in Redis with `Cache::add()` for atomic deduplication
- Database unique constraint on `(provider, webhook_id)` for durability
- TTL on nonce store = provider's maximum retry period (Stripe: 3 days)
- Log timestamp rejections for clock skew monitoring

## Performance Considerations
- Timestamp comparison: O(1), negligible
- Redis nonce check: ~1-5ms per request
- Database unique constraint: O(1) with index, adds transaction overhead
- Nonce cleanup: automatic with Redis TTL; scheduled job for database

## Security Considerations
- Timestamp alone is insufficient (attacker can replay within the window)
- Nonce alone is insufficient (attacker can replay before nonce is stored)
- Both mechanisms required together for replay protection
- Use monotonic timestamps per provider when ordering matters
- NTP synchronization is critical; unsynchronized clocks cause false rejections

## Common Mistakes
- Checking only signature without timestamp (vulnerable to replay)
- Using system clock without NTP synchronization
- Not scoping nonces by provider (different providers may send same ID)
- Not clearing nonces after TTL expiration (unbounded store growth)
- Relying on timestamp alone without nonce

## Anti-Patterns
- Timestamp-only validation without nonce
- Single nonce namespace for all providers
- Nonce store without TTL (infinite growth)
- Using `in_array()` for nonce checking (O(n) vs O(1) hash lookup)

## Examples
```php
class ReplayProtectionValidator implements SignatureValidator
{
    public function isValid(Request $request, WebhookConfig $config): bool
    {
        $timestamp = $request->header('webhook-timestamp');
        if (abs(now()->timestamp - $timestamp) > 300) return false;

        $id = $request->header('webhook-id');
        $key = "webhook:{$config->name}:{$id}";
        if (!Cache::add($key, true, now()->addHours(24))) return false;

        // Proceed with signature verification
        return true;
    }
}
```

## Related Topics
- **Prerequisites**: HMAC-SHA256 signature, nonce generation
- **Closely Related**: Idempotency keys, signature verification, CSRF bypass
- **Advanced**: Monotonic timestamp ordering, Replay detection analytics
- **Cross-Domain**: Network security, cryptography, Redis caching

## AI Agent Notes
- Always include timestamp + nonce validation in webhook receiver code
- Default tolerance window to 5 minutes
- Scope nonce store by provider to prevent collision

## Verification
- [ ] Timestamp validation with configurable tolerance window
- [ ] Nonce store with provider-scoped keys and TTL
- [ ] Redis used for production nonce store
- [ ] Database unique constraint as durability fallback
- [ ] Clock skew monitoring via NTP
- [ ] Replay attempts logged for security monitoring
