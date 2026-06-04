# Metadata
Domain: API Integration Engineering
Subdomain: Webhook Systems (Incoming)
Knowledge Unit: Replay Attack Prevention (Timestamp + Nonce Windows)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Replay attacks occur when an attacker intercepts a legitimate webhook request and retransmits it, causing duplicate processing. Prevention combines two mechanisms: timestamp validation (ensuring the webhook is recent within a configurable tolerance window) and nonce/idempotency key deduplication (ensuring each webhook is processed only once). These mechanisms are complementary and typically implemented together for defense in depth.

## Core Concepts
- **Replay Attack**: Capturing a valid webhook request and re-sending it to cause duplicate side effects
- **Timestamp Validation**: Verify that the webhook's timestamp is within an acceptable window (typically 5 minutes) of the current time
- **Nonce (Number Used Once)**: A unique identifier per webhook event, checked against a store of previously processed identifiers
- **Idempotency Key**: A nonce that also serves as a deduplication key for processing logic
- **Tolerance Window**: The acceptable time difference between webhook creation and receipt
- **Timing-Safe Comparison**: Required for signature verification to prevent side-channel attacks

## Mental Models
- **Expired Ticket**: A webhook is like a ticket with a timestamp; tickets outside the window are rejected without checking the signature
- **Ledger of Spent IDs**: The nonce store is a ledger of IDs that cannot be reused, like a list of consumed ticket stubs
- **Two-Layer Security**: Timestamp is the first layer (temporal), nonce is the second layer (uniqueness)

## Internal Mechanics
- Timestamp validation: Compare webhook's timestamp (`webhook-timestamp` header) to server's current time: `abs($now - $timestamp) < $tolerance`
- Nonce deduplication: Store webhook ID (`webhook-id` header) in a cache-backed set with TTL: `Cache::add("webhook:$id", true, $ttl)`
- Combined approach: The Standard Webhooks spec signs `$msgId.$timestamp.$payload`, making both timestamp and nonce tamper-evident
- Stripe uses `t=timestamp` prefix in the signature header; GitHub uses additional timing heuristics
- Success window: A webhook within the tolerance window and with a fresh nonce is valid
- Failure modes: Outside window → reject; inside window with spent nonce → reject as duplicate

## Patterns
- **Timestamp-First Validation**: Check timestamp before nonce and signature to reject old requests early
- **Redis-Backed Nonce Store**: Use Redis with TTL for the nonce store (automatic cleanup of expired entries)
- **Database Unique Constraint**: Use the webhook ID as a unique constraint on the processing table for guaranteed deduplication
- **Multi-Window Tolerance**: Use a sliding window approach (shorter window = more secure, longer window = less false positives)
- **Monotonic Timestamps**: Reject timestamps older than the last successfully processed timestamp per provider (prevents out-of-order replay)

## Architectural Decisions
- Set tolerance window to 5 minutes (standard) to balance security and legitimate clock skew tolerance
- Use Redis for nonce storage when available; fall back to database with unique constraint
- Store nonces with TTL equal to the maximum retry horizon (typically 24 hours for webhook retries)
- Always pair nonce with the provider identity in the store key: `webhook:$provider:$id`
- Implement timestamp validation before signature verification to reject old requests without computational cost

## Tradeoffs
- Tighter tolerance windows are more secure but cause more false rejections from clock skew or delayed delivery
- Longer tolerance reduces false rejections but expands the replay window for attackers
- Nonce storage requires a shared cache in multi-server deployments
- Database unique constraints are durable but slower than Redis for deduplication lookups
- Strict monotonic timestamp ordering can miss legitimate webhooks delivered out of order

## Performance Considerations
- Timestamp comparison is O(1) and negligible
- Redis nonce check with TTL is ~1-5ms per request
- Database unique constraint check is O(1) with index but adds transaction overhead
- Nonce cleanup is automatic with Redis TTL; database cleanup requires a scheduled job
- Batch webhook processing may need batched nonce checks for throughput

## Production Considerations
- Use Redis or Memcached for the nonce store to maintain fast lookups under load
- Monitor nonce collision rates (extremely low with UUID v4) as an indicator of potential attacks
- Set nonce TTL to match the provider's maximum retry period (Stripe: 3 days, GitHub: 1 day)
- Log timestamp rejections with header values (not payload) for debugging clock skew issues
- Implement grace period logging: log when a request is near the edge of the tolerance window for proactive monitoring
- Test with real provider delivery delays (retries, network congestion) to validate tolerance window

## Common Mistakes
- Checking only signature without timestamp, leaving the system vulnerable to replay of captured requests
- Using system clock without NTP synchronization (clock drift causes false rejections)
- Storing nonces without a provider scope (different providers could send same ID)
- Not clearing nonces after TTL expiration, causing unbounded store growth
- Using `in_array()` for nonce checking on large data sets (O(n) vs O(1) with hash lookups)
- Relying on timestamp alone without nonce (an attacker can replay within the window)

## Failure Modes
- NTP failure: server clock unsynced causes all webhooks to fail timestamp validation
- Redis outage: nonce store unavailable causes either: (a) reject all (safe but disruptive), or (b) allow duplicates (unsafe)
- Provider clock skew: legitimate provider clock significantly different from server clock
- Nonce collision: extremely unlikely with UUID v4 but possible with weak random generators
- Database transaction rollback: consumed nonce recorded in a rolled-back transaction allows replay
- Provider retry storm: many retries in quick succession may overwhelm the nonce store

## Ecosystem Usage
- Standard Webhooks specification requires `webhook-id` (nonce) and `webhook-timestamp` headers
- Stripe includes timestamp in its signature format: `t=1635000000,v1=signature`
- Spatie package provides `WebhookProcessor` pipeline where custom timestamp validation can be added
- GitHub does not natively include timestamps; implement custom timestamp validation at receiver
- spatie/laravel-webhook-client does not include built-in replay protection; it must be implemented in the custom validator or webhook profile

## Related Knowledge Units
- K003: HMAC-SHA256 Signature (foundation for signed timestamp+payload verification)
- K006: Idempotency Key Pattern (nonce as idempotency key for processing deduplication)
- K011: Spatie laravel-webhook-client (hosts validator where replay protection is implemented)
- K021: Custom Signature Validator Implementation (where combined sig+timestamp+nonce verification lives)
- K035: Standard Webhooks Specification (defines canonical replay prevention approach)

## Research Notes
- The Standard Webhooks spec defines replay prevention as the combination of `webhook-id` (nonce) and `webhook-timestamp` within a 5-minute tolerance
- Stripe's approach uses timestamp directly in the signature payload, making it tamper-evident
- Industry recommendation: 5-minute tolerance is the standard across major providers (Stripe, GitHub, Standard Webhooks)
- Aaron Eisenberg's guide "Protecting Webhooks in Laravel Applications From Replay Attacks" provides implementation patterns
- Redis `SET` with TTL is the most common production nonce storage pattern
