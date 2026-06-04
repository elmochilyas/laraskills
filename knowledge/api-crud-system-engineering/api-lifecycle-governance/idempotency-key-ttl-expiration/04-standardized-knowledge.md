# ECC Standardized Knowledge — Idempotency Key TTL Expiration

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | Idempotency Key TTL Expiration |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

Idempotency key TTL (time-to-live) and expiration management governs how long idempotency keys are retained, how they are cleaned up, and how expired keys are handled. Base TTL is 24 hours with sliding extension (24h from last request). Soft-delete retains keys for 7 additional days for audit/debugging before hard deletion. Redis EXPIRE handles passive cleanup; scheduled purge handles compliance-driven removal.

## Core Concepts

- **TTL (Time-to-Live)**: Duration idempotency key and cached response remain valid (24 hours).
- **Passive expiration**: Redis automatically removes keys via EXPIRE when TTL elapses.
- **Active cleanup**: Scheduled job removing expired keys and associated data.
- **Soft expiration**: Key expired but response retained for grace period (7 days) for debugging/audit.
- **Hard expiration**: Key and response permanently deleted.
- **Sliding TTL extension**: Key TTL extended by 24h from last successful replay within window.

## When To Use

- Every idempotency key implementation (see Idempotency Key Design)
- APIs needing balance between retry window and storage cost
- Systems requiring audit trail of expired idempotency operations

## When NOT To Use

- Systems with no idempotency requirement
- Very short-lived operations where retry window is minutes
- Compliance requirements demanding immediate deletion

## Best Practices

- **Sliding TTL extension**: Prevent key expiration during long retry chains by extending TTL on each successful replay.
- **Two-tier expiration**: Soft expiration (response retained, key invalidated) followed by hard deletion after 7 days.
- **Redis volatile-ttl eviction policy**: Evict keys closest to expiration first when memory is full.
- **TTL monitoring**: Track distribution of time-since-first-request for replays to inform optimal TTL.
- **Consumer-specific TTLs**: Consider longer TTLs for high-latency consumers (mobile apps, batch processors).

## Architecture Guidelines

- Base TTL = 24 hours. Sliding extension = 24 hours from last request.
- Soft-delete window = 7 days. After that, hard deletion via scheduled purge.
- Redis eviction policy: `maxmemory-policy volatile-ttl`.
- Soft-delete copy runs once per hour in batch to minimize load.
- Monitor store size: ~1 KB per key (key + response). 1000 ops/s = ~86 GB at steady state.

## Performance Considerations

- Redis EXPIRE is O(1) — no performance concern for passive expiration.
- Soft-delete copy job batches hourly to minimize load.
- Idempotency store size: 86M keys at 1000 ops/s = ~86 GB. Plan Redis memory accordingly.
- Key lookup with TTL check is sub-millisecond.

## Security Considerations

- Idempotency keys are PII-adjacent (can correlate consumer activity). Limit retention.
- Expired keys may still contain sensitive response data — ensure hard deletion actually removes data.
- Soft-delete store must have same access controls as active store.

## Common Mistakes

- Setting TTL too short for real-world retry patterns (network issues can cause delays > 1 hour).
- Not extending TTL on retries — consumer retrying at hour 23 expires before retry completes.
- Using passive expiration only (no cleanup monitoring) — may hit Redis memory limits.
- Forgetting idempotency keys are PII-adjacent and need retention limits.
- No strategy for store overflow — keys evicted unpredictably under memory pressure.

## Anti-Patterns

- **No TTL on keys**: Keys persist indefinitely — unbounded storage growth.
- **Fixed TTL without extension**: Consumer with long retry chain loses idempotency guarantee mid-retry.
- **Hard deletion without soft-delete audit trail**: Lost debugging capability for expired-key issues.

## Examples

- Redis config: `maxmemory-policy volatile-ttl`, `maxmemory 100gb`.
- Laravel cache: `Cache::put($key, $response, 86400)` — 24-hour TTL.
- Sliding extension: On replay hit, `Cache::expire($key, 86400)` to reset TTL.

## Related Topics

- **Prerequisites**: Idempotency Key Design, Idempotency Key Error Handling
- **Closely Related**: Rate Limit Tier Design, API Usage Tracking
- **Advanced**: Storage-efficient idempotency key encoding (Bloom filters), Idempotency key analytics, Cross-region idempotency store replication

## AI Agent Notes

When managing idempotency key TTL: set 24-hour base TTL with sliding extension on retries, use two-tier expiration (soft 7d + hard delete), configure Redis volatile-ttl eviction, monitor store size, plan for ~86 GB per 1000 ops/s, extend TTL for high-latency consumers if needed.

## Verification

Sources: Redis EXPIRE documentation, Stripe 24-hour TTL, Twilio sliding window extension, AWS ClientToken TTLs, domain-analysis.md.
