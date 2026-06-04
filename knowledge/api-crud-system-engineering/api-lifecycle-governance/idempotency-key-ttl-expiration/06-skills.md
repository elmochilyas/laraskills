# Skill: Manage Idempotency Key TTL and Expiration

## Purpose
Configure and manage idempotency key TTL with 24-hour base and sliding extension on retries, two-tier expiration (soft-delete + hard delete), Redis volatile-ttl eviction policy, store monitoring, and compliance-driven active cleanup.

## When To Use
- Every idempotency key implementation
- APIs needing balance between retry window and storage cost
- Systems requiring audit trail of expired idempotency operations

## When NOT To Use
- Systems with no idempotency requirement
- Very short-lived operations where retry window is minutes
- Compliance requirements mandating immediate deletion

## Prerequisites
- Idempotency key design implemented
- Redis or equivalent key-value store
- Understanding of TTL mechanics

## Inputs
- Base TTL duration (default 24 hours)
- Consumer tiers for differentiated TTLs
- Compliance retention requirements

## Workflow
1. Set 24-hour base TTL on idempotency keys with sliding extension — extend by 24h from last request on each replay
2. Implement two-tier expiration: soft-expire after 24h (retain for 7 days audit), then hard-delete
3. Configure Redis `maxmemory-policy volatile-ttl` to evict keys closest to expiration first
4. Monitor idempotency store size (key count, memory usage) — alert at 70% capacity
5. Extend TTL for high-latency consumer tiers (48h mobile, 72h batch)
6. Never store keys without TTL or with indefinite TTL
7. Schedule active cleanup job for compliance-driven deletion beyond passive TTL expiration

## Validation Checklist
- [ ] 24-hour base TTL with sliding extension on retries
- [ ] Two-tier expiration: soft-delete (7d) then hard-delete
- [ ] Redis eviction policy set to `volatile-ttl`
- [ ] Store size monitoring with 70% utilization alert
- [ ] Consumer-specific TTLs for high-latency tiers
- [ ] No keys stored without finite TTL
- [ ] Scheduled active cleanup for compliance deletion

## Common Failures
- Setting TTL too short for real-world retry patterns
- Not extending TTL on retries — consumer retrying at hour 23 expires before completing
- Using passive expiration only (no cleanup monitoring) — Redis memory limits hit
- Forgetting idempotency keys are PII-adjacent and need retention limits
- No strategy for store overflow — keys evicted unpredictably

## Decision Points
- Base TTL: 24 hours default vs shorter (financial ops) vs longer (batch/mobile)
- Soft-delete window: 7 days vs 30 days for compliance-heavy systems
- Consumer-specific TTLs: tier-based vs use-case-based vs fixed

## Performance Considerations
- Redis EXPIRE is O(1) — no performance concern for passive expiration
- Soft-delete copy job batches hourly to minimize load
- ~1 KB per key; 1000 ops/s = ~86 GB at steady state

## Security Considerations
- Idempotency keys are PII-adjacent — limit retention
- Expired keys may still contain sensitive response data — ensure hard deletion actually removes data
- Soft-delete store must have same access controls as active store

## Related Rules
- Set 24-Hour Base TTL with Sliding Extension
- Implement Two-Tier Expiration (Soft + Hard Delete)
- Configure Redis `volatile-ttl` Eviction Policy
- Monitor Idempotency Store Size and Growth
- Extend TTL for High-Latency Consumers
- Never Use Indefinite TTL
- Schedule Active Cleanup for Compliance-Driven Deletion

## Related Skills
- Implement Idempotency Key Design
- Handle Idempotency Key Errors
- Design Rate Limit Tiers

## Success Criteria
- Base TTL enables retries up to 24h from first request
- Sliding extension prevents mid-retry-chain expiration
- Soft-delete provides 7-day audit trail for expired keys
- Redis eviction policy does not evict active keys
- Store utilization stays under 70% with monitoring alerts
- High-latency consumers have adequate TTL
- No unbounded storage growth from indefinite TTLs
- Compliance-driven deletion removes data within regulatory limits
